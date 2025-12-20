import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegistroPonto {
  id: string;
  tipo: string;
  data_hora: string;
  endereco: string | null;
  status: string;
  observacao: string | null;
}

interface ProfileData {
  nome: string;
  cargo: string | null;
  departamento: string | null;
  matricula: string | null;
}

const mesesNomes = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR');
}

function calcularHorasTrabalhadas(registros: RegistroPonto[]): number {
  let totalMinutos = 0;
  const entradas: Date[] = [];
  const saidas: Date[] = [];

  registros.forEach(r => {
    const data = new Date(r.data_hora);
    if (r.tipo === 'entrada') {
      entradas.push(data);
    } else {
      saidas.push(data);
    }
  });

  entradas.sort((a, b) => a.getTime() - b.getTime());
  saidas.sort((a, b) => a.getTime() - b.getTime());

  for (let i = 0; i < Math.min(entradas.length, saidas.length); i++) {
    const diff = (saidas[i].getTime() - entradas[i].getTime()) / 1000 / 60;
    if (diff > 0) {
      totalMinutos += diff;
    }
  }

  return totalMinutos;
}

function formatarHoras(minutos: number): string {
  const horas = Math.floor(minutos / 60);
  const mins = Math.round(minutos % 60);
  return `${horas}h${mins.toString().padStart(2, '0')}`;
}

