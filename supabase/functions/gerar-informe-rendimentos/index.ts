import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '')
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), 
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const { ano } = await req.json()
    const anoBase = ano || new Date().getFullYear() - 1

    // Buscar holerites do ano
    const { data: holerites, error: holeriteError } = await supabaseClient
      .from('holerites')
      .select('*')
      .eq('user_id', user.id)
      .eq('ano', anoBase)
      .order('mes')

    if (holeriteError) throw holeriteError

    // Buscar perfil
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('nome_completo, cpf, data_admissao, cargo')
      .eq('id', user.id)
      .single()

    // Calcular totais
    let totalRendimentos = 0
    let totalINSS = 0
    let totalIRRF = 0
    let total13 = 0
    let totalFerias = 0

    holerites?.forEach(h => {
      totalRendimentos += h.salario_bruto || 0
      const detalhes = h.detalhes || { descontos: [] }
      detalhes.descontos?.forEach((d: any) => {
        if (d.codigo === '001' || d.descricao?.toLowerCase().includes('inss')) {
          totalINSS += d.valor || 0
        }
        if (d.codigo === '002' || d.descricao?.toLowerCase().includes('irrf')) {
          totalIRRF += d.valor || 0
        }
      })
      detalhes.proventos?.forEach((p: any) => {
        if (p.descricao?.toLowerCase().includes('13')) {
          total13 += p.valor || 0
        }
        if (p.descricao?.toLowerCase().includes('férias')) {
          totalFerias += p.valor || 0
        }
      })
    })

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Informe de Rendimentos ${anoBase}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; padding: 30px; background: white; }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 3px solid #1e3a5f; }
    .header h1 { color: #1e3a5f; font-size: 20px; margin-bottom: 5px; }
    .header h2 { color: #333; font-size: 14px; font-weight: normal; }
    .header p { color: #666; font-size: 11px; margin-top: 10px; }
    .section { margin-bottom: 25px; }
    .section-title { background: #1e3a5f; color: white; padding: 8px 12px; font-weight: bold; font-size: 12px; margin-bottom: 10px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
    .info-item { border: 1px solid #ddd; padding: 10px; }
    .info-item label { font-size: 9px; color: #666; text-transform: uppercase; display: block; margin-bottom: 3px; }
    .info-item span { font-size: 12px; font-weight: bold; color: #333; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; font-size: 10px; text-transform: uppercase; }
    td { font-size: 11px; }
    .text-right { text-align: right; }
    .total-row { background: #f0f7ff; font-weight: bold; }
    .highlight { background: #1e3a5f; color: white; }
    .summary-box { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 20px; }
    .summary-item { text-align: center; padding: 15px; border: 2px solid #1e3a5f; }
    .summary-item label { display: block; font-size: 9px; color: #666; margin-bottom: 5px; }
    .summary-item span { font-size: 16px; font-weight: bold; color: #1e3a5f; }
    .footer { margin-top: 40px; text-align: center; font-size: 9px; color: #999; }
    .legal { background: #f9f9f9; padding: 15px; margin-top: 30px; font-size: 9px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>INFORME DE RENDIMENTOS</h1>
    <h2>Ano-Calendário ${anoBase} • Exercício ${anoBase + 1}</h2>
    <p>PESSOA FÍSICA - IMPOSTO DE RENDA NA FONTE</p>
  </div>

  <div class="section">
    <div class="section-title">1. FONTE PAGADORA - PESSOA JURÍDICA</div>
    <div class="info-grid">
      <div class="info-item">
        <label>CNPJ</label>
        <span>XX.XXX.XXX/0001-XX</span>
      </div>
      <div class="info-item">
        <label>Razão Social</label>
        <span>PROMO BRINDES LTDA</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">2. PESSOA FÍSICA BENEFICIÁRIA DOS RENDIMENTOS</div>
    <div class="info-grid">
      <div class="info-item">
        <label>CPF</label>
        <span>${profile?.cpf ? formatCPF(profile.cpf) : '***.***.***-**'}</span>
      </div>
      <div class="info-item">
        <label>Nome Completo</label>
        <span>${profile?.nome_completo || 'COLABORADOR'}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">3. RENDIMENTOS TRIBUTÁVEIS, DEDUÇÕES E IMPOSTO RETIDO NA FONTE</div>
    <table>
      <tr>
        <td>01. Total dos rendimentos (inclusive férias)</td>
        <td class="text-right">${formatCurrency(totalRendimentos)}</td>
      </tr>
      <tr>
        <td>02. Contribuição previdenciária oficial (INSS)</td>
        <td class="text-right">${formatCurrency(totalINSS)}</td>
      </tr>
      <tr>
        <td>03. Contribuição previdenciária privada</td>
        <td class="text-right">${formatCurrency(0)}</td>
      </tr>
      <tr>
        <td>04. Pensão alimentícia</td>
        <td class="text-right">${formatCurrency(0)}</td>
      </tr>
      <tr class="total-row">
        <td>05. Imposto de Renda Retido na Fonte (IRRF)</td>
        <td class="text-right">${formatCurrency(totalIRRF)}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">4. RENDIMENTOS ISENTOS E NÃO TRIBUTÁVEIS</div>
    <table>
      <tr>
        <td>06. Parcela isenta de proventos de aposentadoria</td>
        <td class="text-right">${formatCurrency(0)}</td>
      </tr>
      <tr>
        <td>07. Diárias e ajuda de custo</td>
        <td class="text-right">${formatCurrency(0)}</td>
      </tr>
      <tr>
        <td>08. Pensão e proventos isentos de maiores de 65 anos</td>
        <td class="text-right">${formatCurrency(0)}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <div class="section-title">5. RENDIMENTOS SUJEITOS À TRIBUTAÇÃO EXCLUSIVA</div>
    <table>
      <tr>
        <td>09. Décimo terceiro salário</td>
        <td class="text-right">${formatCurrency(total13)}</td>
      </tr>
      <tr>
        <td>10. IRRF sobre 13º salário</td>
        <td class="text-right">${formatCurrency(0)}</td>
      </tr>
      <tr>
        <td>11. Outros (PLR, participações, etc.)</td>
        <td class="text-right">${formatCurrency(0)}</td>
      </tr>
    </table>
  </div>

  <div class="summary-box">
    <div class="summary-item">
      <label>Total Rendimentos</label>
      <span>${formatCurrency(totalRendimentos)}</span>
    </div>
    <div class="summary-item">
      <label>INSS Retido</label>
      <span>${formatCurrency(totalINSS)}</span>
    </div>
    <div class="summary-item">
      <label>IRRF Retido</label>
      <span>${formatCurrency(totalIRRF)}</span>
    </div>
    <div class="summary-item" style="background: #1e3a5f; color: white;">
      <label style="color: #ccc;">Base IRPF</label>
      <span style="color: white;">${formatCurrency(totalRendimentos - totalINSS)}</span>
    </div>
  </div>

  <div class="legal">
    <p><strong>INFORMAÇÕES COMPLEMENTARES:</strong></p>
    <p>Este documento foi gerado eletronicamente e contém informações para fins de declaração do Imposto de Renda Pessoa Física.</p>
    <p>Os valores apresentados referem-se ao ano-calendário ${anoBase}, conforme registros da folha de pagamento.</p>
    <p>Em caso de divergências, entre em contato com o departamento de RH da empresa.</p>
  </div>

  <div class="footer">
    <p>Documento gerado em ${new Date().toLocaleString('pt-BR')}</p>
    <p>PROMO BRINDES LTDA - Portal do Colaborador</p>
  </div>
</body>
</html>
    `

    return new Response(
      JSON.stringify({ success: true, html, filename: `informe_rendimentos_${anoBase}.pdf`, ano: anoBase }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro ao gerar informe:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
