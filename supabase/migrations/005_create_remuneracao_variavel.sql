-- =====================================================
-- MIGRATION 005: Criar tabelas de remuneração variável
-- Projeto: my-place (Portal do Colaborador)
-- Data: 2025-12-20
-- =====================================================

-- Tabela de remuneração variável mensal
CREATE TABLE public.remuneracao_variavel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL,
  total DECIMAL(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'previsto' CHECK (status IN ('previsto', 'confirmado', 'pago', 'cancelado')),
  data_pagamento DATE,
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, mes, ano)
);

-- Tabela de itens da remuneração variável
CREATE TABLE public.itens_remuneracao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  remuneracao_id UUID NOT NULL REFERENCES public.remuneracao_variavel(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN (
    'comissao_vendas', 'bonus_meta', 'bonus_produtividade', 
    'plr', 'premio_assiduidade', 'gratificacao', 'hora_extra',
    'adicional_noturno', 'periculosidade', 'insalubridade', 'outros'
  )),
  descricao TEXT NOT NULL,
  base DECIMAL(12, 2), -- Valor base para cálculo
  percentual DECIMAL(5, 2), -- Percentual aplicado
  valor DECIMAL(12, 2) NOT NULL,
  referencia TEXT, -- Ex: "8h", "Meta Q4"
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de metas do colaborador
CREATE TABLE public.metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('vendas', 'producao', 'qualidade', 'assiduidade', 'projeto', 'outros')),
  
  -- Valores
  valor_meta DECIMAL(12, 2) NOT NULL,
  valor_atual DECIMAL(12, 2) NOT NULL DEFAULT 0,
  unidade TEXT DEFAULT 'R$', -- R$, unidades, %, horas, etc.
  
  -- Bonificação
  bonus DECIMAL(12, 2) DEFAULT 0,
  bonus_percentual DECIMAL(5, 2), -- % sobre salário
  
  -- Período
  periodo TEXT NOT NULL, -- "Dezembro/2025", "Q4 2025", "2025"
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('em_andamento', 'atingida', 'nao_atingida', 'cancelada')),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.remuneracao_variavel ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_remuneracao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

-- Policies para remuneracao_variavel
CREATE POLICY "Users can view own remuneracao"
  ON public.remuneracao_variavel FOR SELECT
  USING (auth.uid() = user_id);

-- Policies para itens (via remuneração)
CREATE POLICY "Users can view itens of own remuneracao"
  ON public.itens_remuneracao FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.remuneracao_variavel
    WHERE remuneracao_variavel.id = itens_remuneracao.remuneracao_id
    AND remuneracao_variavel.user_id = auth.uid()
  ));

-- Policies para metas
CREATE POLICY "Users can view own metas"
  ON public.metas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own metas"
  ON public.metas FOR UPDATE
  USING (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER update_remuneracao_variavel_updated_at
  BEFORE UPDATE ON public.remuneracao_variavel
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_metas_updated_at
  BEFORE UPDATE ON public.metas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Índices
CREATE INDEX idx_remuneracao_variavel_user_id ON public.remuneracao_variavel(user_id);
CREATE INDEX idx_remuneracao_variavel_periodo ON public.remuneracao_variavel(ano, mes);
CREATE INDEX idx_itens_remuneracao_remuneracao_id ON public.itens_remuneracao(remuneracao_id);
CREATE INDEX idx_metas_user_id ON public.metas(user_id);
CREATE INDEX idx_metas_status ON public.metas(status);

-- Function para calcular percentual da meta
CREATE OR REPLACE FUNCTION public.fn_calcular_percentual_meta(
  p_valor_atual DECIMAL,
  p_valor_meta DECIMAL
) RETURNS INTEGER AS $$
BEGIN
  IF p_valor_meta = 0 THEN
    RETURN 0;
  END IF;
  RETURN LEAST(100, ROUND((p_valor_atual / p_valor_meta) * 100)::INTEGER);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Comentários
COMMENT ON TABLE public.remuneracao_variavel IS 'Remuneração variável mensal do colaborador';
COMMENT ON TABLE public.itens_remuneracao IS 'Detalhamento dos itens de remuneração variável';
COMMENT ON TABLE public.metas IS 'Metas individuais do colaborador';
