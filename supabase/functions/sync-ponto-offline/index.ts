import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RegistroPontoOffline {
  tipo: 'entrada' | 'saida';
  data_hora: string;
  latitude?: number;
  longitude?: number;
  endereco?: string;
  observacao?: string;
  offline_id?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Token de autorização não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Obter usuário do token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('[sync-ponto-offline] Erro de autenticação:', authError);
      return new Response(
        JSON.stringify({ error: 'Token inválido ou expirado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[sync-ponto-offline] Usuário autenticado: ${user.id}`);

    // Processar registros
    const body = await req.json();
    const registros: RegistroPontoOffline[] = Array.isArray(body) ? body : [body];

    console.log(`[sync-ponto-offline] Recebidos ${registros.length} registros para sincronizar`);

    const results = {
      success: [] as string[],
      failed: [] as { offline_id?: string; error: string }[],
    };

    for (const registro of registros) {
      try {
        // Validar campos obrigatórios
        if (!registro.tipo || !registro.data_hora) {
          results.failed.push({
            offline_id: registro.offline_id,
            error: 'Campos obrigatórios faltando: tipo e data_hora',
          });
          continue;
        }

        // Validar tipo
        if (!['entrada', 'saida'].includes(registro.tipo)) {
          results.failed.push({
            offline_id: registro.offline_id,
            error: 'Tipo inválido. Deve ser "entrada" ou "saida"',
          });
          continue;
        }

        // Verificar localização se fornecida
        let status = 'validado';
        if (registro.latitude && registro.longitude) {
          const { data: localizacao } = await supabase.rpc('fn_validar_localizacao', {
            p_latitude: registro.latitude,
            p_longitude: registro.longitude,
          });

          if (localizacao && localizacao.length > 0 && !localizacao[0].dentro_raio) {
            status = 'fora_local';
            console.log(`[sync-ponto-offline] Registro fora do local permitido: ${localizacao[0].distancia_metros}m`);
          }
        }

        // Inserir registro
        const { data, error } = await supabase
          .from('registros_ponto')
          .insert({
            user_id: user.id,
            tipo: registro.tipo,
            data_hora: registro.data_hora,
            latitude: registro.latitude,
            longitude: registro.longitude,
            endereco: registro.endereco,
            observacao: registro.observacao ? `[OFFLINE] ${registro.observacao}` : '[OFFLINE] Sincronizado posteriormente',
            status,
          })
          .select()
          .single();

        if (error) {
          console.error('[sync-ponto-offline] Erro ao inserir:', error);
          results.failed.push({
            offline_id: registro.offline_id,
            error: error.message,
          });
        } else {
          console.log(`[sync-ponto-offline] Registro inserido com sucesso: ${data.id}`);
          results.success.push(registro.offline_id || data.id);
        }
      } catch (err) {
        console.error('[sync-ponto-offline] Erro ao processar registro:', err);
        results.failed.push({
          offline_id: registro.offline_id,
          error: err instanceof Error ? err.message : 'Erro desconhecido',
        });
      }
    }

    console.log(`[sync-ponto-offline] Resultado: ${results.success.length} sucesso, ${results.failed.length} falhas`);

    return new Response(
      JSON.stringify({
        message: 'Sincronização concluída',
        total: registros.length,
        success: results.success.length,
        failed: results.failed.length,
        details: results,
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[sync-ponto-offline] Erro geral:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
