-- =====================================================
-- MIGRATION 002: Criar tabelas de treinamentos
-- Projeto: my-place (Portal do Colaborador)
-- Data: 2025-12-20
-- =====================================================

-- Tabela de treinamentos disponíveis (catálogo)
CREATE TABLE public.treinamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  carga_horaria INTEGER NOT NULL DEFAULT 1,
  tipo TEXT NOT NULL CHECK (tipo IN ('obrigatorio', 'recomendado', 'opcional')),
  categoria TEXT NOT NULL,
  url_treinamento TEXT,
  url_material TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  validade_meses INTEGER, -- NULL = não expira
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de treinamentos do colaborador (realizados/pendentes)
CREATE TABLE public.treinamentos_colaborador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  treinamento_id UUID NOT NULL REFERENCES public.treinamentos(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'expirado')),
  progresso INTEGER DEFAULT 0 CHECK (progresso >= 0 AND progresso <= 100),
  data_inicio TIMESTAMPTZ,
  data_conclusao TIMESTAMPTZ,
  nota DECIMAL(4, 2) CHECK (nota >= 0 AND nota <= 10),
  certificado_url TEXT,
  validade DATE,
  prazo DATE,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, treinamento_id)
);

-- Tabela de trilha de desenvolvimento
CREATE TABLE public.trilha_desenvolvimento (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  nivel_atual TEXT NOT NULL DEFAULT 'Iniciante',
  proximo_nivel TEXT,
  progresso_percentual INTEGER DEFAULT 0 CHECK (progresso_percentual >= 0 AND progresso_percentual <= 100),
  treinamentos_faltantes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.treinamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treinamentos_colaborador ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trilha_desenvolvimento ENABLE ROW LEVEL SECURITY;

-- Policies para treinamentos (catálogo - todos podem ver)
CREATE POLICY "Anyone can view active treinamentos"
  ON public.treinamentos FOR SELECT
  USING (ativo = true);

-- Policies para treinamentos_colaborador
CREATE POLICY "Users can view own treinamentos"
  ON public.treinamentos_colaborador FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own treinamentos"
  ON public.treinamentos_colaborador FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own treinamentos"
  ON public.treinamentos_colaborador FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies para trilha
CREATE POLICY "Users can view own trilha"
  ON public.trilha_desenvolvimento FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own trilha"
  ON public.trilha_desenvolvimento FOR ALL
  USING (auth.uid() = user_id);

-- Triggers para updated_at
CREATE TRIGGER update_treinamentos_updated_at
  BEFORE UPDATE ON public.treinamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_treinamentos_colaborador_updated_at
  BEFORE UPDATE ON public.treinamentos_colaborador
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_trilha_updated_at
  BEFORE UPDATE ON public.trilha_desenvolvimento
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX idx_treinamentos_tipo ON public.treinamentos(tipo);
CREATE INDEX idx_treinamentos_categoria ON public.treinamentos(categoria);
CREATE INDEX idx_treinamentos_colaborador_user_id ON public.treinamentos_colaborador(user_id);
CREATE INDEX idx_treinamentos_colaborador_status ON public.treinamentos_colaborador(status);

-- Comentários
COMMENT ON TABLE public.treinamentos IS 'Catálogo de treinamentos disponíveis';
COMMENT ON TABLE public.treinamentos_colaborador IS 'Treinamentos atribuídos/realizados por colaborador';
COMMENT ON TABLE public.trilha_desenvolvimento IS 'Progresso na trilha de carreira do colaborador';
