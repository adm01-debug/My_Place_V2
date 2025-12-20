import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface HoleriteData {
  id: string
  mes: number
  ano: number
  salario_bruto: number
  salario_base: number
  salario_liquido: number
  total_proventos: number
  total_descontos: number
  descontos: number
  horas_trabalhadas: number
  horas_extras: number
  faltas: number
  detalhes: {
    proventos: Array<{ codigo: string; descricao: string; referencia: string; valor: number }>
    descontos: Array<{ codigo: string; descricao: string; referencia: string; valor: number }>
  } | null
}

interface ProfileData {
  nome: string
  cargo: string | null
  departamento: string | null
  matricula: string | null
  data_admissao: string | null
}

const mesesNomes = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL' 
  }).format(value)
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR')
}

function generateHoleriteHTML(holerite: HoleriteData, profile: ProfileData, empresa: string): string {
  const detalhes = holerite.detalhes || { proventos: [], descontos: [] }
  const proventos = detalhes.proventos || []
  const descontos = detalhes.descontos || []
  const salarioBase = holerite.salario_base || holerite.salario_bruto || 0
  const totalProventos = holerite.total_proventos || holerite.salario_bruto || 0
  const totalDescontos = holerite.total_descontos || holerite.descontos || 0
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Holerite ${mesesNomes[holerite.mes - 1]}/${holerite.ano}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; padding: 20px; }
    .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
    .header h1 { font-size: 16px; color: #333; }
    .header p { color: #666; font-size: 10px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
    .info-box { border: 1px solid #ddd; padding: 10px; background: #f9f9f9; }
    .info-box label { font-weight: bold; color: #666; font-size: 9px; display: block; }
    .info-box span { font-size: 12px; color: #333; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
    th { background: #333; color: white; font-size: 10px; text-transform: uppercase; }
    td { font-size: 10px; }
    .text-right { text-align: right; }
    .total-row { background: #f0f0f0; font-weight: bold; }
    .totals { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-top: 20px; }
    .total-box { text-align: center; padding: 15px; border: 2px solid #333; }
    .total-box.highlight { background: #333; color: white; }
    .total-box label { display: block; font-size: 9px; text-transform: uppercase; margin-bottom: 5px; }
    .total-box span { font-size: 18px; font-weight: bold; }
    .footer { margin-top: 30px; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #ddd; padding-top: 10px; }
    .signature { margin-top: 50px; display: flex; justify-content: space-between; }
    .signature-line { width: 200px; text-align: center; }
    .signature-line hr { border: none; border-top: 1px solid #333; margin-bottom: 5px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${empresa}</h1>
    <p>DEMONSTRATIVO DE PAGAMENTO</p>
    <p style="margin-top: 5px; font-size: 12px; font-weight: bold;">
      ${mesesNomes[holerite.mes - 1].toUpperCase()} / ${holerite.ano}
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
    <div class="info-box">
      <label>Admissão</label>
      <span>${profile.data_admissao ? formatDate(profile.data_admissao) : '-'}</span>
    </div>
    <div class="info-box">
      <label>Salário Base</label>
      <span>${formatCurrency(salarioBase)}</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 80px;">Código</th>
        <th>Descrição</th>
        <th style="width: 80px;">Referência</th>
        <th style="width: 100px;">Proventos</th>
        <th style="width: 100px;">Descontos</th>
      </tr>
    </thead>
    <tbody>
      ${proventos.map(p => `
        <tr>
          <td>${p.codigo}</td>
          <td>${p.descricao}</td>
          <td class="text-right">${p.referencia}</td>
          <td class="text-right">${formatCurrency(p.valor)}</td>
          <td></td>
        </tr>
      `).join('')}
      ${descontos.map(d => `
        <tr>
          <td>${d.codigo}</td>
          <td>${d.descricao}</td>
          <td class="text-right">${d.referencia}</td>
          <td></td>
          <td class="text-right">${formatCurrency(d.valor)}</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td colspan="3" class="text-right"><strong>TOTAIS</strong></td>
        <td class="text-right"><strong>${formatCurrency(totalProventos)}</strong></td>
        <td class="text-right"><strong>${formatCurrency(totalDescontos)}</strong></td>
      </tr>
    </tbody>
  </table>

  <div class="totals">
    <div class="total-box">
      <label>Total Proventos</label>
      <span style="color: #16a34a;">${formatCurrency(totalProventos)}</span>
    </div>
    <div class="total-box">
      <label>Total Descontos</label>
      <span style="color: #dc2626;">${formatCurrency(totalDescontos)}</span>
    </div>
    <div class="total-box highlight">
      <label>Líquido a Receber</label>
      <span>${formatCurrency(holerite.salario_liquido)}</span>
    </div>
  </div>

  <div class="signature">
    <div class="signature-line">
      <hr />
      <span>Empregador</span>
    </div>
    <div class="signature-line">
      <hr />
      <span>Colaborador</span>
    </div>
  </div>

  <div class="footer">
    <p>Documento gerado eletronicamente em ${new Date().toLocaleString('pt-BR')}</p>
    <p>Este documento é uma representação fiel dos dados registrados no sistema.</p>
  </div>
</body>
</html>
  `
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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
    )

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { holerite_id } = await req.json()

    if (!holerite_id) {
      return new Response(
        JSON.stringify({ error: 'ID do holerite é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar holerite
    const { data: holerite, error: holeriteError } = await supabaseClient
      .from('holerites')
      .select('*')
      .eq('id', holerite_id)
      .eq('user_id', user.id)
      .single()

    if (holeriteError || !holerite) {
      return new Response(
        JSON.stringify({ error: 'Holerite não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('nome, cargo, departamento, matricula, data_admissao')
      .eq('id', user.id)
      .single()

    // Gerar HTML
    const html = generateHoleriteHTML(
      holerite as HoleriteData,
      profile as ProfileData || { nome: 'Colaborador', cargo: null, departamento: null, matricula: null, data_admissao: null },
      'PROMO BRINDES LTDA'
    )

    // Retornar HTML para ser convertido em PDF no cliente
    // Ou usar um serviço de conversão HTML->PDF
    return new Response(
      JSON.stringify({ 
        success: true, 
        html,
        filename: `holerite_${mesesNomes[holerite.mes - 1].toLowerCase()}_${holerite.ano}.pdf`
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (err) {
    const error = err as Error;
    console.error('Erro ao gerar holerite:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
