-- =============================================
-- SEED DATA para MyPlace v2
-- Execute no Supabase Dashboard > SQL Editor
-- =============================================

-- IDs dos perfis (para foreign keys)
DO $$
DECLARE
  gestor_ti_uuid UUID := 'a0000000-0000-0000-0000-000000000001';
  gestor_rh_uuid UUID := 'a0000000-0000-0000-0000-000000000002';
  gestor_fin_uuid UUID := 'a0000000-0000-0000-0000-000000000003';
  gestor_mkt_uuid UUID := 'a0000000-0000-0000-0000-000000000004';
BEGIN

-- =============== PROFILES ===============
INSERT INTO public.profiles (id, nome, email, departamento, cargo, data_admissao, matricula, salario_base, valor_hora_extra) VALUES
(gestor_ti_uuid, 'Gestor TI', 'gestor.ti@empresa.com.br', 'TI', 'Gerente', '2022-01-15', 'GTI0001', 18000, 100),
(gestor_rh_uuid, 'Gestor RH', 'gestor.rh@empresa.com.br', 'RH', 'Gerente', '2022-02-01', 'GRH0001', 16500, 95),
(gestor_fin_uuid, 'Gestor Financeiro', 'gestor.fin@empresa.com.br', 'Financeiro', 'Gerente', '2021-11-20', 'GFIN001', 17500, 98),
(gestor_mkt_uuid, 'Gestor Marketing', 'gestor.mkt@empresa.com.br', 'Marketing', 'Gerente', '2023-01-10', 'GMKT001', 16000, 92),
('b0000000-0000-0000-0000-000000000001', 'Ana Silva', 'ana.silva@empresa.com.br', 'TI', 'Analista', '2023-03-15', 'TI0001', 8500, 55),
('b0000000-0000-0000-0000-000000000002', 'Bruno Santos', 'bruno.santos@empresa.com.br', 'TI', 'Analista', '2023-06-01', 'TI0002', 7800, 52),
('b0000000-0000-0000-0000-000000000003', 'Carlos Oliveira', 'carlos.oliveira@empresa.com.br', 'RH', 'Coordenador', '2022-09-10', 'RH0001', 12000, 70),
('b0000000-0000-0000-0000-000000000004', 'Daniela Costa', 'daniela.costa@empresa.com.br', 'RH', 'Assistente', '2024-01-05', 'RH0002', 4500, 35),
('b0000000-0000-0000-0000-000000000005', 'Eduardo Ferreira', 'eduardo.ferreira@empresa.com.br', 'Financeiro', 'Analista', '2023-04-20', 'FIN001', 9200, 60),
('b0000000-0000-0000-0000-000000000006', 'Fernanda Lima', 'fernanda.lima@empresa.com.br', 'Financeiro', 'Assistente', '2024-02-15', 'FIN002', 4800, 38),
('b0000000-0000-0000-0000-000000000007', 'Gabriel Rodrigues', 'gabriel.rodrigues@empresa.com.br', 'Marketing', 'Analista', '2023-08-01', 'MKT001', 7500, 48),
('b0000000-0000-0000-0000-000000000008', 'Helena Alves', 'helena.alves@empresa.com.br', 'Marketing', 'Estagiário', '2024-06-01', 'MKT002', 2200, 18),
('b0000000-0000-0000-0000-000000000009', 'Igor Pereira', 'igor.pereira@empresa.com.br', 'Vendas', 'Coordenador', '2022-12-01', 'VEN001', 11000, 68),
('b0000000-0000-0000-0000-000000000010', 'Julia Souza', 'julia.souza@empresa.com.br', 'Vendas', 'Analista', '2023-09-15', 'VEN002', 6800, 45),
('b0000000-0000-0000-0000-000000000011', 'Lucas Martins', 'lucas.martins@empresa.com.br', 'Operações', 'Analista', '2023-05-20', 'OP0001', 7200, 47),
('b0000000-0000-0000-0000-000000000012', 'Mariana Rocha', 'mariana.rocha@empresa.com.br', 'Operações', 'Assistente', '2024-03-01', 'OP0002', 4200, 32),
('b0000000-0000-0000-0000-000000000013', 'Nicolas Carvalho', 'nicolas.carvalho@empresa.com.br', 'Jurídico', 'Analista', '2023-07-10', 'JUR001', 9500, 62),
('b0000000-0000-0000-0000-000000000014', 'Olivia Ribeiro', 'olivia.ribeiro@empresa.com.br', 'Jurídico', 'Assistente', '2024-04-15', 'JUR002', 5100, 40),
('b0000000-0000-0000-0000-000000000015', 'Pedro Almeida', 'pedro.almeida@empresa.com.br', 'Administrativo', 'Analista', '2023-02-01', 'ADM001', 6500, 42),
('b0000000-0000-0000-0000-000000000016', 'Quintino Bueno', 'quintino.bueno@empresa.com.br', 'Administrativo', 'Assistente', '2024-01-20', 'ADM002', 4000, 30);

-- =============== FERIADOS ===============
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

