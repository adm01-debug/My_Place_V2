-- =============================================
-- ATUALIZAR ADMIN E POPULAR DADOS
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. Verificar admin
SELECT p.nome, p.email, p.cargo, r.role
FROM public.profiles p
LEFT JOIN public.user_roles r ON p.id = r.user_id
WHERE p.email = 'ti@promobrindes.com.br';

-- 2. Garantir que admin existe com role correta
UPDATE public.profiles SET
  nome = 'Admin TI',
  departamento = 'TI',
  cargo = 'Administrador'
WHERE id = '92cc75c8-dc16-4c02-b9e3-7a05387ce7a2';

INSERT INTO public.user_roles (user_id, role)
VALUES ('92cc75c8-dc16-4c02-b9e3-7a05387ce7a2', 'admin')
ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

-- 3. Inserir colaboradores (ignora se já existirem)
INSERT INTO public.profiles (id, nome, email, departamento, cargo, data_admissao, matricula, salario_base, valor_hora_extra) VALUES
('d1111111-1111-1111-1111-111111111111', 'Ana Silva', 'ana.silva@empresa.com.br', 'TI', 'Analista', '2024-01-15', 'TI0001', 8500, 55),
('d2222222-2222-2222-2222-222222222222', 'Bruno Santos', 'bruno.santos@empresa.com.br', 'TI', 'Analista', '2024-03-01', 'TI0002', 7800, 52),
('d3333333-3333-3333-3333-333333333333', 'Carlos Oliveira', 'carlos.oliveira@empresa.com.br', 'RH', 'Coordenador', '2023-06-10', 'RH0001', 12000, 70),
('d4444444-4444-4444-4444-444444444444', 'Daniela Costa', 'daniela.costa@empresa.com.br', 'RH', 'Assistente', '2024-05-01', 'RH0002', 4500, 35),
('d5555555-5555-5555-5555-555555555555', 'Eduardo Ferreira', 'eduardo.ferreira@empresa.com.br', 'Financeiro', 'Analista', '2023-09-20', 'FIN001', 9200, 60),
('d6666666-6666-6666-6666-666666666666', 'Fernanda Lima', 'fernanda.lima@empresa.com.br', 'Financeiro', 'Assistente', '2024-07-15', 'FIN002', 4800, 38),
('d7777777-7777-7777-7777-777777777777', 'Gabriel Rodrigues', 'gabriel.rodrigues@empresa.com.br', 'Marketing', 'Analista', '2024-02-01', 'MKT001', 7500, 48),
('d8888888-8888-8888-8888-888888888888', 'Helena Alves', 'helena.alves@empresa.com.br', 'Marketing', 'Estagiário', '2024-08-01', 'MKT002', 2200, 18),
('d9999999-9999-9999-9999-999999999999', 'Igor Pereira', 'igor.pereira@empresa.com.br', 'Vendas', 'Coordenador', '2023-04-01', 'VEN001', 11000, 68),
('daaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Julia Souza', 'julia.souza@empresa.com.br', 'Vendas', 'Analista', '2024-01-20', 'VEN002', 6800, 45),
('dbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Lucas Martins', 'lucas.martins@empresa.com.br', 'Operações', 'Analista', '2023-11-15', 'OP0001', 7200, 47),
('dcccccccc-cccc-cccc-cccc-cccccccccccc', 'Mariana Rocha', 'mariana.rocha@empresa.com.br', 'Operações', 'Assistente', '2024-06-01', 'OP0002', 4200, 32),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Nicolas Carvalho', 'nicolas.carvalho@empresa.com.br', 'Jurídico', 'Analista', '2024-03-10', 'JUR001', 9500, 62),
('deeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Olivia Ribeiro', 'olivia.ribeiro@empresa.com.br', 'Jurídico', 'Assistente', '2024-09-15', 'JUR002', 5100, 40),
('dffffffff-ffff-ffff-ffff-ffffffffffff', 'Pedro Almeida', 'pedro.almeida@empresa.com.br', 'Administrativo', 'Analista', '2023-08-01', 'ADM001', 6500, 42),
('d0000000-0000-0000-0000-000000000001', 'Quintino Bueno', 'quintino.bueno@empresa.com.br', 'Administrativo', 'Assistente', '2024-10-20', 'ADM002', 4000, 30)
ON CONFLICT (id) DO NOTHING;

