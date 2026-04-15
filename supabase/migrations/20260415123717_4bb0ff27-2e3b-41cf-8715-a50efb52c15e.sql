
-- Fix: Use SECURITY INVOKER instead of default SECURITY DEFINER
DROP VIEW IF EXISTS public.organograma_public_view;
CREATE VIEW public.organograma_public_view 
WITH (security_invoker = true) AS
SELECT id, nome, cargo, departamento, avatar_url, gestor_id
FROM public.profiles;
