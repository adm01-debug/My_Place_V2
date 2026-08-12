-- =============================================
-- POPULAR USUÁRIOS FICTÍCIOS (dev)
-- =============================================

-- 1. Remover FKs temporariamente
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- 2. Inserir colaboradores
INSERT INTO public.profiles (id, nome, email, departamento, cargo, data_admissao, matricula, salario_base, valor_hora_extra) VALUES
('b0000001-0001-0001-0001-000000000001', 'Ana Silva', 'ana.silva@empresa.com.br', 'TI', 'Analista', '2024-01-15', 'TI0001', 8500, 55),
('b0000002-0002-0002-0002-000000000002', 'Bruno Santos', 'bruno.santos@empresa.com.br', 'TI', 'Analista', '2024-03-01', 'TI0002', 7800, 52),
('b0000003-0003-0003-0003-000000000003', 'Carlos Oliveira', 'carlos.oliveira@empresa.com.br', 'RH', 'Coordenador', '2023-06-10', 'RH0001', 12000, 70),
('b0000004-0004-0004-0004-000000000004', 'Daniela Costa', 'daniela.costa@empresa.com.br', 'RH', 'Assistente', '2024-05-01', 'RH0002', 4500, 35),
('b0000005-0005-0005-0005-000000000005', 'Eduardo Ferreira', 'eduardo.ferreira@empresa.com.br', 'Financeiro', 'Analista', '2023-09-20', 'FIN001', 9200, 60),
('b0000006-0006-0006-0006-000000000006', 'Fernanda Lima', 'fernanda.lima@empresa.com.br', 'Financeiro', 'Assistente', '2024-07-15', 'FIN002', 4800, 38),
('b0000007-0007-0007-0007-000000000007', 'Gabriel Rodrigues', 'gabriel.rodrigues@empresa.com.br', 'Marketing', 'Analista', '2024-02-01', 'MKT001', 7500, 48),
('b0000008-0008-0008-0008-000000000008', 'Helena Alves', 'helena.alves@empresa.com.br', 'Marketing', 'Estagiário', '2024-08-01', 'MKT002', 2200, 18),
('b0000009-0009-0009-0009-000000000009', 'Igor Pereira', 'igor.pereira@empresa.com.br', 'Vendas', 'Coordenador', '2023-04-01', 'VEN001', 11000, 68),
('b0000010-0010-0010-0010-000000000010', 'Julia Souza', 'julia.souza@empresa.com.br', 'Vendas', 'Analista', '2024-01-20', 'VEN002', 6800, 45),
('b0000011-0011-0011-0011-000000000011', 'Lucas Martins', 'lucas.martins@empresa.com.br', 'Operações', 'Analista', '2023-11-15', 'OP0001', 7200, 47),
('b0000012-0012-0012-0012-000000000012', 'Mariana Rocha', 'mariana.rocha@empresa.com.br', 'Operações', 'Assistente', '2024-06-01', 'OP0002', 4200, 32),
('b0000013-0013-0013-0013-000000000013', 'Nicolas Carvalho', 'nicolas.carvalho@empresa.com.br', 'Jurídico', 'Analista', '2024-03-10', 'JUR001', 9500, 62),
('b0000014-0014-0014-0014-000000000014', 'Olivia Ribeiro', 'olivia.ribeiro@empresa.com.br', 'Jurídico', 'Assistente', '2024-09-15', 'JUR002', 5100, 40),
('b0000015-0015-0015-0015-000000000015', 'Pedro Almeida', 'pedro.almeida@empresa.com.br', 'Administrativo', 'Analista', '2023-08-01', 'ADM001', 6500, 42),
('b0000016-0016-0016-0016-000000000016', 'Quintino Bueno', 'quintino.bueno@empresa.com.br', 'Administrativo', 'Assistente', '2024-10-20', 'ADM002', 4000, 30);

-- 3. Adicionar Carlos como gestor
INSERT INTO public.user_roles (user_id, role) VALUES ('b0000003-0003-0003-0003-000000000003', 'gestor');

-- 4. Ver resultado
SELECT count(*) as total FROM public.profiles;
SELECT p.nome, p.departamento, p.cargo, r.role
FROM public.profiles p
LEFT JOIN public.user_roles r ON p.id = r.user_id
ORDER BY p.departamento;
