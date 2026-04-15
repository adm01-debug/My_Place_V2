
-- 1. Create a secure public view for organograma (no PII)
CREATE OR REPLACE VIEW public.organograma_public_view AS
SELECT id, nome, cargo, departamento, avatar_url, gestor_id
FROM public.profiles;

-- 2. Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view profiles for organograma" ON public.profiles;

-- 3. Add a policy so gestores can view their subordinates' profiles
CREATE POLICY "Gestores can view subordinate profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  gestor_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR auth.uid() = id
);
