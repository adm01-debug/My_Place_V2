-- Create emprestimos table
CREATE TABLE public.emprestimos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  numero_contrato TEXT NOT NULL,
  valor_original NUMERIC NOT NULL,
  taxa_juros NUMERIC NOT NULL DEFAULT 1.5,
  total_com_juros NUMERIC NOT NULL,
  quantidade_parcelas INTEGER NOT NULL,
  valor_parcela NUMERIC NOT NULL,
  parcelas_pagas INTEGER NOT NULL DEFAULT 0,
  saldo_devedor NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo',
  data_contratacao DATE NOT NULL DEFAULT CURRENT_DATE,
  motivo TEXT,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create parcelas_emprestimo table
CREATE TABLE public.parcelas_emprestimo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  emprestimo_id UUID NOT NULL REFERENCES public.emprestimos(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  valor NUMERIC NOT NULL,
  vencimento DATE NOT NULL,
  data_pagamento DATE,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.emprestimos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parcelas_emprestimo ENABLE ROW LEVEL SECURITY;

-- RLS policies for emprestimos
CREATE POLICY "Users can view own emprestimos"
ON public.emprestimos
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own emprestimos"
ON public.emprestimos
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS policies for parcelas (through emprestimo ownership)
CREATE POLICY "Users can view parcelas of own emprestimos"
ON public.parcelas_emprestimo
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.emprestimos
    WHERE emprestimos.id = parcelas_emprestimo.emprestimo_id
    AND emprestimos.user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_emprestimos_updated_at
BEFORE UPDATE ON public.emprestimos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_emprestimos_user_id ON public.emprestimos(user_id);
CREATE INDEX idx_parcelas_emprestimo_id ON public.parcelas_emprestimo(emprestimo_id);