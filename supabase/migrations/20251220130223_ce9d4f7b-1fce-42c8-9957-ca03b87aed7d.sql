-- Adicionar coluna data_nascimento na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS data_nascimento date;

-- Criar tabela para armazenar parabéns enviados
CREATE TABLE public.aniversario_parabens (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  aniversariante_id uuid NOT NULL,
  mensagem text NOT NULL DEFAULT 'Feliz aniversário! 🎉',
  mes integer NOT NULL,
  ano integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Garantir que cada usuário só pode parabenizar uma vez por mês/ano
  UNIQUE(user_id, aniversariante_id, mes, ano)
);

-- Enable RLS
ALTER TABLE public.aniversario_parabens ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own sent parabens"
ON public.aniversario_parabens
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert parabens"
ON public.aniversario_parabens
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX idx_aniversario_parabens_user ON public.aniversario_parabens(user_id);
CREATE INDEX idx_aniversario_parabens_aniversariante ON public.aniversario_parabens(aniversariante_id);
CREATE INDEX idx_aniversario_parabens_mes_ano ON public.aniversario_parabens(mes, ano);