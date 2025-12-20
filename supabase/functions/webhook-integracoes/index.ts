import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  type: 'ferias' | 'emprestimo' | 'solicitacao' | 'ponto' | 'holerite';
  action: 'create' | 'update' | 'delete';
  data: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: WebhookPayload = await req.json();
    
    console.log(`[webhook] Recebido: ${payload.type} - ${payload.action}`);
    console.log('[webhook] Data:', JSON.stringify(payload.data));

    // Processar webhook baseado no tipo
    let resultado = { processed: false, message: '' };

    switch (payload.type) {
      case 'holerite':
        if (payload.action === 'create') {
          // Novo holerite importado - trigger já cuida da notificação
          resultado = { processed: true, message: 'Holerite registrado com sucesso' };
        }
        break;

      case 'ferias':
        if (payload.action === 'update' && payload.data.status) {
          // Atualização de status de férias - trigger já cuida
          resultado = { processed: true, message: 'Status de férias atualizado' };
        }
        break;

      case 'ponto':
        if (payload.action === 'create') {
          // Registro de ponto externo (Bitrix, etc)
          const { data: registro, error } = await supabase
            .from('registros_ponto')
            .insert({
              user_id: payload.data.user_id,
              tipo: payload.data.tipo,
              data_hora: payload.data.data_hora || new Date().toISOString(),
              latitude: payload.data.latitude,
              longitude: payload.data.longitude,
              endereco: payload.data.endereco,
              status: 'aprovado',
              observacao: 'Importado via webhook'
            })
            .select()
            .single();

          if (error) throw error;
          resultado = { processed: true, message: `Ponto registrado: ${registro.id}` };
        }
        break;

      case 'emprestimo':
        if (payload.action === 'create') {
          // Novo empréstimo importado
          const { error } = await supabase
            .from('emprestimos')
            .insert({
              user_id: payload.data.user_id,
              valor_original: payload.data.valor,
              quantidade_parcelas: payload.data.parcelas,
              taxa_juros: payload.data.taxa || 1.5,
              total_com_juros: payload.data.total,
              valor_parcela: payload.data.valor_parcela,
              saldo_devedor: payload.data.saldo || payload.data.total,
              numero_contrato: payload.data.contrato,
              status: payload.data.status || 'ativo',
              motivo: payload.data.motivo
            });

          if (error) throw error;
          resultado = { processed: true, message: 'Empréstimo importado' };
        }
        break;

      default:
        resultado = { processed: false, message: `Tipo não suportado: ${payload.type}` };
    }

    console.log(`[webhook] Resultado: ${resultado.message}`);

    return new Response(
      JSON.stringify({ success: true, ...resultado }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[webhook] Erro:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
