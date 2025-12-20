import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const systemPrompt = `Você é o Assistente Virtual de RH do portal do colaborador. Seu nome é "Assistente RH".

Você é especialista em:
- Políticas de RH da empresa
- Benefícios (vale alimentação, vale transporte, plano de saúde, plano odontológico)
- Férias (solicitação, saldo, regras)
- Folha de pagamento e holerites
- Ponto eletrônico e banco de horas
- Treinamentos corporativos
- Empréstimos consignados
- Documentos trabalhistas

REGRAS IMPORTANTES:
1. Seja sempre cordial, profissional e objetivo
2. Responda em português brasileiro
3. Se não souber algo específico da empresa, oriente o colaborador a contatar o RH diretamente
4. Forneça informações gerais sobre legislação trabalhista quando relevante
5. Mantenha respostas concisas, mas completas
6. Use emojis com moderação para tornar a conversa mais amigável
7. Sempre que possível, indique onde o colaborador pode encontrar mais informações no portal

CONHECIMENTO BASE:
- Férias: Após 12 meses de trabalho, o colaborador tem direito a 30 dias. Pode dividir em até 3 períodos, sendo um de no mínimo 14 dias.
- Holerites: Disponíveis até o 5º dia útil de cada mês no portal
- Ponto: Deve ser registrado diariamente. Justificativas devem ser enviadas em até 48h
- Benefícios: Alterações podem ser solicitadas durante o período de adesão ou em caso de eventos de vida
- Treinamentos: Obrigatórios devem ser concluídos dentro do prazo estabelecido

Se o usuário perguntar algo fora do escopo de RH, gentilmente redirecione para o tema apropriado.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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
