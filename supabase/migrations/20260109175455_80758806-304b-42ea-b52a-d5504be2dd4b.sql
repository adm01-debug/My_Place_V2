-- Create remuneracao_variavel table to consolidate commissions and bonuses
CREATE TABLE public.remuneracao_variavel (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('comissao', 'bonificacao', 'premio', 'plr', 'outro')),
  descricao TEXT NOT NULL,
  valor NUMERIC(12,2) NOT NULL,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL CHECK (ano >= 2000 AND ano <= 2100),
  referencia TEXT,
  percentual NUMERIC(5,2),
  status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'pago', 'cancelado')),
  data_pagamento DATE,
  aprovado_por UUID,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.remuneracao_variavel ENABLE ROW LEVEL SECURITY;

-- Policies for users to view their own records
CREATE POLICY "Users can view their own remuneracao_variavel"
  ON public.remuneracao_variavel
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policies for admins/managers to manage all records
CREATE POLICY "Admins can manage all remuneracao_variavel"
  ON public.remuneracao_variavel
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'gestor')
    )
  );

-- Create index for faster queries
CREATE INDEX idx_remuneracao_variavel_user_id ON public.remuneracao_variavel(user_id);
CREATE INDEX idx_remuneracao_variavel_mes_ano ON public.remuneracao_variavel(ano, mes);
CREATE INDEX idx_remuneracao_variavel_tipo ON public.remuneracao_variavel(tipo);
CREATE INDEX idx_remuneracao_variavel_status ON public.remuneracao_variavel(status);

-- Create trigger for updated_at
CREATE TRIGGER update_remuneracao_variavel_updated_at
  BEFORE UPDATE ON public.remuneracao_variavel
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();