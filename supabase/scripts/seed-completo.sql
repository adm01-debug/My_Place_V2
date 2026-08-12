-- =============================================
-- SEED COMPLETO - MyPlace v2
-- Execute no Supabase SQL Editor
-- =============================================

-- 1. Remover FKs para poder inserir dados de teste
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- 2. Limpar dados existentes
TRUNCATE public.profiles CASCADE;
TRUNCATE public.user_roles CASCADE;
TRUNCATE public.beneficios CASCADE;
TRUNCATE public.feriados CASCADE;
TRUNCATE public.faq CASCADE;
TRUNCATE public.comunicados CASCADE;
TRUNCATE public.solicitacoes CASCADE;
TRUNCATE public.solicitacoes_ferias CASCADE;
TRUNCATE public.notificacoes CASCADE;
TRUNCATE public.registros_ponto CASCADE;
TRUNCATE public.holerites CASCADE;

-- =============================================
-- 3. PROFILES - Admin
-- =============================================
INSERT INTO public.profiles (id, nome, email, departamento, cargo, data_admissao, matricula, salario_base, valor_hora_extra)
VALUES ('92cc75c8-dc16-4c02-b9e3-7a05387ce7a2', 'Admin TI', 'ti@promobrindes.com.br', 'TI', 'Administrador', '2020-01-01', 'ADMIN001', 0, 0);

INSERT INTO public.user_roles (user_id, role) VALUES ('92cc75c8-dc16-4c02-b9e3-7a05387ce7a2', 'admin');

-- =============================================
-- 4. PROFILES - Colaboradores
-- =============================================
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

-- Gestores
INSERT INTO public.user_roles (user_id, role) VALUES
('b0000003-0003-0003-0003-000000000003', 'gestor'),
('b0000009-0009-0009-0009-000000000009', 'gestor');

-- =============================================
-- 5. FERIADOS
-- =============================================
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
('Natal', '2026-12-25', 'nacional', true);

-- =============================================
-- 6. FAQ
-- =============================================
INSERT INTO public.faq (pergunta, resposta, categoria, prioridade) VALUES
('Como solicito férias?', 'Acesse o menu Férias e clique em Nova Solicitação. Preencha as datas e envie para aprovação.', 'Férias', 1),
('Como registro o ponto?', 'Use o sistema de ponto digital pelo portal ou aplicativo mobile. Registre ao chegar e ao sair.', 'Ponto', 2),
('Como solicito reembolso?', 'Acesse a seção Reembolsos, preencha o formulário e anexe o comprovante.', 'Financeiro', 3),
('Qual o horário de trabalho?', 'O horário padrão é das 8h às 18h, com 1h de almoço. Há flexibilidade de 30min na entrada.', 'RH', 4),
('Como atualizo meus dados?', 'Acesse seu perfil e clique em Editar Dados. Endereço e telefone podem ser atualizados diretamente.', 'RH', 5),
('Como funciona o vale refeição?', 'O vale refeição é creditado no cartão empresa no início de cada mês.', 'Benefícios', 6),
('Como solicito atestado?', 'Envie pelo portal em até 48h após o afastamento. Anexe o documento legível.', 'Saúde', 7),
('Como solicito adiantamento?', 'Solicite pelo portal na seção Financeiro. O valor máximo é 30% do salário.', 'Financeiro', 8);

-- =============================================
-- 7. COMUNICADOS
-- =============================================
INSERT INTO public.comunicados (titulo, conteudo, prioridade, status, autor_id) VALUES
('Bem-vindo ao Portal RH', 'Estamos felizes em apresentar nosso portal de RH. Aqui você encontra todas as informações sobre benefícios, férias, ponto e muito mais.', 'alta', 'publicado', '92cc75c8-dc16-4c02-b9e3-7a05387ce7a2'),
('Atualização de Benefícios 2026', 'A partir de janeiro, teremos novo plano de saúde com cobertura ampliada para você e sua família.', 'alta', 'publicado', '92cc75c8-dc16-4c02-b9e3-7a05387ce7a2'),
('Encontro de Fim de Ano', 'Convidamos todos para o encontro de fim de ano! Data: 15 de dezembro, às 19h. Haverá sorteio de prêmios.', 'media', 'publicado', '92cc75c8-dc16-4c02-b9e3-7a05387ce7a2'),
('Manutenção do Sistema', 'No dia 20/12 haverá manutenção programada das 22h às 24h. O sistema poderá ficar indisponível.', 'baixa', 'publicado', '92cc75c8-dc16-4c02-b9e3-7a05387ce7a2'),
('Programa de Capacitação', 'Inscrições abertas para cursos de desenvolvimento profissional. Acesse a seção Treinamentos.', 'media', 'publicado', '92cc75c8-dc16-4c02-b9e3-7a05387ce7a2');

