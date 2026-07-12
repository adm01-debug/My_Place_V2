
ALTER TABLE public.notificacao_entregas
  ADD COLUMN IF NOT EXISTS tentativas int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS integracao_id uuid NULL REFERENCES public.integracoes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS erro text NULL,
  ADD COLUMN IF NOT EXISTS fallback_para text NULL,
  ADD COLUMN IF NOT EXISTS fallback_de uuid NULL REFERENCES public.notificacao_entregas(id) ON DELETE SET NULL;

ALTER TABLE public.notificacao_entregas DROP CONSTRAINT IF EXISTS notificacao_entregas_status_check;
ALTER TABLE public.notificacao_entregas
  ADD CONSTRAINT notificacao_entregas_status_check
  CHECK (status IN ('enviado','bloqueado','falhou'));

CREATE INDEX IF NOT EXISTS idx_notif_entregas_user_canal ON public.notificacao_entregas(user_id, canal, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_entregas_user_categoria ON public.notificacao_entregas(user_id, categoria, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notif_entregas_integracao ON public.notificacao_entregas(integracao_id) WHERE integracao_id IS NOT NULL;

-- Registra tentativa/falha e cria fallback in-app quando push falha
CREATE OR REPLACE FUNCTION public.fn_registrar_tentativa_entrega(
  _entrega_id uuid,
  _sucesso boolean,
  _erro text DEFAULT NULL,
  _integracao_id uuid DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.notificacao_entregas%ROWTYPE;
  _fallback_id uuid;
  _in_app_ok boolean;
BEGIN
  UPDATE public.notificacao_entregas
     SET tentativas = tentativas + 1,
         status = CASE WHEN _sucesso THEN 'enviado' ELSE 'falhou' END,
         erro = CASE WHEN _sucesso THEN NULL ELSE _erro END,
         integracao_id = COALESCE(_integracao_id, integracao_id)
   WHERE id = _entrega_id
  RETURNING * INTO _row;

  IF NOT FOUND THEN RETURN NULL; END IF;

  -- Fallback automático: se push falhou e o usuário aceita in_app para essa categoria/nível, cria entrega fallback
  IF NOT _sucesso AND _row.canal = 'push' THEN
    _in_app_ok := public.fn_pode_notificar(_row.user_id, _row.categoria, 'in_app', _row.nivel);
    IF _in_app_ok THEN
      INSERT INTO public.notificacao_entregas
        (notificacao_id, user_id, categoria, nivel, canal, status, titulo, mensagem, fallback_de, fallback_para)
      VALUES
        (_row.notificacao_id, _row.user_id, _row.categoria, _row.nivel, 'in_app', 'enviado',
         _row.titulo, _row.mensagem, _row.id, 'in_app')
      RETURNING id INTO _fallback_id;

      UPDATE public.notificacao_entregas
         SET fallback_para = 'in_app'
       WHERE id = _row.id;
    END IF;
  END IF;

  RETURN _fallback_id;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_registrar_tentativa_entrega(uuid, boolean, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_registrar_tentativa_entrega(uuid, boolean, text, uuid) TO service_role;

-- KPIs e breakdown 24h por usuário
CREATE OR REPLACE FUNCTION public.fn_notif_stats_24h(_user_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  _result jsonb;
BEGIN
  IF _user_id IS NULL THEN RETURN '{}'::jsonb; END IF;
  IF _user_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  WITH base AS (
    SELECT * FROM public.notificacao_entregas
     WHERE user_id = _user_id
       AND created_at >= now() - interval '24 hours'
  ),
  totais AS (
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE status='enviado')::int AS enviadas,
      count(*) FILTER (WHERE status='bloqueado')::int AS bloqueadas,
      count(*) FILTER (WHERE status='falhou')::int AS falhas,
      coalesce(sum(tentativas),0)::int AS tentativas,
      count(*) FILTER (WHERE fallback_de IS NOT NULL)::int AS fallbacks
    FROM base
  ),
  por_canal AS (
    SELECT jsonb_object_agg(canal, obj) AS data FROM (
      SELECT canal, jsonb_build_object(
        'total', count(*),
        'enviadas', count(*) FILTER (WHERE status='enviado'),
        'bloqueadas', count(*) FILTER (WHERE status='bloqueado'),
        'falhas', count(*) FILTER (WHERE status='falhou'),
        'tentativas', coalesce(sum(tentativas),0)
      ) AS obj
      FROM base GROUP BY canal
    ) x
  ),
  por_categoria AS (
    SELECT jsonb_object_agg(categoria::text, obj) AS data FROM (
      SELECT categoria, jsonb_build_object(
        'total', count(*),
        'enviadas', count(*) FILTER (WHERE status='enviado'),
        'bloqueadas', count(*) FILTER (WHERE status='bloqueado'),
        'falhas', count(*) FILTER (WHERE status='falhou')
      ) AS obj
      FROM base GROUP BY categoria
    ) x
  )
  SELECT jsonb_build_object(
    'totais', to_jsonb(totais.*),
    'por_canal', coalesce(por_canal.data, '{}'::jsonb),
    'por_categoria', coalesce(por_categoria.data, '{}'::jsonb)
  ) INTO _result
  FROM totais, por_canal, por_categoria;

  RETURN _result;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_notif_stats_24h(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_notif_stats_24h(uuid) TO authenticated, service_role;
