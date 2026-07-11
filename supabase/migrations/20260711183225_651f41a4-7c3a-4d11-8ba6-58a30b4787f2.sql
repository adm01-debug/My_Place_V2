
-- Item 18: Enquete de Clima / eNPS
CREATE TYPE public.clima_tipo AS ENUM ('enps', 'pulse', 'custom');

CREATE TABLE public.clima_enquetes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo public.clima_tipo NOT NULL DEFAULT 'pulse',
  perguntas JSONB NOT NULL DEFAULT '[]'::jsonb,
  ativa BOOLEAN NOT NULL DEFAULT true,
  anonima BOOLEAN NOT NULL DEFAULT true,
  data_inicio TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_fim TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.clima_enquetes TO authenticated;
GRANT ALL ON public.clima_enquetes TO service_role;
ALTER TABLE public.clima_enquetes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_view_active_enquetes" ON public.clima_enquetes
  FOR SELECT TO authenticated USING (ativa = true OR public.is_admin(auth.uid()));
CREATE POLICY "admins_manage_enquetes" ON public.clima_enquetes
  FOR ALL TO authenticated USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TABLE public.clima_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquete_id UUID NOT NULL REFERENCES public.clima_enquetes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER,
  respostas JSONB NOT NULL DEFAULT '{}'::jsonb,
  comentario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(enquete_id, user_id)
);
GRANT SELECT, INSERT ON public.clima_respostas TO authenticated;
GRANT ALL ON public.clima_respostas TO service_role;
ALTER TABLE public.clima_respostas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_insert_own_resposta" ON public.clima_respostas
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_view_own_resposta" ON public.clima_respostas
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_clima_respostas_enquete ON public.clima_respostas(enquete_id);

CREATE TRIGGER trg_clima_enquetes_updated
  BEFORE UPDATE ON public.clima_enquetes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- View agregada (segura, sem user_id)
CREATE OR REPLACE VIEW public.clima_resultados_agg
WITH (security_invoker = true) AS
SELECT
  e.id AS enquete_id,
  e.titulo,
  e.tipo,
  COUNT(r.id) AS total_respostas,
  ROUND(AVG(r.score)::numeric, 2) AS media_score,
  COUNT(*) FILTER (WHERE r.score >= 9) AS promotores,
  COUNT(*) FILTER (WHERE r.score BETWEEN 7 AND 8) AS neutros,
  COUNT(*) FILTER (WHERE r.score <= 6) AS detratores,
  CASE WHEN COUNT(r.id) > 0 THEN
    ROUND(((COUNT(*) FILTER (WHERE r.score >= 9)::numeric - COUNT(*) FILTER (WHERE r.score <= 6)::numeric) / COUNT(r.id)::numeric) * 100, 1)
  ELSE 0 END AS enps_score
FROM public.clima_enquetes e
LEFT JOIN public.clima_respostas r ON r.enquete_id = e.id
GROUP BY e.id;

GRANT SELECT ON public.clima_resultados_agg TO authenticated;

-- RPC: apenas admins veem resultados agregados (mín 3 respostas para anonimato)
CREATE OR REPLACE FUNCTION public.fn_clima_resultados(p_enquete_id UUID)
RETURNS TABLE(
  enquete_id UUID, titulo TEXT, tipo public.clima_tipo,
  total_respostas BIGINT, media_score NUMERIC,
  promotores BIGINT, neutros BIGINT, detratores BIGINT, enps_score NUMERIC
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT * FROM public.clima_resultados_agg
  WHERE enquete_id = p_enquete_id
    AND (public.is_admin(auth.uid()) OR total_respostas >= 3)
$$;
