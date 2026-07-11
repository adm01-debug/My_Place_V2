
-- Enums
DO $$ BEGIN
  CREATE TYPE public.feedback_ciclo_status AS ENUM ('rascunho','ativo','encerrado','cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.feedback_relacao AS ENUM ('auto','gestor','par','subordinado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Ciclos de avaliação
CREATE TABLE public.feedback_ciclos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  competencias JSONB NOT NULL DEFAULT '["Comunicação","Colaboração","Proatividade","Técnica","Liderança","Resultados"]'::jsonb,
  status public.feedback_ciclo_status NOT NULL DEFAULT 'rascunho',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_ciclos TO authenticated;
GRANT ALL ON public.feedback_ciclos TO service_role;
ALTER TABLE public.feedback_ciclos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Todos veem ciclos ativos ou encerrados"
ON public.feedback_ciclos FOR SELECT TO authenticated
USING (status IN ('ativo','encerrado') OR public.is_admin(auth.uid()));

CREATE POLICY "Admins gerenciam ciclos"
ON public.feedback_ciclos FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER trg_feedback_ciclos_updated
BEFORE UPDATE ON public.feedback_ciclos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Avaliadores atribuídos a cada avaliado num ciclo
CREATE TABLE public.feedback_avaliadores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ciclo_id UUID NOT NULL REFERENCES public.feedback_ciclos(id) ON DELETE CASCADE,
  avaliado_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avaliador_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relacao public.feedback_relacao NOT NULL,
  concluido BOOLEAN NOT NULL DEFAULT false,
  concluido_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ciclo_id, avaliado_id, avaliador_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_avaliadores TO authenticated;
GRANT ALL ON public.feedback_avaliadores TO service_role;
ALTER TABLE public.feedback_avaliadores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Avaliador vê suas tarefas"
ON public.feedback_avaliadores FOR SELECT TO authenticated
USING (auth.uid() = avaliador_id OR auth.uid() = avaliado_id OR public.is_admin(auth.uid()));

CREATE POLICY "Avaliador marca conclusão"
ON public.feedback_avaliadores FOR UPDATE TO authenticated
USING (auth.uid() = avaliador_id) WITH CHECK (auth.uid() = avaliador_id);

CREATE POLICY "Admins gerenciam atribuições"
ON public.feedback_avaliadores FOR ALL TO authenticated
USING (public.is_admin(auth.uid())) WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX idx_feedback_avaliadores_avaliador ON public.feedback_avaliadores(avaliador_id, ciclo_id);
CREATE INDEX idx_feedback_avaliadores_avaliado ON public.feedback_avaliadores(avaliado_id, ciclo_id);

-- Respostas por competência
CREATE TABLE public.feedback_respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ciclo_id UUID NOT NULL REFERENCES public.feedback_ciclos(id) ON DELETE CASCADE,
  avaliado_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avaliador_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relacao public.feedback_relacao NOT NULL,
  competencia TEXT NOT NULL,
  nota INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ciclo_id, avaliado_id, avaliador_id, competencia)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_respostas TO authenticated;
GRANT ALL ON public.feedback_respostas TO service_role;
ALTER TABLE public.feedback_respostas ENABLE ROW LEVEL SECURITY;

-- Avaliado NÃO vê linhas brutas (apenas via view agregada). Apenas avaliador e admin.
CREATE POLICY "Avaliador vê e escreve suas respostas"
ON public.feedback_respostas FOR ALL TO authenticated
USING (auth.uid() = avaliador_id) WITH CHECK (auth.uid() = avaliador_id);

CREATE POLICY "Admins veem tudo"
ON public.feedback_respostas FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE INDEX idx_feedback_respostas_agg ON public.feedback_respostas(ciclo_id, avaliado_id, competencia);

-- View agregada (segura — expõe médias sem revelar avaliadores)
CREATE OR REPLACE VIEW public.feedback_resultados_agg
WITH (security_invoker = true) AS
SELECT
  r.ciclo_id,
  r.avaliado_id,
  r.competencia,
  r.relacao,
  ROUND(AVG(r.nota)::NUMERIC, 2) AS media,
  COUNT(*) AS respondentes
FROM public.feedback_respostas r
GROUP BY r.ciclo_id, r.avaliado_id, r.competencia, r.relacao
HAVING COUNT(*) >= 1;

GRANT SELECT ON public.feedback_resultados_agg TO authenticated;

-- RPC para o avaliado ver os próprios resultados (mesmo sem SELECT nas linhas)
CREATE OR REPLACE FUNCTION public.fn_meus_resultados_360(p_ciclo_id UUID)
RETURNS TABLE(competencia TEXT, relacao public.feedback_relacao, media NUMERIC, respondentes BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT competencia, relacao, media, respondentes
  FROM public.feedback_resultados_agg
  WHERE avaliado_id = auth.uid() AND ciclo_id = p_ciclo_id
    AND (relacao = 'auto' OR relacao = 'gestor' OR respondentes >= 2)
$$;

REVOKE ALL ON FUNCTION public.fn_meus_resultados_360(UUID) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.fn_meus_resultados_360(UUID) TO authenticated;

-- Trigger: marcar avaliador como concluído quando responder todas competências do ciclo
CREATE OR REPLACE FUNCTION public.fn_check_feedback_completo()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total INTEGER;
  v_respondidas INTEGER;
BEGIN
  SELECT jsonb_array_length(competencias) INTO v_total
  FROM public.feedback_ciclos WHERE id = NEW.ciclo_id;

  SELECT COUNT(*) INTO v_respondidas
  FROM public.feedback_respostas
  WHERE ciclo_id = NEW.ciclo_id
    AND avaliado_id = NEW.avaliado_id
    AND avaliador_id = NEW.avaliador_id;

  IF v_respondidas >= v_total THEN
    UPDATE public.feedback_avaliadores
    SET concluido = true, concluido_em = now()
    WHERE ciclo_id = NEW.ciclo_id
      AND avaliado_id = NEW.avaliado_id
      AND avaliador_id = NEW.avaliador_id
      AND concluido = false;
  END IF;
  RETURN NEW;
END; $$;

REVOKE ALL ON FUNCTION public.fn_check_feedback_completo() FROM public, anon;

CREATE TRIGGER trg_feedback_check_completo
AFTER INSERT OR UPDATE ON public.feedback_respostas
FOR EACH ROW EXECUTE FUNCTION public.fn_check_feedback_completo();