-- =============================================
-- 8. BENEFÍCIOS
-- =============================================
INSERT INTO public.beneficios (user_id, nome, tipo, descricao, valor_mensal, status) VALUES
('b0000001-0001-0001-0001-000000000001', 'Plano de Saúde Premium', 'plano_saude', 'Cobertura completa com odontológico', 850, 'ativo'),
('b0000001-0001-0001-0001-000000000001', 'Vale Refeição', 'vale_refeicao', 'R$ 45/dia útil', 990, 'ativo'),
('b0000002-0002-0002-0002-000000000002', 'Plano de Saúde Premium', 'plano_saude', 'Cobertura completa com odontológico', 850, 'ativo'),
('b0000002-0002-0002-0002-000000000002', 'Vale Refeição', 'vale_refeicao', 'R$ 45/dia útil', 990, 'ativo'),
('b0000003-0003-0003-0003-000000000003', 'Plano de Saúde Premium', 'plano_saude', 'Cobertura completa com odontológico', 850, 'ativo'),
('b0000003-0003-0003-0003-000000000003', 'Vale Refeição', 'vale_refeicao', 'R$ 45/dia útil', 990, 'ativo'),
('b0000003-0003-0003-0003-000000000003', 'Seguro de Vida', 'seguro_vida', 'Capital de R$ 200.000', 150, 'ativo'),
('b0000004-0004-0004-0004-000000000004', 'Plano de Saúde Standard', 'plano_saude', 'Cobertura básica', 650, 'ativo'),
('b0000004-0004-0004-0004-000000000004', 'Vale Refeição', 'vale_refeicao', 'R$ 40/dia útil', 880, 'ativo'),
('b0000005-0005-0005-0005-000000000005', 'Plano de Saúde Premium', 'plano_saude', 'Cobertura completa com odontológico', 850, 'ativo'),
('b0000005-0005-0005-0005-000000000005', 'Vale Refeição', 'vale_refeicao', 'R$ 45/dia útil', 990, 'ativo');

-- =============================================
-- 9. SOLICITAÇÕES
-- =============================================
INSERT INTO public.solicitacoes (user_id, tipo, descricao, valor, prioridade, status) VALUES
('b0000001-0001-0001-0001-000000000001', 'declaracao_vinculo', 'Solicito declaração de vínculo empregatício para fins de financiamento.', 0, 'normal', 'aprovada'),
('b0000002-0002-0002-0002-000000000002', 'adiantamento_salarial', 'Solicito adiantamento de salário devido a emergência familiar.', 3000, 'alta', 'em_analise'),
('b0000003-0003-0003-0003-000000000003', 'vale_refeicao', 'Solicito aumento do valor do vale refeição.', 0, 'normal', 'pendente'),
('b0000004-0004-0004-0004-000000000004', 'alteracao_dados', 'Solicito atualização de dados bancários.', 0, 'baixa', 'aprovada'),
('b0000005-0005-0005-0005-000000000005', 'declaracao_vinculo', 'Declaração para保险公司.', 0, 'normal', 'aprovada'),
('b0000006-0006-0006-0006-000000000006', 'adiantamento_salarial', 'Adiantamento para pagamento de imóvel.', 5000, 'alta', 'pendente'),
('b0000007-0007-0007-0007-000000000007', 'vale_transporte', 'Solicito vale transporte.', 0, 'normal', 'aprovada'),
('b0000008-0008-0008-0008-000000000008', 'carta_recomendacao', 'Solicito carta de recomendação para mestrado.', 0, 'normal', 'pendente'),
('b0000001-0001-0001-0001-000000000001', 'outros', 'Solicito autorização para trabalho remoto.', 0, 'normal', 'recusada'),
('b0000002-0002-0002-0002-000000000002', 'alteracao_dados', 'Atualização de endereço.', 0, 'baixa', 'aprovada');

-- =============================================
-- 10. FÉRIAS
-- =============================================
INSERT INTO public.solicitacoes_ferias (user_id, data_inicio, data_fim, dias, tipo, status) VALUES
('b0000001-0001-0001-0001-000000000001', '2026-02-01', '2026-02-16', 15, 'regular', 'aprovada'),
('b0000002-0002-0002-0002-000000000002', '2026-03-01', '2026-03-15', 14, 'regular', 'aprovada'),
('b0000003-0003-0003-0003-000000000003', '2026-01-15', '2026-01-30', 15, 'regular', 'aprovada'),
('b0000004-0004-0004-0004-000000000004', '2026-04-01', '2026-04-15', 14, 'fracionada', 'pendente'),
('b0000005-0005-0005-0005-000000000005', '2026-05-01', '2026-05-20', 19, 'regular', 'aprovada'),
('b0000006-0006-0006-0006-000000000006', '2026-06-15', '2026-06-29', 14, 'abono_pecuniario', 'pendente'),
('b0000007-0007-0007-0007-000000000007', '2026-07-01', '2026-07-20', 19, 'regular', 'aprovada'),
('b0000008-0008-0008-0008-000000000008', '2026-08-01', '2026-08-10', 9, 'fracionada', 'pendente');

