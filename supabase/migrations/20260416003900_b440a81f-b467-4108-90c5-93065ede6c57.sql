
-- Holerites table
CREATE TABLE public.holerites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  competencia TEXT NOT NULL, -- e.g. '2025-01'
  salario_bruto NUMERIC(12,2) NOT NULL DEFAULT 0,
  salario_liquido NUMERIC(12,2) NOT NULL DEFAULT 0,
  inss NUMERIC(12,2) NOT NULL DEFAULT 0,
  irrf NUMERIC(12,2) NOT NULL DEFAULT 0,
  outros_descontos NUMERIC(12,2) NOT NULL DEFAULT 0,
  arquivo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, competencia)
);

CREATE INDEX idx_holerites_user ON public.holerites (user_id, competencia DESC);

ALTER TABLE public.holerites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own holerites"
  ON public.holerites FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all holerites"
  ON public.holerites FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gestores can view subordinate holerites"
  ON public.holerites FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = holerites.user_id AND profiles.gestor_id = auth.uid()
  ));

CREATE TRIGGER update_holerites_updated_at
  BEFORE UPDATE ON public.holerites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Metas table
CREATE TABLE public.metas_colaborador (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  progresso INTEGER NOT NULL DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  data_inicio DATE,
  data_fim DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_metas_user ON public.metas_colaborador (user_id);

ALTER TABLE public.metas_colaborador ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own metas"
  ON public.metas_colaborador FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own metas"
  ON public.metas_colaborador FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own metas"
  ON public.metas_colaborador FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all metas"
  ON public.metas_colaborador FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Gestores can view subordinate metas"
  ON public.metas_colaborador FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = metas_colaborador.user_id AND profiles.gestor_id = auth.uid()
  ));

CREATE TRIGGER update_metas_updated_at
  BEFORE UPDATE ON public.metas_colaborador
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
