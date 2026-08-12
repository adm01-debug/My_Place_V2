-- =============================================
-- POPULAR DADOS - Sem ON CONFLICT
-- =============================================

-- 1. Garantir admin é admin
UPDATE public.profiles SET nome = 'Admin TI', departamento = 'TI', cargo = 'Administrador'
WHERE id = '92cc75c8-dc16-4c02-b9e3-7a05387ce7a2';

DELETE FROM public.user_roles WHERE user_id = '92cc75c8-dc16-4c02-b9e3-7a05387ce7a2';
INSERT INTO public.user_roles (user_id, role) VALUES ('92cc75c8-dc16-4c02-b9e3-7a05387ce7a2', 'admin');

-- 2. Inserir colaboradores
INSERT INTO public.profiles (id, nome, email, departamento, cargo, data_admissao, matricula, salario_base) VALUES
('d1111111-1111-1111-1111-111111111111', 'Ana Silva', 'ana.silva@empresa.com.br', 'TI', 'Analista', '2024-01-15', 'TI0001', 8500);

-- 3. Verificar
SELECT p.nome, r.role FROM public.profiles p
LEFT JOIN public.user_roles r ON p.id = r.user_id
WHERE p.email = 'ti@promobrindes.com.br';

SELECT count(*) as total_profiles FROM public.profiles;
