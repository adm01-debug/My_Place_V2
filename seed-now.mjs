import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://twdechwttlqtmmfzwapc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3ZGVjaHd0dGxxdG1tZnp3YXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NTAxNzYsImV4cCI6MjEwMTIyNjE3Nn0.0qg4sXQCtHIbw0k1ik1TJvHPhvYsHU4YJiQdSznCdCA';

const supabase = createClient(supabaseUrl, supabaseKey);

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const now = new Date();
const year = now.getFullYear();

async function seed() {
  console.log('🚀 SEED DO BANCO DE DADOS - MyPlace v2\n');
  console.log('👤 Admin: ti@promobrindes.com.br\n');

  // UUID fixo para o admin
  const adminId = 'c0000000-0000-0000-0000-000000000001';

  // =============== 1. CRIAR ADMIN ===============
  console.log('1️⃣ Criando usuário admin...');

  const { error: adminError } = await supabase.from('profiles').upsert({
    id: adminId,
    nome: 'Admin TI',
    email: 'ti@promobrindes.com.br',
    departamento: 'TI',
    cargo: 'Administrador',
    data_admissao: '2020-01-01',
    matricula: 'ADMIN001',
    salario_base: 0,
    valor_hora_extra: 0,
    idioma_preferido: 'pt-BR'
  }, { onConflict: 'id' });

  if (adminError) {
    console.log('   ⚠️ Profile:', adminError.message);
  } else {
    console.log('   ✅ Profile admin criado');
  }

  // Inserir role de admin
  const { error: roleError } = await supabase.from('user_roles').upsert({
    user_id: adminId,
    role: 'admin'
  }, { onConflict: 'user_id' });

  if (roleError) {
    console.log('   ⚠️ Role:', roleError.message);
  } else {
    console.log('   ✅ Role admin definida');
  }

  // =============== 2. LIMPAR DADOS ANTIGOS ===============
  console.log('\n2️⃣ Limpando dados antigos...');

  const tablesToClean = [
    'ideias_votos', 'ideias_comentarios', 'ideias',
    'treinamentos_matriculas', 'reembolsos',
    'onboarding_progresso', 'onboarding_colaborador',
    'notificacoes',
    'solicitacoes_historico', 'solicitacoes',
    'solicitacoes_ferias',
    'registros_ponto', 'justificativas_ponto',
    'holerites',
    'beneficios',
    'faq'
  ];

  for (const table of tablesToClean) {
    await supabase.from(table).delete().neq('id', uuidv4());
  }

  // Não limpar profiles do admin
  await supabase.from('profiles').delete().not('id', 'eq', adminId).neq('email', 'ti@promobrindes.com.br');

  console.log('   ✅ Dados antigos removidos');

  // =============== 3. DADOS FIXOS ===============
  console.log('\n3️⃣ Inserindo dados fixos...');

  // Feriados
  const feriados = [
    { nome: 'Ano Novo', data: `${year}-01-01`, tipo: 'nacional', recorrente: true },
    { nome: 'Carnaval', data: `${year}-02-17`, tipo: 'nacional', recorrente: false },
    { nome: 'Sexta-feira Santa', data: `${year}-04-03`, tipo: 'nacional', recorrente: false },
    { nome: 'Tiradentes', data: `${year}-04-21`, tipo: 'nacional', recorrente: true },
    { nome: 'Dia do Trabalho', data: `${year}-05-01`, tipo: 'nacional', recorrente: true },
    { nome: 'Corpus Christi', data: `${year}-06-04`, tipo: 'nacional', recorrente: false },
    { nome: 'Independência', data: `${year}-09-07`, tipo: 'nacional', recorrente: true },
    { nome: 'Nossa Senhora Aparecida', data: `${year}-10-12`, tipo: 'nacional', recorrente: true },
    { nome: 'Finados', data: `${year}-11-02`, tipo: 'nacional', recorrente: true },
    { nome: 'Proclamação da República', data: `${year}-11-15`, tipo: 'nacional', recorrente: true },
    { nome: 'Natal', data: `${year}-12-25`, tipo: 'nacional', recorrente: true }
  ];

  await supabase.from('feriados').upsert(feriados.map(f => ({ ...f, id: uuidv4() })), { onConflict: 'nome,data' });
  console.log('   ✅ 11 feriados inseridos');

  // FAQ
  const faqs = [
    { pergunta: 'Como solicito férias?', resposta: 'Acesse o menu Férias no portal e clique em Nova Solicitação. Preencha as datas desejadas e envie para aprovação.', categoria: 'Férias', prioridade: 1 },
    { pergunta: 'Como registro o ponto?', resposta: 'Use o sistema de ponto digital pelo portal ou aplicativo mobile. Registre ao chegar e ao sair.', categoria: 'Ponto', prioridade: 2 },
    { pergunta: 'Como solicito reembolso?', resposta: 'Acesse a seção Reembolsos, preencha o formulário e anexe o comprovante da despesa.', categoria: 'Financeiro', prioridade: 3 },
    { pergunta: 'Qual o horário de trabalho?', resposta: 'O horário padrão é das 8h às 18h, com 1h de almoço. Há flexibilidade de 30min na entrada.', categoria: 'RH', prioridade: 4 },
    { pergunta: 'Como atualizo meus dados?', resposta: 'Acesse seu perfil e clique em Editar Dados. Endereço e telefone podem ser atualizados diretamente.', categoria: 'RH', prioridade: 5 },
    { pergunta: 'Como funciona o vale refeição?', resposta: 'O vale refeição é creditado no cartão empresa no início de cada mês.', categoria: 'Benefícios', prioridade: 6 },
    { pergunta: 'Como solicito atestado?', resposta: 'Envie pelo portal em até 48h após o afastamento. Anexe o documento legível.', categoria: 'Saúde', prioridade: 7 },
    { pergunta: 'Como solicito adiantamento?', resposta: 'Solicite pelo portal na seção Financeiro. Máximo 30% do salário, sujeito a aprovação.', categoria: 'Financeiro', prioridade: 8 }
  ];

  await supabase.from('faq').upsert(faqs.map(f => ({ ...f, id: uuidv4() })), { onConflict: 'pergunta' });
  console.log('   ✅ 8 FAQs inseridos');

  // Comunicados
  const comunicados = [
    { titulo: 'Bem-vindo ao Portal RH', conteudo: 'Estamos felizes em apresentar nosso portal de RH. Aqui você encontra informações sobre benefícios, férias, ponto e muito mais.', prioridade: 'alta', status: 'publicado' },
    { titulo: 'Atualização de Benefícios 2026', conteudo: 'A partir de janeiro, teremos novo plano de saúde com cobertura ampliada. Novidades também para vale refeição.', prioridade: 'alta', status: 'publicado' },
    { titulo: 'Encontro de Fim de Ano', conteudo: 'Convidamos todos para o encontro de fim de ano! Data: 15 de dezembro, às 19h. Haverá sorteio de prêmios.', prioridade: 'media', status: 'publicado' },
    { titulo: 'Manutenção do Sistema', conteudo: 'No dia 20/12 haverá manutenção das 22h às 24h. O sistema poderá ficar indisponível.', prioridade: 'baixa', status: 'publicado' },
    { titulo: 'Programa de Capacitação', conteudo: 'Inscrições abertas para cursos de desenvolvimento profissional. Acesse a seção Treinamentos.', prioridade: 'media', status: 'publicado' }
  ];

  await supabase.from('comunicados').upsert(comunicados.map(c => ({ ...c, id: uuidv4(), autor_id: adminId })), { onConflict: 'titulo' });
  console.log('   ✅ 5 comunicados inseridos');

  // =============== 4. PROFILES (COLABORADORES) ===============
  console.log('\n4️⃣ Inserindo colaboradores...');

  const perfis = [
    { nome: 'Ana Silva', email: 'ana.silva@empresa.com.br', dept: 'TI', cargo: 'Analista', mesesAtras: 24 },
    { nome: 'Bruno Santos', email: 'bruno.santos@empresa.com.br', dept: 'TI', cargo: 'Analista', mesesAtras: 18 },
    { nome: 'Carlos Oliveira', email: 'carlos.oliveira@empresa.com.br', dept: 'RH', cargo: 'Coordenador', mesesAtras: 30 },
    { nome: 'Daniela Costa', email: 'daniela.costa@empresa.com.br', dept: 'RH', cargo: 'Assistente', mesesAtras: 12 },
    { nome: 'Eduardo Ferreira', email: 'eduardo.ferreira@empresa.com.br', dept: 'Financeiro', cargo: 'Analista', mesesAtras: 20 },
    { nome: 'Fernanda Lima', email: 'fernanda.lima@empresa.com.br', dept: 'Financeiro', cargo: 'Assistente', mesesAtras: 8 },
    { nome: 'Gabriel Rodrigues', email: 'gabriel.rodrigues@empresa.com.br', dept: 'Marketing', cargo: 'Analista', mesesAtras: 16 },
    { nome: 'Helena Alves', email: 'helena.alves@empresa.com.br', dept: 'Marketing', cargo: 'Estagiário', mesesAtras: 6 },
    { nome: 'Igor Pereira', email: 'igor.pereira@empresa.com.br', dept: 'Vendas', cargo: 'Coordenador', mesesAtras: 28 },
    { nome: 'Julia Souza', email: 'julia.souza@empresa.com.br', dept: 'Vendas', cargo: 'Analista', mesesAtras: 15 },
    { nome: 'Lucas Martins', email: 'lucas.martins@empresa.com.br', dept: 'Operações', cargo: 'Analista', mesesAtras: 22 },
    { nome: 'Mariana Rocha', email: 'mariana.rocha@empresa.com.br', dept: 'Operações', cargo: 'Assistente', mesesAtras: 9 },
    { nome: 'Nicolas Carvalho', email: 'nicolas.carvalho@empresa.com.br', dept: 'Jurídico', cargo: 'Analista', mesesAtras: 19 },
    { nome: 'Olivia Ribeiro', email: 'olivia.ribeiro@empresa.com.br', dept: 'Jurídico', cargo: 'Assistente', mesesAtras: 7 },
    { nome: 'Pedro Almeida', email: 'pedro.almeida@empresa.com.br', dept: 'Administrativo', cargo: 'Analista', mesesAtras: 25 },
    { nome: 'Quintino Bueno', email: 'quintino.bueno@empresa.com.br', dept: 'Administrativo', cargo: 'Assistente', mesesAtras: 11 }
  ];

  const profileIds = [];
  for (let i = 0; i < perfis.length; i++) {
    const p = perfis[i];
    const id = `d0000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`;
    profileIds.push(id);

    const admissao = new Date(now);
    admissao.setMonth(admissao.getMonth() - p.mesesAtras);

    await supabase.from('profiles').upsert({
      id: id,
      nome: p.nome,
      email: p.email,
      departamento: p.dept,
      cargo: p.cargo,
      data_admissao: admissao.toISOString().split('T')[0],
      matricula: `${p.dept.substring(0, 2).toUpperCase()}${String(i + 1).padStart(4, '0')}`,
      salario_base: 3000 + Math.random() * 10000,
      valor_hora_extra: 30 + Math.random() * 50
    }, { onConflict: 'id' });
  }
  console.log(`   ✅ ${perfis.length} colaboradores inseridos`);

  // =============== 5. BENEFÍCIOS ===============
  console.log('\n5️⃣ Inserindo benefícios...');

  const beneficios = [
    { tipo: 'plano_saude', nome: 'Plano de Saúde Premium' },
    { tipo: 'vale_refeicao', nome: 'Vale Refeição' },
    { tipo: 'vale_transporte', nome: 'Vale Transporte' },
    { tipo: 'seguro_vida', nome: 'Seguro de Vida' }
  ];

  let benefCount = 0;
  for (const pid of profileIds) {
    for (const b of beneficios.slice(0, 3)) {
      await supabase.from('beneficios').insert({
        id: uuidv4(),
        user_id: pid,
        nome: b.nome,
        tipo: b.tipo,
        descricao: `Benefício ${b.nome} para colaborador`,
        valor_mensal: 200 + Math.random() * 600,
        status: 'ativo'
      });
      benefCount++;
    }
  }
  console.log(`   ✅ ${benefCount} benefícios inseridos`);

  // =============== 6. SOLICITAÇÕES ===============
  console.log('\n6️⃣ Inserindo solicitações...');

  const tiposSol = ['declaracao_vinculo', 'alteracao_dados', 'adiantamento_salarial', 'vale_refeicao', 'vale_transporte'];
  const statusSol = ['pendente', 'em_analise', 'aprovada', 'recusada'];

  for (let i = 0; i < 20; i++) {
    await supabase.from('solicitacoes').insert({
      id: uuidv4(),
      user_id: profileIds[i % profileIds.length],
      tipo: tiposSol[Math.floor(Math.random() * tiposSol.length)],
      descricao: `Solicitação de teste #${i + 1}`,
      valor: Math.random() > 0.5 ? Math.floor(Math.random() * 3000) + 100 : null,
      prioridade: ['baixa', 'normal', 'alta'][Math.floor(Math.random() * 3)],
      status: statusSol[Math.floor(Math.random() * statusSol.length)]
    });
  }
  console.log('   ✅ 20 solicitações inseridas');

  // =============== 7. FÉRIAS ===============
  console.log('\n7️⃣ Inserindo pedidos de férias...');

  for (let i = 0; i < 15; i++) {
    const dataInicio = new Date(now);
    dataInicio.setDate(dataInicio.getDate() + Math.floor(Math.random() * 90) + 1);
    const dataFim = new Date(dataInicio);
    dataFim.setDate(dataFim.getDate() + 10 + Math.floor(Math.random() * 15));

    const statusFerias = ['pendente', 'aprovada', 'aprovada', 'recusada'][Math.floor(Math.random() * 4)];

    await supabase.from('solicitacoes_ferias').insert({
      id: uuidv4(),
      user_id: profileIds[i % profileIds.length],
      data_inicio: dataInicio.toISOString().split('T')[0],
      data_fim: dataFim.toISOString().split('T')[0],
      dias: Math.floor((dataFim - dataInicio) / (1000 * 60 * 60 * 24)),
      tipo: ['regular', 'abono_pecuniario', 'fracionada'][Math.floor(Math.random() * 3)],
      status: statusFerias
    });
  }
  console.log('   ✅ 15 pedidos de férias inseridos');

  // =============== 8. NOTIFICAÇÕES ===============
  console.log('\n8️⃣ Inserindo notificações...');

  const notifs = [
    { titulo: 'Férias aprovadas!', mensagem: 'Sua solicitação de férias foi aprovada pelo gestor.', tipo: 'sucesso' },
    { titulo: 'Lembrete: Registro de ponto', mensagem: 'Não esqueça de bater o ponto hoje!', tipo: 'info' },
    { titulo: 'Novo comunicado disponível', mensagem: 'Confira o novo comunicado da empresa.', tipo: 'info' },
    { titulo: 'Holerite disponível', mensagem: 'Seu holerite do mês já está disponível.', tipo: 'info' },
    { titulo: 'Treinamento obrigatório', mensagem: 'Você tem um treinamento pendente.', tipo: 'alerta' }
  ];

  let notifCount = 0;
  for (const pid of profileIds.slice(0, 8)) {
    for (const n of notifs.slice(0, 3)) {
      await supabase.from('notificacoes').insert({
        id: uuidv4(),
        user_id: pid,
        titulo: n.titulo,
        mensagem: n.mensagem,
        tipo: n.tipo,
        lida: Math.random() > 0.5
      });
      notifCount++;
    }
  }
  console.log(`   ✅ ${notifCount} notificações inseridas`);

  // =============== 9. REGISTROS DE PONTO (últimos 30 dias) ===============
  console.log('\n9️⃣ Inserindo registros de ponto (últimos 30 dias)...');

  let pontoCount = 0;
  for (const pid of profileIds.slice(0, 8)) {
    for (let d = 30; d >= 0; d--) {
      // Pular alguns dias aleatórios (simular fins de semana e faltas)
      if (Math.random() < 0.25) continue;

      const date = new Date(now);
      date.setDate(date.getDate() - d);

      const dataBase = date.toISOString().split('T')[0];

      // Entrada
      await supabase.from('registros_ponto').insert({
        id: uuidv4(),
        user_id: pid,
        data_hora: `${dataBase}T08:00:00`,
        tipo: 'entrada',
        latitude: -23.5 + Math.random() * 0.1,
        longitude: -46.6 + Math.random() * 0.1
      });
      pontoCount++;

      // Saída almoço
      await supabase.from('registros_ponto').insert({
        id: uuidv4(),
        user_id: pid,
        data_hora: `${dataBase}T12:00:00`,
        tipo: 'saida_almoco',
        latitude: -23.5 + Math.random() * 0.1,
        longitude: -46.6 + Math.random() * 0.1
      });
      pontoCount++;

      // Retorno almoço
      await supabase.from('registros_ponto').insert({
        id: uuidv4(),
        user_id: pid,
        data_hora: `${dataBase}T13:00:00`,
        tipo: 'retorno_almoco',
        latitude: -23.5 + Math.random() * 0.1,
        longitude: -46.6 + Math.random() * 0.1
      });
      pontoCount++;

      // Saída
      await supabase.from('registros_ponto').insert({
        id: uuidv4(),
        user_id: pid,
        data_hora: `${dataBase}T18:00:00`,
        tipo: 'saida',
        latitude: -23.5 + Math.random() * 0.1,
        longitude: -46.6 + Math.random() * 0.1
      });
      pontoCount++;
    }
  }
  console.log(`   ✅ ~${pontoCount} registros de ponto inseridos`);

  // =============== RESULTADO ===============
  console.log('\n═══════════════════════════════════════════');
  console.log('📊 RESULTADO FINAL:');
  console.log('═══════════════════════════════════════════\n');

  const tablesToCheck = [
    'profiles', 'user_roles', 'beneficios', 'feriados',
    'faq', 'comunicados', 'solicitacoes', 'solicitacoes_ferias',
    'notificacoes', 'registros_ponto'
  ];

  for (const table of tablesToClean) {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    const status = error ? `❌ ${error.message}` : `✅ ${count || 0}`;
    console.log(`   ${table.padEnd(20)} ${status}`);
  }

  console.log('\n✨ SEED CONCLUÍDO COM SUCESSO!\n');
}

seed().catch(err => {
  console.error('❌ Erro:', err.message);
  console.error(err);
});
