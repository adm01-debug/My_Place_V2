-- Adicionar coluna gestor_id na tabela profiles para hierarquia
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gestor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_profiles_gestor_id ON public.profiles(gestor_id);

-- Atualizar política para permitir visualização de todos os profiles para organograma
DROP POLICY IF EXISTS "Authenticated users can view profiles for organograma" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles for organograma"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Função para buscar subordinados recursivamente
CREATE OR REPLACE FUNCTION public.get_subordinados(p_gestor_id uuid)
RETURNS TABLE (
  id uuid,
  nome text,
  cargo text,
  departamento text,
  avatar_url text,
  gestor_id uuid,
  nivel integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE subordinados AS (
    -- Base: subordinados diretos
    SELECT 
      p.id,
      p.nome,
      p.cargo,
      p.departamento,
      p.avatar_url,
      p.gestor_id,
      1 as nivel
    FROM public.profiles p
    WHERE p.gestor_id = p_gestor_id
    
    UNION ALL
    
    -- Recursivo: subordinados dos subordinados
    SELECT 
      p.id,
      p.nome,
      p.cargo,
      p.departamento,
      p.avatar_url,
      p.gestor_id,
      s.nivel + 1
    FROM public.profiles p
    INNER JOIN subordinados s ON p.gestor_id = s.id
    WHERE s.nivel < 10 -- Limite de profundidade
  )
  SELECT * FROM subordinados ORDER BY nivel, nome;
$$;

-- Função para buscar hierarquia completa a partir do topo
CREATE OR REPLACE FUNCTION public.get_organograma()
RETURNS TABLE (
  id uuid,
  nome text,
  cargo text,
  departamento text,
  avatar_url text,
  gestor_id uuid,
  nivel integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH RECURSIVE hierarquia AS (
    -- Base: colaboradores sem gestor (topo da hierarquia)
    SELECT 
      p.id,
      p.nome,
      p.cargo,
      p.departamento,
      p.avatar_url,
      p.gestor_id,
      0 as nivel
    FROM public.profiles p
    WHERE p.gestor_id IS NULL
    
    UNION ALL
    
    -- Recursivo: subordinados
    SELECT 
      p.id,
      p.nome,
      p.cargo,
      p.departamento,
      p.avatar_url,
      p.gestor_id,
      h.nivel + 1
    FROM public.profiles p
    INNER JOIN hierarquia h ON p.gestor_id = h.id
    WHERE h.nivel < 10
  )
  SELECT * FROM hierarquia ORDER BY nivel, departamento, nome;
$$;