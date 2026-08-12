-- =====================================================
-- MIGRATION 009: Criar tabela de parcelas de empréstimo
-- Projeto: my-place (Portal do Colaborador)
-- Data: 2025-12-20
-- =====================================================

-- Tabela de parcelas de empréstimo
CREATE TABLE IF NOT EXISTS public.parcelas_emprestimo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  emprestimo_id UUID NOT NULL REFERENCES public.emprestimos(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  valor DECIMAL(10, 2) NOT NULL,
  vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'paga', 'atrasada')),
  observacao TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(emprestimo_id, numero)
);

-- Enable RLS
ALTER TABLE public.parcelas_emprestimo ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own parcelas"
  ON public.parcelas_emprestimo FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.emprestimos
    WHERE emprestimos.id = parcelas_emprestimo.emprestimo_id
    AND emprestimos.user_id = auth.uid()
  ));

-- Índices
CREATE INDEX idx_parcelas_emprestimo_emprestimo_id ON public.parcelas_emprestimo(emprestimo_id);
CREATE INDEX idx_parcelas_emprestimo_vencimento ON public.parcelas_emprestimo(vencimento);
CREATE INDEX idx_parcelas_emprestimo_status ON public.parcelas_emprestimo(status);

-- Comentários
COMMENT ON TABLE public.parcelas_emprestimo IS 'Parcelas dos empréstimos consignados';
