-- Adicionar campos faltantes na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS bitrix_id TEXT;

-- Adicionar campo bitrix_task_id na tabela ferias
ALTER TABLE public.ferias 
ADD COLUMN IF NOT EXISTS bitrix_task_id TEXT;

-- Adicionar campos faltantes na tabela holerites para compatibilidade com edge functions
ALTER TABLE public.holerites 
ADD COLUMN IF NOT EXISTS salario_base NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_proventos NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_descontos NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS horas_trabalhadas NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS horas_extras NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS faltas INTEGER DEFAULT 0;

-- Atualizar registros existentes com valores calculados (se houver)
UPDATE public.holerites 
SET 
  total_proventos = COALESCE(salario_bruto, 0),
  total_descontos = COALESCE(descontos, 0)
WHERE total_proventos = 0 OR total_descontos = 0;

-- Criar índice para busca por CPF
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON public.profiles(cpf);

-- Criar índice para bitrix_id
CREATE INDEX IF NOT EXISTS idx_profiles_bitrix_id ON public.profiles(bitrix_id);

-- Criar índice para bitrix_task_id em ferias
CREATE INDEX IF NOT EXISTS idx_ferias_bitrix_task_id ON public.ferias(bitrix_task_id);