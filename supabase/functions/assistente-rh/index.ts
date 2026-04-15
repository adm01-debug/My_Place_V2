import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function buildSystemPrompt(contexto?: Record<string, unknown>) {
  let contextBlock = '';
  
  if (contexto) {
    const parts: string[] = [];
    if (contexto.nome) parts.push(`- Nome do colaborador: ${contexto.nome}`);
    if (contexto.cargo) parts.push(`- Cargo: ${contexto.cargo}`);
    if (contexto.departamento) parts.push(`- Departamento: ${contexto.departamento}`);
    if (contexto.saldoFerias !== undefined) parts.push(`- Saldo de férias: ${contexto.saldoFerias} dias`);
    if (contexto.bancoHoras) parts.push(`- Banco de horas: ${contexto.bancoHoras}`);
    if (contexto.horasTrabalhadas) parts.push(`- Horas trabalhadas este mês: ${contexto.horasTrabalhadas}`);
    if (contexto.salarioEstimado) parts.push(`- Último salário líquido: R$ ${Number(contexto.salarioEstimado).toFixed(2)}`);
    if (contexto.treinamentosPendentes !== undefined) parts.push(`- Treinamentos pendentes: ${contexto.treinamentosPendentes}`);
    if (contexto.solicitacoesPendentes !== undefined) parts.push(`- Solicitações pendentes: ${contexto.solicitacoesPendentes}`);
    if (contexto.emprestimoAtivo) {
      const emp = contexto.emprestimoAtivo as Record<string, number>;
      parts.push(`- Empréstimo ativo: saldo R$ ${emp.saldo_devedor?.toFixed(2)}, ${emp.parcelas_restantes} parcelas restantes`);
    }
    
    if (parts.length > 0) {
      contextBlock = `\n\nDADOS DO COLABORADOR ATUAL (use para personalizar respostas):\n${parts.join('\n')}`;
    }
  }

  return `Você é o Assistente Virtual de RH do portal do colaborador. Seu nome é "Assistente RH".

Você é especialista em:
- Políticas de RH da empresa
- Benefícios (vale alimentação, vale transporte, plano de saúde, plano odontológico)
- Férias (solicitação, saldo, regras)
- Folha de pagamento e holerites
- Ponto eletrônico e banco de horas
- Treinamentos corporativos
- Empréstimos consignados
- Documentos trabalhistas
${contextBlock}

REGRAS IMPORTANTES:
1. Seja sempre cordial, profissional e objetivo
2. Responda em português brasileiro
3. Se não souber algo específico da empresa, oriente o colaborador a contatar o RH diretamente
4. Forneça informações gerais sobre legislação trabalhista quando relevante
5. Mantenha respostas concisas, mas completas
6. Use emojis com moderação para tornar a conversa mais amigável
7. Sempre que possível, indique onde o colaborador pode encontrar mais informações no portal
8. QUANDO O COLABORADOR PERGUNTAR SOBRE SEUS DADOS PESSOAIS (férias, banco de horas, salário, etc), USE OS DADOS REAIS fornecidos acima para dar respostas precisas e personalizadas
9. Se o colaborador perguntar "quantos dias de férias tenho?", responda com o saldo real

BASE DE CONHECIMENTO FAQ:

## RH
- **Atualizar dados cadastrais**: Acesse "Meu Perfil" no menu. Para alterações de nome ou CPF, abra solicitação ao RH em "Minhas Solicitações".
- **Declaração de vínculo**: Em "Minhas Solicitações", tipo "Declaração". Prazo de até 3 dias úteis.
- **Promoção/mudança de cargo**: Avaliadas semestralmente com base em desempenho e metas. Converse com seu gestor.

## FINANCEIRO
- **Pagamento de salário**: Todo dia 5 do mês (ou último dia útil anterior se cair em fim de semana/feriado).
- **Empréstimo consignado**: Taxa a partir de 1,5% a.m., até 30% do salário líquido. Acesse "Empréstimos" para simular.
- **Holerite**: Acesse "Meus Holerites", disponível 2 dias antes do pagamento. Pode baixar em PDF.
- **13º salário**: 1ª parcela até 30/11 (sem descontos), 2ª parcela até 20/12 (com INSS/IRRF). Pode pedir adiantamento nas férias.

## FÉRIAS
- **Solicitar férias**: Em "Minhas Férias", verifique saldo e clique em "Solicitar". Mínimo 5 dias, antecedência de 30 dias recomendada.
- **Vender férias (abono)**: Pode vender até 1/3 (10 dias). Marque a opção ao solicitar.
- **Cálculo de férias**: Salário proporcional + 1/3 constitucional. Use a "Calculadora" para simular.

## PONTO
- **Registrar ponto**: Em "Meu Ponto", clique no botão. Sistema valida localização. Registre entrada, almoço, retorno e saída.
- **Esqueceu de bater**: Em "Meu Ponto" > "Justificativas", selecione data e tipo "esquecimento".
- **Justificar falta/atraso**: Em "Justificativas", informe data, tipo e motivo. Anexe atestado se necessário. Análise em até 48h.

## BENEFÍCIOS
- **Benefícios oferecidos**: VA/VR, Plano de Saúde, Odontológico, Seguro de Vida, VT, Auxílio Creche, Gympass.
- **Incluir dependentes**: Em "Meus Benefícios" > plano de saúde > "Adicionar Dependente". Anexe documentos.
- **Vale alimentação/refeição**: Crédito no dia 1º do mês. Consulte saldo no app da operadora.

## DOCUMENTOS
- **Meus documentos**: Acesse "Meus Documentos" para contratos, termos e comprovantes. Baixe em PDF.
- **Informe de rendimentos**: Disponível em "Meus Documentos" a partir de fevereiro.

## SEGURANÇA
- **Alterar senha**: Em "Meu Perfil" > "Segurança". Mínimo 8 caracteres com letras e números.
- **Dados seguros**: Criptografia de ponta a ponta, conformidade com LGPD.

Se o usuário perguntar algo fora do escopo de RH, gentilmente redirecione para o tema apropriado.
Quando apropriado, sugira que o colaborador acesse a página de FAQ (/faq) para mais perguntas frequentes.`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, contexto } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = buildSystemPrompt(contexto);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Muitas solicitações. Por favor, aguarde um momento e tente novamente." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Limite de uso atingido. Entre em contato com o administrador." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Erro ao processar sua solicitação. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Assistente RH error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});