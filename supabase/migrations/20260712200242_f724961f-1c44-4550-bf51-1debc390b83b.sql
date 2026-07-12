ALTER TABLE public.notificacoes ADD COLUMN IF NOT EXISTS adiada_ate TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_notificacoes_user_adiada ON public.notificacoes(user_id, adiada_ate) WHERE adiada_ate IS NOT NULL;

-- RPC para adiar uma ou várias notificações do próprio usuário
CREATE OR REPLACE FUNCTION public.fn_adiar_notificacoes(_ids UUID[], _ate TIMESTAMPTZ)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;
  IF _ate IS NULL OR _ate <= now() THEN
    RAISE EXCEPTION 'Data de adiamento deve ser no futuro';
  END IF;
  UPDATE public.notificacoes
     SET adiada_ate = _ate,
         lida = false
   WHERE id = ANY(_ids)
     AND user_id = auth.uid();
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_adiar_notificacoes(UUID[], TIMESTAMPTZ) TO authenticated;

-- Job (função) para reativar notificações adiadas cujo tempo expirou.
-- Chamada por cron externo ou pg_cron. Reativa limpando adiada_ate.
CREATE OR REPLACE FUNCTION public.fn_reativar_notificacoes_adiadas()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _count INTEGER;
BEGIN
  UPDATE public.notificacoes
     SET adiada_ate = NULL,
         created_at = now()
   WHERE adiada_ate IS NOT NULL
     AND adiada_ate <= now();
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_reativar_notificacoes_adiadas() TO service_role;