-- =====================================================
-- MIGRATION 010: Adicionar campos faltantes
-- Projeto: my-place (Portal do Colaborador)
-- Data: 2025-12-20
-- =====================================================

-- Adicionar data_admissao ao profiles (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'data_admissao'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN data_admissao DATE;
  END IF;
END $$;

-- Adicionar matricula ao profiles (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'matricula'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN matricula TEXT;
  END IF;
END $$;

-- Adicionar cargo ao profiles (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'cargo'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN cargo TEXT;
  END IF;
END $$;

-- Adicionar departamento ao profiles (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'departamento'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN departamento TEXT;
  END IF;
END $$;

-- Adicionar detalhes JSONB ao holerites (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'holerites' 
    AND column_name = 'detalhes'
  ) THEN
    ALTER TABLE public.holerites ADD COLUMN detalhes JSONB DEFAULT '{}';
  END IF;
END $$;

-- Adicionar pdf_url ao holerites (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'holerites' 
    AND column_name = 'pdf_url'
  ) THEN
    ALTER TABLE public.holerites ADD COLUMN pdf_url TEXT;
  END IF;
END $$;

-- Adicionar endereco ao registros_ponto (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'registros_ponto' 
    AND column_name = 'endereco'
  ) THEN
    ALTER TABLE public.registros_ponto ADD COLUMN endereco TEXT;
  END IF;
END $$;

-- Adicionar status ao registros_ponto (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'registros_ponto' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.registros_ponto ADD COLUMN status TEXT DEFAULT 'aprovado' CHECK (status IN ('aprovado', 'pendente', 'rejeitado', 'fora_area'));
  END IF;
END $$;

-- Adicionar observacao ao registros_ponto (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'registros_ponto' 
    AND column_name = 'observacao'
  ) THEN
    ALTER TABLE public.registros_ponto ADD COLUMN observacao TEXT;
  END IF;
END $$;

-- Comentários
COMMENT ON COLUMN public.profiles.data_admissao IS 'Data de admissão do colaborador';
COMMENT ON COLUMN public.profiles.matricula IS 'Matrícula do colaborador';
COMMENT ON COLUMN public.holerites.detalhes IS 'Detalhamento de proventos e descontos em JSON';
COMMENT ON COLUMN public.holerites.pdf_url IS 'URL do PDF do holerite no Storage';