function gerarEspelhoHTML(
  registros: RegistroPonto[],
  profile: ProfileData,
  mes: number,
  ano: number,
  empresa: string
): string {
  // Agrupar por dia
  const registrosPorDia: Record<string, RegistroPonto[]> = {};
  
  registros.forEach(r => {
    const dia = r.data_hora.split('T')[0];
    if (!registrosPorDia[dia]) {
      registrosPorDia[dia] = [];
    }
    registrosPorDia[dia].push(r);
  });

  // Calcular totais
  let totalMinutosMes = 0;
  const diasComRegistro = Object.keys(registrosPorDia).length;

  Object.values(registrosPorDia).forEach(regs => {
    totalMinutosMes += calcularHorasTrabalhadas(regs);
  });

  // Gerar linhas da tabela
  const diasDoMes: string[] = [];
  const diasNoMes = new Date(ano, mes, 0).getDate();
  
  for (let d = 1; d <= diasNoMes; d++) {
    const dataStr = `${ano}-${mes.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
    diasDoMes.push(dataStr);
  }

  const linhasTabela = diasDoMes.map(dia => {
    const regs = registrosPorDia[dia] || [];
    const horasDia = calcularHorasTrabalhadas(regs);
    const dataObj = new Date(dia + 'T12:00:00');
    const diaSemana = dataObj.toLocaleDateString('pt-BR', { weekday: 'short' });
    const isFimDeSemana = dataObj.getDay() === 0 || dataObj.getDay() === 6;
    
    const entradas = regs.filter(r => r.tipo === 'entrada').sort((a, b) => 
      new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()
    );
    const saidas = regs.filter(r => r.tipo === 'saida').sort((a, b) => 
      new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()
    );

    return `
      <tr class="${isFimDeSemana ? 'weekend' : ''} ${regs.length === 0 && !isFimDeSemana ? 'missing' : ''}">
        <td>${dia.split('-')[2]}/${dia.split('-')[1]}</td>
        <td>${diaSemana}</td>
        <td>${entradas[0] ? formatTime(entradas[0].data_hora) : '-'}</td>
        <td>${saidas[0] ? formatTime(saidas[0].data_hora) : '-'}</td>
        <td>${entradas[1] ? formatTime(entradas[1].data_hora) : '-'}</td>
        <td>${saidas[1] ? formatTime(saidas[1].data_hora) : '-'}</td>
        <td class="text-right">${horasDia > 0 ? formatarHoras(horasDia) : '-'}</td>
        <td class="obs">${regs.some(r => r.status === 'fora_local') ? '⚠️ Fora do local' : regs.some(r => r.observacao) ? '📝' : ''}</td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Espelho de Ponto - ${mesesNomes[mes - 1]}/${ano}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 10px; padding: 20px; }
    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
    .header h1 { font-size: 16px; color: #333; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; margin-bottom: 20px; }
    .info-box { border: 1px solid #ddd; padding: 8px; background: #f9f9f9; }
    .info-box label { font-weight: bold; color: #666; font-size: 8px; display: block; }
    .info-box span { font-size: 11px; color: #333; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    th, td { border: 1px solid #ddd; padding: 4px 6px; text-align: center; }
    th { background: #333; color: white; font-size: 9px; text-transform: uppercase; }
    td { font-size: 9px; }
    .text-right { text-align: right; }
    .weekend { background: #f0f0f0; color: #999; }
    .missing { background: #fff3cd; }
    .obs { font-size: 8px; text-align: left; max-width: 80px; overflow: hidden; text-overflow: ellipsis; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 20px; }
    .summary-item { text-align: center; padding: 15px; border: 2px solid #333; }
    .summary-item.highlight { background: #333; color: white; }
    .summary-item label { display: block; font-size: 8px; text-transform: uppercase; margin-bottom: 5px; }
    .summary-item span { font-size: 16px; font-weight: bold; }
    .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #999; }
    .signature { margin-top: 40px; display: flex; justify-content: space-between; }
    .signature-line { width: 180px; text-align: center; }
    .signature-line hr { border: none; border-top: 1px solid #333; margin-bottom: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${empresa}</h1>
    <p>ESPELHO DE PONTO</p>
    <p style="margin-top: 5px; font-size: 12px; font-weight: bold;">
      ${mesesNomes[mes - 1].toUpperCase()} / ${ano}
    </p>
  </div>

  <div class="info-grid">
    <div class="info-box">
      <label>Colaborador</label>
      <span>${profile.nome || 'Colaborador'}</span>
    </div>
    <div class="info-box">
      <label>Matrícula</label>
      <span>${profile.matricula || '-'}</span>
    </div>
    <div class="info-box">
      <label>Cargo</label>
      <span>${profile.cargo || '-'}</span>
    </div>
    <div class="info-box">
      <label>Departamento</label>
      <span>${profile.departamento || '-'}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>Data</th>
        <th>Dia</th>
        <th>Entrada 1</th>
        <th>Saída 1</th>
        <th>Entrada 2</th>
        <th>Saída 2</th>
        <th>Total</th>
        <th>Obs</th>
      </tr>
    </thead>
    <tbody>
      ${linhasTabela}
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-item">
      <label>Dias Trabalhados</label>
      <span>${diasComRegistro}</span>
    </div>
    <div class="summary-item">
      <label>Horas Normais</label>
      <span>${formatarHoras(Math.min(totalMinutosMes, diasComRegistro * 480))}</span>
    </div>
    <div class="summary-item">
      <label>Horas Extras</label>
      <span>${formatarHoras(Math.max(0, totalMinutosMes - diasComRegistro * 480))}</span>
    </div>
    <div class="summary-item highlight">
      <label>Total Horas</label>
      <span>${formatarHoras(totalMinutosMes)}</span>
    </div>
  </div>

  <div class="signature">
    <div class="signature-line">
      <hr />
      <span>Colaborador</span>
    </div>
    <div class="signature-line">
      <hr />
      <span>Gestor</span>
    </div>
    <div class="signature-line">
      <hr />
      <span>RH</span>
    </div>
  </div>

  <div class="footer">
    <p>Documento gerado em ${new Date().toLocaleString('pt-BR')}</p>
    <p>Legenda: ⚠️ Fora do local permitido | 📝 Com observação</p>
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

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { mes, ano } = await req.json();
    const mesRef = mes || new Date().getMonth() + 1;
    const anoRef = ano || new Date().getFullYear();

    console.log(`[gerar-espelho-ponto] Gerando espelho para ${user.id} - ${mesRef}/${anoRef}`);

    // Calcular período
    const dataInicio = new Date(anoRef, mesRef - 1, 1);
    const dataFim = new Date(anoRef, mesRef, 0, 23, 59, 59);

    // Buscar registros do mês
    const { data: registros, error: registrosError } = await supabaseClient
      .from('registros_ponto')
      .select('*')
      .eq('user_id', user.id)
      .gte('data_hora', dataInicio.toISOString())
      .lte('data_hora', dataFim.toISOString())
      .order('data_hora', { ascending: true });

    if (registrosError) {
      throw registrosError;
    }

    // Buscar profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('nome, cargo, departamento, matricula')
      .eq('id', user.id)
      .single();

    // Gerar HTML
    const html = gerarEspelhoHTML(
      registros as RegistroPonto[] || [],
      profile as ProfileData || { nome: 'Colaborador', cargo: null, departamento: null, matricula: null },
      mesRef,
      anoRef,
      'PROMO BRINDES LTDA'
    );

    console.log(`[gerar-espelho-ponto] HTML gerado com ${registros?.length || 0} registros`);

    return new Response(
      JSON.stringify({
        success: true,
        html,
        filename: `espelho_ponto_${mesesNomes[mesRef - 1].toLowerCase()}_${anoRef}.pdf`,
        registros: registros?.length || 0,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[gerar-espelho-ponto] Erro:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
