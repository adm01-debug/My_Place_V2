import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Avaliacao {
  id: string;
  tipo: string;
  nota_geral: number | null;
  pontos_fortes: string | null;
  pontos_melhoria: string | null;
  comentario_geral: string | null;
  data_envio: string | null;
  status: string;
}

interface Competencia {
  nome: string;
  nota: number;
  comentario: string | null;
}

interface CicloAvaliacao {
  id: string;
  titulo: string;
  tipo: string;
  data_inicio: string;
  data_fim: string;
}

interface ProfileData {
  nome: string;
  cargo: string | null;
  departamento: string | null;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function gerarGraficoRadar(competencias: Competencia[]): string {
  if (competencias.length === 0) return '';
  
  // Gerar gráfico simples em HTML/CSS
  const maxNota = 5;
  
  return `
    <div class="radar-chart">
      <h4>Competências Avaliadas</h4>
      <div class="competencias-grid">
        ${competencias.map(c => `
          <div class="competencia-item">
            <div class="competencia-header">
              <span class="competencia-nome">${c.nome}</span>
              <span class="competencia-nota">${c.nota.toFixed(1)}</span>
            </div>
            <div class="barra-container">
              <div class="barra-preenchimento" style="width: ${(c.nota / maxNota) * 100}%"></div>
            </div>
            ${c.comentario ? `<p class="competencia-comentario">${c.comentario}</p>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function gerarFeedback360HTML(
  avaliacoes: Avaliacao[],
  competencias: Competencia[],
  ciclo: CicloAvaliacao,
  profile: ProfileData,
  empresa: string
): string {
  // Calcular médias por tipo
  const tiposAvaliacao = ['autoavaliacao', 'gestor', 'par', 'subordinado'];
  const mediasPorTipo: Record<string, { soma: number; count: number }> = {};
  
  avaliacoes.forEach(a => {
    if (a.nota_geral) {
      if (!mediasPorTipo[a.tipo]) {
        mediasPorTipo[a.tipo] = { soma: 0, count: 0 };
      }
      mediasPorTipo[a.tipo].soma += a.nota_geral;
      mediasPorTipo[a.tipo].count += 1;
    }
  });

  const mediaGeral = avaliacoes.reduce((sum, a) => sum + (a.nota_geral || 0), 0) / 
    Math.max(1, avaliacoes.filter(a => a.nota_geral).length);

  const getTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      autoavaliacao: '👤 Autoavaliação',
      gestor: '👔 Gestor',
      par: '🤝 Pares',
      subordinado: '👥 Subordinados',
    };
    return labels[tipo] || tipo;
  };

  const pontosFortesAll = avaliacoes
    .filter(a => a.pontos_fortes)
    .map(a => a.pontos_fortes!)
    .join('\n• ');

  const pontosMelhoriaAll = avaliacoes
    .filter(a => a.pontos_melhoria)
    .map(a => a.pontos_melhoria!)
    .join('\n• ');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Feedback 360° - ${profile.nome}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; padding: 30px; background: white; }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 3px solid #1e3a5f; }
    .header h1 { color: #1e3a5f; font-size: 20px; margin-bottom: 5px; }
    .header h2 { color: #333; font-size: 14px; font-weight: normal; }
    .section { margin-bottom: 25px; }
    .section-title { background: #1e3a5f; color: white; padding: 8px 12px; font-weight: bold; font-size: 12px; margin-bottom: 10px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 20px; }
    .info-item { border: 1px solid #ddd; padding: 10px; }
    .info-item label { font-size: 9px; color: #666; text-transform: uppercase; display: block; margin-bottom: 3px; }
    .info-item span { font-size: 12px; font-weight: bold; color: #333; }
    .nota-geral { text-align: center; background: #1e3a5f; color: white; padding: 30px; margin: 20px 0; }
    .nota-geral .valor { font-size: 48px; font-weight: bold; }
    .nota-geral .label { font-size: 12px; margin-top: 5px; }
    .notas-tipo { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 20px 0; }
    .nota-tipo { text-align: center; padding: 15px; border: 2px solid #ddd; }
    .nota-tipo .emoji { font-size: 24px; margin-bottom: 5px; }
    .nota-tipo .valor { font-size: 20px; font-weight: bold; color: #1e3a5f; }
    .nota-tipo .label { font-size: 10px; color: #666; }
    .radar-chart { margin: 20px 0; padding: 15px; background: #f9f9f9; }
    .radar-chart h4 { margin-bottom: 15px; color: #333; }
    .competencias-grid { display: grid; gap: 10px; }
    .competencia-item { background: white; padding: 10px; border: 1px solid #ddd; }
    .competencia-header { display: flex; justify-content: space-between; margin-bottom: 5px; }
    .competencia-nome { font-weight: bold; color: #333; }
    .competencia-nota { font-weight: bold; color: #1e3a5f; }
    .barra-container { height: 8px; background: #e0e0e0; border-radius: 4px; overflow: hidden; }
    .barra-preenchimento { height: 100%; background: linear-gradient(90deg, #1e3a5f, #3b82f6); border-radius: 4px; }
    .competencia-comentario { font-size: 9px; color: #666; margin-top: 5px; font-style: italic; }
    .pontos-box { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
    .pontos-item { padding: 15px; border-radius: 8px; }
    .pontos-fortes { background: #dcfce7; border: 1px solid #16a34a; }
    .pontos-melhoria { background: #fef3c7; border: 1px solid #f59e0b; }
    .pontos-item h4 { margin-bottom: 10px; color: #333; }
    .pontos-item ul { margin-left: 15px; color: #666; }
    .pontos-item li { margin-bottom: 5px; }
    .comentarios { margin: 20px 0; }
    .comentario-item { background: #f9f9f9; padding: 12px; margin-bottom: 10px; border-left: 3px solid #1e3a5f; }
    .comentario-tipo { font-size: 10px; color: #666; margin-bottom: 5px; }
    .comentario-texto { color: #333; font-style: italic; }
    .footer { margin-top: 40px; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #ddd; padding-top: 15px; }
    .confidential { background: #fee2e2; border: 1px solid #ef4444; padding: 10px; text-align: center; margin-top: 20px; color: #dc2626; font-weight: bold; }
  </style>
</head>
<body>
  <div class="header">
    <h1>RELATÓRIO FEEDBACK 360°</h1>
    <h2>${ciclo.titulo}</h2>
    <p style="color: #666; margin-top: 10px;">Período: ${formatDate(ciclo.data_inicio)} a ${formatDate(ciclo.data_fim)}</p>
  </div>

  <div class="section">
    <div class="section-title">DADOS DO AVALIADO</div>
    <div class="info-grid">
      <div class="info-item">
        <label>Nome</label>
        <span>${profile.nome || 'Colaborador'}</span>
      </div>
      <div class="info-item">
        <label>Cargo</label>
        <span>${profile.cargo || '-'}</span>
      </div>
      <div class="info-item">
        <label>Departamento</label>
        <span>${profile.departamento || '-'}</span>
      </div>
    </div>
  </div>

  <div class="nota-geral">
    <div class="valor">${mediaGeral.toFixed(1)}</div>
    <div class="label">NOTA GERAL (de 5.0)</div>
  </div>

  <div class="section">
    <div class="section-title">NOTAS POR PERSPECTIVA</div>
    <div class="notas-tipo">
      ${tiposAvaliacao.map(tipo => {
        const media = mediasPorTipo[tipo];
        const nota = media ? (media.soma / media.count).toFixed(1) : '-';
        return `
          <div class="nota-tipo">
            <div class="emoji">${tipo === 'autoavaliacao' ? '👤' : tipo === 'gestor' ? '👔' : tipo === 'par' ? '🤝' : '👥'}</div>
            <div class="valor">${nota}</div>
            <div class="label">${getTipoLabel(tipo).replace(/[^\w\s]/g, '')}</div>
          </div>
        `;
      }).join('')}
    </div>
  </div>

  ${gerarGraficoRadar(competencias)}

  <div class="pontos-box">
    <div class="pontos-item pontos-fortes">
      <h4>💪 Pontos Fortes</h4>
      <ul>
        ${pontosFortesAll ? `<li>${pontosFortesAll.replace(/\n• /g, '</li><li>')}</li>` : '<li>Nenhum ponto forte destacado</li>'}
      </ul>
    </div>
    <div class="pontos-item pontos-melhoria">
      <h4>📈 Pontos de Melhoria</h4>
      <ul>
        ${pontosMelhoriaAll ? `<li>${pontosMelhoriaAll.replace(/\n• /g, '</li><li>')}</li>` : '<li>Nenhum ponto de melhoria destacado</li>'}
      </ul>
    </div>
  </div>

  <div class="section">
    <div class="section-title">COMENTÁRIOS DOS AVALIADORES</div>
    <div class="comentarios">
      ${avaliacoes.filter(a => a.comentario_geral).map(a => `
        <div class="comentario-item">
          <div class="comentario-tipo">${getTipoLabel(a.tipo)}</div>
          <div class="comentario-texto">"${a.comentario_geral}"</div>
        </div>
      `).join('') || '<p style="color: #666;">Nenhum comentário registrado.</p>'}
    </div>
  </div>

  <div class="confidential">
    🔒 DOCUMENTO CONFIDENCIAL - USO INTERNO
  </div>

  <div class="footer">
    <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')}</p>
    <p>${empresa} - Portal do Colaborador</p>
  </div>
</body>
</html>
  `;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { ciclo_id } = await req.json();

    if (!ciclo_id) {
      return new Response(
        JSON.stringify({ error: 'ID do ciclo é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[gerar-feedback-360-pdf] Gerando para user ${user.id}, ciclo ${ciclo_id}`);

    // Buscar ciclo
    const { data: ciclo, error: cicloError } = await supabaseClient
      .from('ciclos_avaliacao')
      .select('*')
      .eq('id', ciclo_id)
      .single();

    if (cicloError || !ciclo) {
      return new Response(
        JSON.stringify({ error: 'Ciclo não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar avaliações do usuário neste ciclo
    const { data: avaliacoes, error: avalError } = await supabaseClient
      .from('avaliacoes')
      .select('*')
      .eq('avaliado_id', user.id)
      .eq('ciclo_id', ciclo_id)
      .eq('status', 'concluida');

    if (avalError) throw avalError;

    // Buscar competências avaliadas
    let competencias: Competencia[] = [];
    if (avaliacoes && avaliacoes.length > 0) {
      const avalIds = avaliacoes.map(a => a.id);
      
      const { data: avalCompetencias } = await supabaseClient
        .from('avaliacoes_competencias')
        .select(`
          nota,
          comentario,
          competencia_id,
          competencias (nome)
        `)
        .in('avaliacao_id', avalIds);

      if (avalCompetencias) {
        // Agrupar por competência e calcular média
        const compMap: Record<string, { soma: number; count: number; nome: string; comentarios: string[] }> = {};
        
        avalCompetencias.forEach((ac: any) => {
          const compId = ac.competencia_id;
          const compNome = ac.competencias?.nome || 'Competência';
          
          if (!compMap[compId]) {
            compMap[compId] = { soma: 0, count: 0, nome: compNome, comentarios: [] };
          }
          compMap[compId].soma += ac.nota || 0;
          compMap[compId].count += 1;
          if (ac.comentario) {
            compMap[compId].comentarios.push(ac.comentario);
          }
        });

        competencias = Object.values(compMap).map(c => ({
          nome: c.nome,
          nota: c.soma / c.count,
          comentario: c.comentarios.length > 0 ? c.comentarios[0] : null,
        }));
      }
    }

    // Buscar profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('nome, cargo, departamento')
      .eq('id', user.id)
      .single();

    // Gerar HTML
    const html = gerarFeedback360HTML(
      avaliacoes as Avaliacao[] || [],
      competencias,
      ciclo as CicloAvaliacao,
      profile as ProfileData || { nome: 'Colaborador', cargo: null, departamento: null },
      'PROMO BRINDES LTDA'
    );

    console.log(`[gerar-feedback-360-pdf] HTML gerado com ${avaliacoes?.length || 0} avaliações`);

    return new Response(
      JSON.stringify({
        success: true,
        html,
        filename: `feedback_360_${ciclo.titulo.replace(/\s+/g, '_').toLowerCase()}.pdf`,
        avaliacoes: avaliacoes?.length || 0,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[gerar-feedback-360-pdf] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
