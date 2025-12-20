-- =====================================================
-- MIGRATION 001: Criar tabela beneficios
-- Projeto: my-place (Portal do Colaborador)
-- Data: 2025-12-20
-- =====================================================

-- Tabela principal de benefícios do colaborador
CREATE TABLE public.beneficios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('vale_transporte', 'vale_refeicao', 'vale_alimentacao', 'plano_saude', 'plano_odonto', 'seguro_vida', 'auxilio_creche', 'gympass', 'outros')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  
  -- Valores financeiros
  credito_mensal DECIMAL(10, 2) DEFAULT 0,
  desconto DECIMAL(10, 2) DEFAULT 0,
  saldo_cartao DECIMAL(10, 2) DEFAULT 0,
  valor_empresa DECIMAL(10, 2) DEFAULT 0,
  
  -- Dados do cartão/plano
  operadora TEXT,
  plano TEXT,
  numero_cartao TEXT,
  numero_carteirinha TEXT,
  
  -- Datas
  ultima_recarga DATE,
  data_adesao DATE DEFAULT CURRENT_DATE,
  data_cancelamento DATE,
  
  -- Detalhes extras (flexível para cada tipo)
  detalhes JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Índice único: um benefício por tipo por usuário
  UNIQUE(user_id, tipo)
);

-- Tabela de dependentes em benefícios (plano saúde, odonto)
CREATE TABLE public.beneficios_dependentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficio_id UUID NOT NULL REFERENCES public.beneficios(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  parentesco TEXT NOT NULL CHECK (parentesco IN ('conjuge', 'filho', 'filha', 'pai', 'mae', 'outro')),
  data_nascimento DATE,
  cpf TEXT,
  numero_carteirinha TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.beneficios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficios_dependentes ENABLE ROW LEVEL SECURITY;

-- Policies para beneficios
CREATE POLICY "Users can view own beneficios"
  ON public.beneficios FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own beneficios"
  ON public.beneficios FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own beneficios"
  ON public.beneficios FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies para dependentes (via benefício)
CREATE POLICY "Users can view dependentes of own beneficios"
  ON public.beneficios_dependentes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.beneficios
    WHERE beneficios.id = beneficios_dependentes.beneficio_id
    AND beneficios.user_id = auth.uid()
  ));

CREATE POLICY "Users can manage dependentes of own beneficios"
  ON public.beneficios_dependentes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.beneficios
    WHERE beneficios.id = beneficios_dependentes.beneficio_id
    AND beneficios.user_id = auth.uid()
  ));

-- Trigger para updated_at
CREATE TRIGGER update_beneficios_updated_at
  BEFORE UPDATE ON public.beneficios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_beneficios_user_id ON public.beneficios(user_id);
CREATE INDEX idx_beneficios_tipo ON public.beneficios(tipo);
CREATE INDEX idx_beneficios_dependentes_beneficio_id ON public.beneficios_dependentes(beneficio_id);

-- Comentários
COMMENT ON TABLE public.beneficios IS 'Benefícios dos colaboradores (VT, VR, Saúde, Odonto, etc.)';
COMMENT ON TABLE public.beneficios_dependentes IS 'Dependentes vinculados aos benefícios de saúde/odonto';