-- 4. Feriados
INSERT INTO public.feriados (nome, data, tipo, recorrente) VALUES
('Ano Novo', '2026-01-01', 'nacional', true),
('Carnaval', '2026-02-17', 'nacional', false),
('Sexta-feira Santa', '2026-04-03', 'nacional', false),
('Tiradentes', '2026-04-21', 'nacional', true),
('Dia do Trabalho', '2026-05-01', 'nacional', true),
('Corpus Christi', '2026-06-04', 'nacional', false),
('Independência', '2026-09-07', 'nacional', true),
('Nossa Senhora Aparecida', '2026-10-12', 'nacional', true),
('Finados', '2026-11-02', 'nacional', true),
('Proclamação da República', '2026-11-15', 'nacional', true),
('Natal', '2026-12-25', 'nacional', true)
ON CONFLICT DO NOTHING;

-- 5. FAQ
INSERT INTO public.faq (pergunta, resposta, categoria, prioridade) VALUES
('Como solicito férias?', 'Acesse o menu Férias e clique em Nova Solicitação.', 'Férias', 1),
('Como registro o ponto?', 'Use o sistema de ponto digital pelo portal ou app mobile.', 'Ponto', 2),
('Como solicito reembolso?', 'Acesse Reembolsos, preencha o formulário e anexe o comprovante.', 'Financeiro', 3),
('Qual o horário de trabalho?', 'Das 8h às 18h, com 1h de almoço.', 'RH', 4),
('Como atualizo meus dados?', 'Acesse seu perfil e clique em Editar Dados.', 'RH', 5),
('Como funciona o vale refeição?', 'Creditado no cartão empresa no início do mês.', 'Benefícios', 6),
('Como solicito atestado?', 'Envie pelo portal em até 48h após o afastamento.', 'Saúde', 7),
('Como solicito adiantamento?', 'Solicite pelo portal na seção Financeiro. Máximo 30% do salário.', 'Financeiro', 8)
ON CONFLICT (pergunta) DO NOTHING;

-- 6. Comunicados
INSERT INTO public.comunicados (titulo, conteudo, prioridade, status, autor_id) VALUES
('Bem-vindo ao Portal RH', 'Estamos felizes em apresentar nosso portal de RH.', 'alta', 'publicado', '92cc75c8-dc16-4c02-b9e3-7a05387ce7a2'),
('Atualização de Benefícios 2026', 'A partir de janeiro, novo plano de saúde com cobertura ampliada.', 'alta', 'publicado', '92cc75c8-dc16-4c02-b9e3-7a05387ce7a2'),
('Encontro de Fim de Ano', 'Convidamos todos para o encontro de fim de ano! 15/12 às 19h.', 'media', 'publicado', '92cc75c8-dc16-4c02-b9e3-7a05387ce7a2'),
('Programa de Capacitação', 'Inscrições abertas para cursos de desenvolvimento profissional.', 'media', 'publicado', '92cc75c8-dc16-4c02-b9e3-7a05387ce7a2')
ON CONFLICT (titulo) DO NOTHING;

-- 7. Resultado
SELECT 'profiles' as tabela, count(*) as total FROM public.profiles
UNION ALL SELECT 'feriados', count(*) FROM public.feriados
UNION ALL SELECT 'faq', count(*) FROM public.faq
UNION ALL SELECT 'comunicados', count(*) FROM public.comunicados
UNION ALL SELECT 'user_roles', count(*) FROM public.user_roles;
