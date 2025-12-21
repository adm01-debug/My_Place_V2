const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  templateData?: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const body: EmailRequest = await req.json();
    const { to, subject, html, text, template, templateData } = body;

    let emailHtml = html;
    if (template && templateData) {
      emailHtml = renderTemplate(template, templateData);
    }

    const recipients = Array.isArray(to) ? to : [to];

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MY-PLACE <noreply@promo-brindes.com.br>',
        to: recipients,
        subject,
        html: emailHtml,
        text,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to send email');
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function renderTemplate(template: string, data: Record<string, any>): string {
  const templates: Record<string, string> = {
    'ferias-aprovada': `
      <h2>Férias Aprovadas! 🎉</h2>
      <p>Olá {{nome}},</p>
      <p>Suas férias foram aprovadas:</p>
      <ul>
        <li><strong>Período:</strong> {{dataInicio}} a {{dataFim}}</li>
        <li><strong>Dias:</strong> {{dias}}</li>
      </ul>
      <p>Bom descanso!</p>
    `,
    'ferias-recusada': `
      <h2>Solicitação de Férias</h2>
      <p>Olá {{nome}},</p>
      <p>Sua solicitação de férias não foi aprovada.</p>
      <p><strong>Motivo:</strong> {{motivo}}</p>
      <p>Entre em contato com o RH para mais informações.</p>
    `,
    'boas-vindas': `
      <h2>Bem-vindo ao MY-PLACE! 👋</h2>
      <p>Olá {{nome}},</p>
      <p>Sua conta foi criada com sucesso.</p>
      <p>Acesse o portal para gerenciar suas informações.</p>
    `,
    'lembrete-ponto': `
      <h2>Lembrete de Ponto ⏰</h2>
      <p>Olá {{nome}},</p>
      <p>Não esqueça de registrar seu ponto hoje!</p>
    `,
  };

  let html = templates[template] || template;
  
  Object.entries(data).forEach(([key, value]) => {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  });

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      ${html}
      <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
      <p style="font-size: 12px; color: #666;">
        Este é um email automático do MY-PLACE Portal do Colaborador.
      </p>
    </body>
    </html>
  `;
}
