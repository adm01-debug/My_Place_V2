
-- 1) Enum de frequência
DO $$ BEGIN
  CREATE TYPE public.notif_digest_freq AS ENUM ('imediato','horario','diario','semanal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Preferência por categoria
ALTER TABLE public.notificacao_preferencias
  ADD COLUMN IF NOT EXISTS digest_frequencia public.notif_digest_freq NOT NULL DEFAULT 'imediato';

-- 3) Ampliar status permitido em entregas
ALTER TABLE public.notificacao_entregas DROP CONSTRAINT IF EXISTS notificacao_entregas_status_check;
ALTER TABLE public.notificacao_entregas
  ADD CONSTRAINT notificacao_entregas_status_check
  CHECK (status = ANY (ARRAY['enviado','bloqueado','falhou','agrupado']));

-- 4) Fila de digest
CREATE TABLE IF NOT EXISTS public.notificacao_digest_fila (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria public.notif_categoria NOT NULL,
  nivel public.notif_nivel NOT NULL DEFAULT 'info',
  tipo public.tipo_notificacao NOT NULL,
  titulo text NOT NULL,
  mensagem text NOT NULL,
  link text,
  created_at timestamptz NOT NULL DEFAULT now(),
  agrupado_em timestamptz,
  notificacao_resumo_id uuid REFERENCES public.notificacoes(id) ON DELETE SET NULL
);

GRANT SELECT ON public.notificacao_digest_fila TO authenticated;
GRANT ALL    ON public.notificacao_digest_fila TO service_role;

ALTER TABLE public.notificacao_digest_fila ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user reads own digest queue" ON public.notificacao_digest_fila;
CREATE POLICY "user reads own digest queue"
  ON public.notificacao_digest_fila FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_digest_fila_user_pend
  ON public.notificacao_digest_fila (user_id, categoria, created_at)
  WHERE agrupado_em IS NULL;

-- 5) fn_notificar reescrita: honra digest_frequencia
CREATE OR REPLACE FUNCTION public.fn_notificar(
  _user_id uuid, _titulo text, _mensagem text,
  _tipo public.tipo_notificacao, _categoria public.notif_categoria,
  _link text DEFAULT NULL, _nivel public.notif_nivel DEFAULT 'info'
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  _id uuid;
  _canal text;
  _motivo text;
  _canais text[] := ARRAY['in_app','email','push','whatsapp'];
  _freq public.notif_digest_freq;
  _agrupar boolean := false;
BEGIN
  IF _user_id IS NULL THEN RETURN NULL; END IF;

  SELECT digest_frequencia INTO _freq
    FROM public.notificacao_preferencias
   WHERE user_id = _user_id AND categoria = _categoria;

  IF _freq IS NOT NULL AND _freq <> 'imediato' AND _nivel <> 'critico' THEN
    _agrupar := true;
  END IF;

  IF _agrupar THEN
    INSERT INTO public.notificacao_digest_fila
      (user_id, categoria, nivel, tipo, titulo, mensagem, link)
    VALUES (_user_id, _categoria, _nivel, _tipo, _titulo, _mensagem, _link);

    FOREACH _canal IN ARRAY _canais LOOP
      INSERT INTO public.notificacao_entregas
        (notificacao_id, user_id, categoria, nivel, canal, status, motivo, titulo, mensagem)
      VALUES (NULL, _user_id, _categoria, _nivel, _canal, 'agrupado', 'digest_pendente', _titulo, _mensagem);
    END LOOP;

    RETURN NULL;
  END IF;

  IF public.fn_pode_notificar(_user_id, _categoria, 'in_app', _nivel) THEN
    INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, link)
    VALUES (_user_id, _titulo, _mensagem, _tipo, _link)
    RETURNING id INTO _id;
  END IF;

  FOREACH _canal IN ARRAY _canais LOOP
    _motivo := public.fn_motivo_bloqueio(_user_id, _categoria, _canal, _nivel);
    INSERT INTO public.notificacao_entregas
      (notificacao_id, user_id, categoria, nivel, canal, status, motivo, titulo, mensagem)
    VALUES (
      _id, _user_id, _categoria, _nivel, _canal,
      CASE WHEN _motivo IS NULL THEN 'enviado' ELSE 'bloqueado' END,
      _motivo, _titulo, _mensagem
    );
  END LOOP;

  RETURN _id;
END $fn$;

-- 6) Processa digest de UM usuário (opcionalmente filtrado por categoria)
CREATE OR REPLACE FUNCTION public.fn_processar_digest(
  _user_id uuid, _categoria public.notif_categoria DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  _cat public.notif_categoria;
  _count int;
  _titulos text;
  _resumo_id uuid;
  _total int := 0;
BEGIN
  FOR _cat IN
    SELECT DISTINCT categoria
      FROM public.notificacao_digest_fila
     WHERE user_id = _user_id
       AND agrupado_em IS NULL
       AND (_categoria IS NULL OR categoria = _categoria)
  LOOP
    SELECT count(*), string_agg('• ' || titulo, E'\n' ORDER BY created_at)
      INTO _count, _titulos
      FROM public.notificacao_digest_fila
     WHERE user_id = _user_id AND categoria = _cat AND agrupado_em IS NULL;

    IF _count = 0 THEN CONTINUE; END IF;

    INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, link)
    VALUES (
      _user_id,
      'Resumo: ' || _count || ' novo(s) evento(s) em ' || _cat::text,
      _titulos,
      'info'::public.tipo_notificacao,
      '/notificacoes'
    ) RETURNING id INTO _resumo_id;

    UPDATE public.notificacao_digest_fila
       SET agrupado_em = now(), notificacao_resumo_id = _resumo_id
     WHERE user_id = _user_id AND categoria = _cat AND agrupado_em IS NULL;

    INSERT INTO public.notificacao_entregas
      (notificacao_id, user_id, categoria, nivel, canal, status, motivo, titulo, mensagem)
    SELECT _resumo_id, _user_id, _cat, 'info', c, 'enviado', NULL,
           'Resumo: ' || _count || ' evento(s) em ' || _cat::text, _titulos
      FROM unnest(ARRAY['in_app','email','push','whatsapp']) AS c
     WHERE public.fn_motivo_bloqueio(_user_id, _cat, c, 'info') IS NULL;

    _total := _total + 1;
  END LOOP;

  RETURN _total;
END $fn$;

-- 7) Processa todos os usuários com digest devido no momento atual
CREATE OR REPLACE FUNCTION public.fn_processar_digests_devidos(
  _freq public.notif_digest_freq DEFAULT NULL
) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE
  _u record;
  _resumos int := 0;
BEGIN
  FOR _u IN
    SELECT DISTINCT p.user_id
      FROM public.notificacao_preferencias p
      JOIN public.notificacao_digest_fila f
        ON f.user_id = p.user_id AND f.categoria = p.categoria AND f.agrupado_em IS NULL
     WHERE p.digest_frequencia <> 'imediato'
       AND (_freq IS NULL OR p.digest_frequencia = _freq)
  LOOP
    _resumos := _resumos + public.fn_processar_digest(_u.user_id, NULL);
  END LOOP;
  RETURN _resumos;
END $fn$;

REVOKE ALL ON FUNCTION public.fn_processar_digest(uuid, public.notif_categoria) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.fn_processar_digests_devidos(public.notif_digest_freq) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_processar_digest(uuid, public.notif_categoria) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_processar_digests_devidos(public.notif_digest_freq) TO service_role;
