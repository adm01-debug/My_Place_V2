import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { checkRateLimitInMemory, createRateLimitResponse, RATE_LIMIT_PRESETS } from '../_shared/rate-limit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  type: 'ferias' | 'emprestimo' | 'solicitacao' | 'ponto' | 'holerite';
  action: 'create' | 'update' | 'delete';
  data: Record<string, unknown>;
}

const ALLOWED_TYPES = ['ferias', 'emprestimo', 'solicitacao', 'ponto', 'holerite'] as const;
const ALLOWED_ACTIONS = ['create', 'update', 'delete'] as const;

function sanitizeString(val: unknown, maxLen = 500): string {
  if (typeof val !== 'string') return '';
  return val.slice(0, maxLen).replace(/<[^>]*>/g, '');
}

function isValidUUID(val: unknown): boolean {
  return typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Rate limiting
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const rateResult = checkRateLimitInMemory(`webhook:${ip}`, RATE_LIMIT_PRESETS.strict);
  if (!rateResult.allowed) {
    return createRateLimitResponse(rateResult, RATE_LIMIT_PRESETS.strict);
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: WebhookPayload = await req.json();

    // Input validation
    if (!payload || typeof payload !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!ALLOWED_TYPES.includes(payload.type as typeof ALLOWED_TYPES[number])) {
      return new Response(JSON.stringify({ error: `Invalid type: ${sanitizeString(payload.type)}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!ALLOWED_ACTIONS.includes(payload.action as typeof ALLOWED_ACTIONS[number])) {
      return new Response(JSON.stringify({ error: `Invalid action: ${sanitizeString(payload.action)}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!payload.data || typeof payload.data !== 'object') {
      return new Response(JSON.stringify({ error: 'Missing data field' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    console.log(`[webhook] Recebido: ${payload.type} - ${payload.action}`);

    let resultado = { processed: false, message: '' };

    switch (payload.type) {
      case 'holerite':
        if (payload.action === 'create') {
          resultado = { processed: true, message: 'Holerite registrado com sucesso' };
        }
        break;

      case 'ferias':
        if (payload.action === 'update' && payload.data.status) {
          resultado = { processed: true, message: 'Status de férias atualizado' };
        }
        break;

      case 'ponto':
        if (payload.action === 'create') {
          if (!isValidUUID(payload.data.user_id)) {
            return new Response(JSON.stringify({ error: 'Invalid user_id' }), {
              status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const tipo = payload.data.tipo;
          if (tipo !== 'entrada' && tipo !== 'saida') {
            return new Response(JSON.stringify({ error: 'Invalid tipo' }), {
              status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const { data: registro, error } = await supabase
            .from('registros_ponto')
            .insert({
              user_id: payload.data.user_id as string,
              tipo: tipo as string,
              data_hora: typeof payload.data.data_hora === 'string' ? payload.data.data_hora : new Date().toISOString(),
              latitude: typeof payload.data.latitude === 'number' ? payload.data.latitude : null,
              longitude: typeof payload.data.longitude === 'number' ? payload.data.longitude : null,
              endereco: sanitizeString(payload.data.endereco, 200) || null,
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
          if (!isValidUUID(payload.data.user_id)) {
            return new Response(JSON.stringify({ error: 'Invalid user_id' }), {
              status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const { error } = await supabase
            .from('emprestimos')
            .insert({
              user_id: payload.data.user_id as string,
              valor_original: Number(payload.data.valor) || 0,
              quantidade_parcelas: Number(payload.data.parcelas) || 1,
              taxa_juros: Number(payload.data.taxa) || 1.5,
              total_com_juros: Number(payload.data.total) || 0,
              valor_parcela: Number(payload.data.valor_parcela) || 0,
              saldo_devedor: Number(payload.data.saldo) || Number(payload.data.total) || 0,
              numero_contrato: sanitizeString(payload.data.contrato, 50) || `WH-${Date.now()}`,
              status: payload.data.status === 'ativo' ? 'ativo' : 'pendente',
              motivo: sanitizeString(payload.data.motivo, 300) || null,
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
