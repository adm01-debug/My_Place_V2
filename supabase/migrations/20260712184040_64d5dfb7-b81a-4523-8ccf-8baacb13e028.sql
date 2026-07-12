
-- Tabela de histórico de entregas por canal
CREATE TABLE public.notificacao_entregas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notificacao_id uuid REFERENCES public.notificacoes(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  categoria notif_categoria NOT NULL,
  nivel notif_nivel NOT NULL DEFAULT 'info',
  canal text NOT NULL CHECK (canal IN ('in_app','email','push','whatsapp')),
  status text NOT NULL CHECK (status IN ('enviado','bloqueado')),
  motivo text,
  titulo text NOT NULL,
  mensagem text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_entregas_user_created ON public.notificacao_entregas (user_id, created_at DESC);
CREATE INDEX idx_notif_entregas_notif ON public.notificacao_entregas (notificacao_id);

GRANT SELECT ON public.notificacao_entregas TO authenticated;
GRANT ALL ON public.notificacao_entregas TO service_role;

ALTER TABLE public.notificacao_entregas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user reads own deliveries"
  ON public.notificacao_entregas FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- Função que retorna motivo do bloqueio (NULL = permitido)
CREATE OR REPLACE FUNCTION public.fn_motivo_bloqueio(
  _user_id uuid,
  _categoria notif_categoria,
  _canal text,
  _nivel notif_nivel DEFAULT 'info'
) RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pref public.notificacao_preferencias%ROWTYPE;
  v_quiet public.notificacao_quiet_hours%ROWTYPE;
  v_permitido boolean;
  v_local_time time;
  v_dow int;
  v_nivel_rank int;
  v_min_rank int;
BEGIN
  SELECT * INTO v_pref FROM public.notificacao_preferencias
    WHERE user_id = _user_id AND categoria = _categoria;

  IF FOUND THEN
    v_nivel_rank := CASE _nivel WHEN 'info' THEN 1 WHEN 'aviso' THEN 2 WHEN 'critico' THEN 3 END;
    v_min_rank := CASE v_pref.nivel_minimo WHEN 'info' THEN 1 WHEN 'aviso' THEN 2 WHEN 'critico' THEN 3 END;
    IF v_nivel_rank < v_min_rank THEN
      RETURN 'nivel_abaixo_minimo';
    END IF;

    IF v_pref.silenciar_ate IS NOT NULL AND v_pref.silenciar_ate > now() AND _nivel <> 'critico' THEN
      RETURN 'silenciado_temporariamente';
    END IF;

    v_permitido := CASE _canal
      WHEN 'in_app' THEN v_pref.canal_in_app
      WHEN 'email' THEN v_pref.canal_email
      WHEN 'push' THEN v_pref.canal_push
      WHEN 'whatsapp' THEN v_pref.canal_whatsapp
      ELSE true END;
    IF NOT v_permitido THEN
      RETURN 'canal_desativado';
    END IF;
  END IF;

  SELECT * INTO v_quiet FROM public.notificacao_quiet_hours WHERE user_id = _user_id;
  IF FOUND AND v_quiet.ativo THEN
    v_local_time := (now() AT TIME ZONE v_quiet.timezone)::time;
    v_dow := EXTRACT(DOW FROM (now() AT TIME ZONE v_quiet.timezone))::int;
    IF v_dow = ANY(v_quiet.dias_semana) THEN
      IF (v_quiet.inicio < v_quiet.fim AND v_local_time BETWEEN v_quiet.inicio AND v_quiet.fim)
         OR (v_quiet.inicio > v_quiet.fim AND (v_local_time >= v_quiet.inicio OR v_local_time <= v_quiet.fim))
      THEN
        IF v_quiet.permitir_criticos AND _nivel = 'critico' THEN
          RETURN NULL;
        END IF;
        RETURN 'quiet_hours';
      END IF;
    END IF;
  END IF;

  RETURN NULL;
END;
$$;

-- Reescreve fn_pode_notificar para reutilizar a nova função
CREATE OR REPLACE FUNCTION public.fn_pode_notificar(
  _user_id uuid,
  _categoria notif_categoria,
  _canal text,
  _nivel notif_nivel DEFAULT 'info'
) RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.fn_motivo_bloqueio(_user_id, _categoria, _canal, _nivel) IS NULL;
$$;

-- Reescreve fn_notificar: avalia os 4 canais e loga cada resultado
CREATE OR REPLACE FUNCTION public.fn_notificar(
  _user_id uuid,
  _titulo text,
  _mensagem text,
  _tipo tipo_notificacao,
  _categoria notif_categoria,
  _link text DEFAULT NULL,
  _nivel notif_nivel DEFAULT 'info'
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
  _canal text;
  _motivo text;
  _canais text[] := ARRAY['in_app','email','push','whatsapp'];
  _in_app_ok boolean;
BEGIN
  IF _user_id IS NULL THEN
    RETURN NULL;
  END IF;

  _in_app_ok := public.fn_pode_notificar(_user_id, _categoria, 'in_app', _nivel);

  IF _in_app_ok THEN
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
END;
$$;
