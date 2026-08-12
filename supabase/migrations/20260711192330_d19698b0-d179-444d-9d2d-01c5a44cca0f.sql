
DO $$ BEGIN
  CREATE TYPE public.exit_motivo AS ENUM ('nova_oportunidade','remuneracao','lideranca','ambiente','crescimento','pessoal','mudanca','saude','aposentadoria','outros');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.exit_status AS ENUM ('rascunho','enviada','arquivada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.exit_interviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  motivo_principal public.exit_motivo NOT NULL,
  data_desligamento DATE,
  nota_lideranca SMALLINT CHECK (nota_lideranca BETWEEN 1 AND 5),
  nota_ambiente SMALLINT CHECK (nota_ambiente BETWEEN 1 AND 5),
  nota_remuneracao SMALLINT CHECK (nota_remuneracao BETWEEN 1 AND 5),
  nota_crescimento SMALLINT CHECK (nota_crescimento BETWEEN 1 AND 5),
  nota_ferramentas SMALLINT CHECK (nota_ferramentas BETWEEN 1 AND 5),
  recomendaria SMALLINT CHECK (recomendaria BETWEEN 0 AND 10),
  o_que_gostou TEXT,
  o_que_melhoraria TEXT,
  comentario_final TEXT,
  status public.exit_status NOT NULL DEFAULT 'rascunho',
  enviada_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exit_user ON public.exit_interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_exit_status ON public.exit_interviews(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exit_interviews TO authenticated;
GRANT ALL ON public.exit_interviews TO service_role;

ALTER TABLE public.exit_interviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver própria pesquisa ou admin" ON public.exit_interviews
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "Criar sua pesquisa" ON public.exit_interviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Editar rascunho próprio" ON public.exit_interviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND status = 'rascunho')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin gerencia todas" ON public.exit_interviews
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_exit_updated_at BEFORE UPDATE ON public.exit_interviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.fn_exit_set_enviada()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'enviada' AND (OLD.status IS DISTINCT FROM 'enviada') THEN
    NEW.enviada_em := now();
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_exit_set_enviada BEFORE UPDATE ON public.exit_interviews
  FOR EACH ROW EXECUTE FUNCTION public.fn_exit_set_enviada();

CREATE OR REPLACE VIEW public.vw_exit_interviews_stats AS
SELECT
  COUNT(*)::BIGINT AS total_respostas,
  AVG(nota_lideranca)::NUMERIC(3,2) AS media_lideranca,
  AVG(nota_ambiente)::NUMERIC(3,2) AS media_ambiente,
  AVG(nota_remuneracao)::NUMERIC(3,2) AS media_remuneracao,
  AVG(nota_crescimento)::NUMERIC(3,2) AS media_crescimento,
  AVG(nota_ferramentas)::NUMERIC(3,2) AS media_ferramentas,
  AVG(recomendaria)::NUMERIC(4,2) AS media_recomendaria,
  (
    (COUNT(*) FILTER (WHERE recomendaria >= 9))::NUMERIC * 100 / NULLIF(COUNT(*) FILTER (WHERE recomendaria IS NOT NULL),0)
    -
    (COUNT(*) FILTER (WHERE recomendaria <= 6))::NUMERIC * 100 / NULLIF(COUNT(*) FILTER (WHERE recomendaria IS NOT NULL),0)
  )::NUMERIC(5,2) AS enps_score
FROM public.exit_interviews
WHERE status = 'enviada';

GRANT SELECT ON public.vw_exit_interviews_stats TO authenticated;
