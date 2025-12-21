import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Buscar notificações agendadas para hoje
    const hoje = new Date().toISOString().split('T')[0];
    
    const { data: agendadas, error } = await supabase
      .from('notificacoes_agendadas')
      .select('*')
      .eq('data_envio', hoje)
      .eq('enviada', false);

    if (error) throw error;

    let enviadas = 0;
    for (const notif of agendadas || []) {
      await supabase.rpc('criar_notificacao', {
        p_user_id: notif.user_id,
        p_titulo: notif.titulo,
        p_mensagem: notif.mensagem,
        p_tipo: notif.tipo,
      });

      await supabase
        .from('notificacoes_agendadas')
        .update({ enviada: true })
        .eq('id', notif.id);

      enviadas++;
    }

    return new Response(
      JSON.stringify({ success: true, enviadas }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