-- =============== FAQ ===============
INSERT INTO public.faq (pergunta, resposta, categoria) VALUES
('Como solicito férias?', 'Acesse o menu Férias no portal e clique em Nova Solicitação. Preencha as datas desejadas e envie para aprovação do seu gestor.', 'Férias'),
('Como registro o ponto?', 'Use o sistema de ponto digital pelo portal ou aplicativo mobile. Toque em Registrar ao chegar e ao sair.', 'Ponto'),
('Como solicito reembolso?', 'Acesse a seção Reembolsos, preencha o formulário com os dados da despesa e anexe o comprovante.', 'Financeiro'),
('Qual o horário de trabalho?', 'O horário padrão é das 8h às 18h, com 1h de almoço (12h às 13h). Há flexibilidade de 30min na entrada.', 'RH'),
('Como atualizo meus dados?', 'Acesse seu perfil e clique em Editar Dados. Campos como endereço e telefone podem ser atualizados diretamente.', 'RH'),
('Como funciona o vale refeição?', 'O vale refeição é creditado no cartão empresa no início de cada mês. O valor é proporcional aos dias úteis.', 'Benefícios'),
('Como solicito atestado?', 'Envie pelo portal em até 48h após o afastamento. Anexe o documento legível.', 'Saúde'),
('Como solicito adiantamento?', 'Solicite pelo portal na seção Financeiro. O valor máximo é 30% do salário e sujeito a aprovação.', 'Financeiro');

-- =============== COMUNICADOS ===============
INSERT INTO public.comunicados (titulo, conteudo, prioridade, status) VALUES
('Bem-vindo ao Portal RH', 'Estamos felizes em apresentar nosso novo portal de RH. Aqui você encontra todas as informações sobre benefícios, férias, ponto e muito mais.', 'alta', 'publicado'),
('Atualização de Benefícios 2026', 'A partir de janeiro, teremos novo plano de saúde com cobertura ampliada para você e sua família. Novidades também para vale refeição.', 'alta', 'publicado'),
('Encontro de Fim de Ano', 'Convidamos todos para o encontro de fim de ano! Data: 15 de dezembro, às 19h. Traga sua família! Haverá sorteio de prêmios.', 'media', 'publicado'),
('Manutenção do Sistema', 'No dia 20/12 haverá manutenção programada das 22h às 24h. O sistema poderá ficar indisponível nesse período.', 'baixa', 'publicado'),
('Programa de Capacitação', 'Inscrições abertas para cursos de desenvolvimento profissional. Acesse a seção Treinamentos e escolha seu curso.', 'media', 'publicado');

-- =============== BENEFÍCIOS ===============
INSERT INTO public.beneficios (user_id, nome, tipo, descricao, valor_mensal, status)
SELECT
  id,
  CASE (random() * 3)::int
    WHEN 0 THEN 'Plano de Saúde Premium'
    WHEN 1 THEN 'Vale Refeição'
    WHEN 2 THEN 'Vale Transporte'
    WHEN 3 THEN 'Seguro de Vida'
  END,
  CASE (random() * 3)::int
    WHEN 0 THEN 'plano_saude'
    WHEN 1 THEN 'vale_refeicao'
    WHEN 2 THEN 'vale_transporte'
    WHEN 3 THEN 'seguro_vida'
  END,
  'Benefício corporativo',
  (200 + (random() * 800))::numeric(10,2),
  'ativo'
FROM public.profiles
LIMIT 40;

-- =============== SOLICITAÇÕES ===============
INSERT INTO public.solicitacoes (user_id, tipo, descricao, valor, prioridade, status)
SELECT
  id,
  (ARRAY['declaracao_vinculo', 'alteracao_dados', 'adiantamento_salarial', 'vale_refeicao'])[floor(random() * 4 + 1)],
  'Solicitação de teste #' || generate_series,
  CASE WHEN random() > 0.5 THEN (500 + (random() * 2500))::numeric(10,2) ELSE NULL END,
  (ARRAY['baixa', 'normal', 'alta'])[floor(random() * 3 + 1)],
  (ARRAY['pendente', 'em_analise', 'aprovada', 'recusada'])[floor(random() * 4 + 1)]
FROM public.profiles
CROSS JOIN generate_series(1, 20);

-- =============== FÉRIAS ===============
INSERT INTO public.solicitacoes_ferias (user_id, data_inicio, data_fim, dias, tipo, status)
SELECT
  id,
  CURRENT_DATE + (random() * 90)::int,
  CURRENT_DATE + (random() * 90 + 15)::int,
  (15 + (random() * 15))::int,
  (ARRAY['regular', 'abono_pecuniario', 'fracionada'])[floor(random() * 3 + 1)],
  (ARRAY['pendente', 'aprovada', 'aprovada', 'recusada'])[floor(random() * 4 + 1)]
FROM public.profiles
LIMIT 15;

-- =============== NOTIFICAÇÕES ===============
INSERT INTO public.notificacoes (user_id, titulo, mensagem, tipo, lida)
SELECT
  id,
  (ARRAY['Férias aprovadas!', 'Lembrete: Registro de ponto', 'Novo comunicado disponível',
         'Holerite disponível', 'Treinamento obrigatório'])[floor(random() * 5 + 1)],
  (ARRAY['Sua solicitação foi aprovada pelo gestor.', 'Não esqueça de bater o ponto hoje!',
         'Confira o novo comunicado da empresa.', 'Seu holerite já está disponível.',
         'Você tem um treinamento pendente.'])[floor(random() * 5 + 1)],
  (ARRAY['info', 'info', 'sucesso', 'alerta'])[floor(random() * 4 + 1)],
  random() > 0.5
FROM public.profiles
CROSS JOIN generate_series(1, 2);

END $$;

-- Verificar resultado
SELECT 'profiles' as tabela, count(*) as total FROM public.profiles
UNION ALL
SELECT 'beneficios', count(*) FROM public.beneficios
UNION ALL
SELECT 'feriados', count(*) FROM public.feriados
UNION ALL
SELECT 'faq', count(*) FROM public.faq
UNION ALL
SELECT 'comunicados', count(*) FROM public.comunicados
UNION ALL
SELECT 'solicitacoes', count(*) FROM public.solicitacoes
UNION ALL
SELECT 'solicitacoes_ferias', count(*) FROM public.solicitacoes_ferias
UNION ALL
SELECT 'notificacoes', count(*) FROM public.notificacoes;
