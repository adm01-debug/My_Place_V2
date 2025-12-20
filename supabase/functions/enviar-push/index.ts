import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PushPayload {
  user_id?: string;
  user_ids?: string[];
  title: string;
  body: string;
  url?: string;
  tag?: string;
  tipo?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload: PushPayload = await req.json();
    console.log('[push] Recebido payload:', JSON.stringify(payload));

    // Determinar lista de user_ids
    let userIds: string[] = [];
    if (payload.user_ids && payload.user_ids.length > 0) {
      userIds = payload.user_ids;
    } else if (payload.user_id) {
      userIds = [payload.user_id];
    } else {
      // Broadcast para todos
      const { data: allSubs } = await supabase
        .from('push_subscriptions')
        .select('user_id')
        .limit(1000);
      userIds = [...new Set((allSubs || []).map(s => s.user_id))];
    }

    if (userIds.length === 0) {
      console.log('[push] Nenhum usuário para notificar');
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'Nenhum usuário para notificar' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Buscar subscriptions dos usuários
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .in('user_id', userIds);

    if (subError) {
      console.error('[push] Erro ao buscar subscriptions:', subError);
      throw subError;
    }

    console.log(`[push] Encontradas ${subscriptions?.length || 0} subscriptions para ${userIds.length} usuários`);

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'Nenhuma subscription encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Preparar payload de notificação
    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: payload.tag || payload.tipo || 'default',
      url: payload.url || '/',
      data: { url: payload.url || '/' }
    });

    let sent = 0;
    let failed = 0;
    const failedEndpoints: string[] = [];

    // Enviar para cada subscription
    // Nota: Em produção, você precisaria configurar VAPID keys e usar web-push
    // Esta é uma implementação simplificada que registra as tentativas
    for (const sub of subscriptions) {
      try {
        console.log(`[push] Preparando envio para user ${sub.user_id}, endpoint: ${sub.endpoint.substring(0, 50)}...`);
        
        // Em produção, aqui você usaria web-push com VAPID keys
        // Por enquanto, vamos simular e criar notificações no banco
        const { error: notifError } = await supabase.rpc('criar_notificacao', {
          p_user_id: sub.user_id,
          p_titulo: payload.title,
          p_mensagem: payload.body,
          p_tipo: payload.tipo || 'push',
          p_link: payload.url || '/',
          p_dados: { push_sent: true, tag: payload.tag }
        });

        if (notifError) {
          console.error(`[push] Erro ao criar notificação para ${sub.user_id}:`, notifError);
          failed++;
        } else {
          sent++;
        }
      } catch (err) {
        console.error(`[push] Falha ao enviar para ${sub.user_id}:`, err);
        failed++;
        failedEndpoints.push(sub.endpoint);
      }
    }

    // Limpar endpoints inválidos
    if (failedEndpoints.length > 0) {
      console.log(`[push] Removendo ${failedEndpoints.length} endpoints inválidos`);
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', failedEndpoints);
    }

    console.log(`[push] Concluído: ${sent} enviados, ${failed} falharam`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent, 
        failed,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[push] Erro:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
