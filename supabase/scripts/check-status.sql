-- =============================================
-- VERIFICAR ESTADO ATUAL
-- =============================================

-- 1. Ver todos os profiles
SELECT id, nome, email, cargo FROM public.profiles ORDER BY created_at;

-- 2. Ver roles
SELECT * FROM public.user_roles;

-- 3. Contagem geral
SELECT 'profiles' as tabela, count(*) as total FROM public.profiles
UNION ALL SELECT 'feriados', count(*) FROM public.feriados
UNION ALL SELECT 'faq', count(*) FROM public.faq
UNION ALL SELECT 'comunicados', count(*) FROM public.comunicados;