-- =============================================
-- 11. NOTIFICAÇÕES
-- =============================================
INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, lida) VALUES
('b0000001-0001-0001-0001-000000000001', 'Férias aprovadas!', 'Sua solicitação de férias foi aprovada pelo gestor.', 'sucesso', false),
('b0000001-0001-0001-0001-000000000001', 'Lembrete: Registro de ponto', 'Não esqueça de bater o ponto hoje!', 'info', false),
('b0000002-0002-0002-0002-000000000002', 'Solicitação em análise', 'Sua solicitação de adiantamento está sendo analisada.', 'info', false),
('b0000003-0003-0003-0003-000000000003', 'Novo comunicado', 'Novo comunicado disponível: Atualização de Benefícios 2026.', 'info', true),
('b0000004-0004-0004-0004-000000000004', 'Holerite disponível', 'Seu holerite do mês de Janeiro já está disponível.', 'info', false),
('b0000005-0005-0005-0005-000000000005', 'Férias aprovadas!', 'Suas férias foram aprovadas para maio.', 'sucesso', true),
('b0000006-0006-0006-0006-000000000006', 'Treinamento obrigatório', 'Você tem um treinamento pendente de segurança.', 'alerta', false),
('b0000007-0007-0007-0007-000000000007', 'Aniversário amanhã!', 'Não esqueça de parabenhar Helena Alves amanhã!', 'info', true),
('b0000008-0008-0008-0008-000000000008', 'Bem-vindo!', 'Bem-vindo ao portal MyPlace! Explore todas as funcionalidades.', 'info', false);

-- =============================================
-- 12. REGISTROS DE PONTO (últimos 7 dias)
-- =============================================
INSERT INTO public.registros_ponto (user_id, data_hora, tipo, latitude, longitude)
SELECT
  'b0000001-0001-0001-0001-000000000001',
  (CURRENT_DATE - (i || ' days')::interval)::date || ' 08:00:00',
  'entrada',
  -23.5,
  -46.6
FROM generate_series(0, 6) i;

INSERT INTO public.registros_ponto (user_id, data_hora, tipo, latitude, longitude)
SELECT
  'b0000001-0001-0001-0001-000000000001',
  (CURRENT_DATE - (i || ' days')::interval)::date || ' 12:00:00',
  'saida_almoco',
  -23.5,
  -46.6
FROM generate_series(0, 6) i;

INSERT INTO public.registros_ponto (user_id, data_hora, tipo, latitude, longitude)
SELECT
  'b0000001-0001-0001-0001-000000000001',
  (CURRENT_DATE - (i || ' days')::interval)::date || ' 13:00:00',
  'retorno_almoco',
  -23.5,
  -46.6
FROM generate_series(0, 6) i;

INSERT INTO public.registros_ponto (user_id, data_hora, tipo, latitude, longitude)
SELECT
  'b0000001-0001-0001-0001-000000000001',
  (CURRENT_DATE - (i || ' days')::interval)::date || ' 18:00:00',
  'saida',
  -23.5,
  -46.6
FROM generate_series(0, 6) i;

-- =============================================
-- 13. RESULTADO FINAL
-- =============================================
SELECT '========================================' as info;
SELECT 'SEED MyPlace v2 - RESULTADO' as titulo;
SELECT '========================================' as info;

SELECT 'profiles' as tabela, count(*) as total FROM public.profiles
UNION ALL SELECT 'user_roles', count(*) FROM public.user_roles
UNION ALL SELECT 'feriados', count(*) FROM public.feriados
UNION ALL SELECT 'faq', count(*) FROM public.faq
UNION ALL SELECT 'comunicados', count(*) FROM public.comunicados
UNION ALL SELECT 'beneficios', count(*) FROM public.beneficios
UNION ALL SELECT 'solicitacoes', count(*) FROM public.solicitacoes
UNION ALL SELECT 'solicitacoes_ferias', count(*) FROM public.solicitacoes_ferias
UNION ALL SELECT 'notificacoes', count(*) FROM public.notificacoes
UNION ALL SELECT 'registros_ponto', count(*) FROM public.registros_ponto;

SELECT '========================================' as sep;
SELECT 'USUÁRIOS CADASTRADOS:' as info;
SELECT p.nome, p.email, p.departamento, p.cargo, r.role
FROM public.profiles p
LEFT JOIN public.user_roles r ON p.id = r.user_id
ORDER BY r.role DESC NULLS LAST, p.departamento;
