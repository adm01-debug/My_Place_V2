import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[resumo-diario] Gerando resumo diário...');

    // Buscar todos os usuários ativos
    const { data: usuarios } = await supabase
      .from('profiles')
      .select('id, nome, email');

    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    for (const usuario of usuarios || []) {
      // Contar notificações não lidas
      const { count: notifsNaoLidas } = await supabase
        .from('notificacoes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', usuario.id)
        .eq('lida', false);

      // Contar treinamentos pendentes
      const { count: treinamentosPendentes } = await supabase
        .from('treinamentos_colaborador')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', usuario.id)
        .eq('status', 'pendente');

      // Verificar saldo de férias (dias do período aquisitivo)
      const { data: feriasPendentes } = await supabase
        .from('ferias')
        .select('dias_solicitados')
        .eq('user_id', usuario.id)
        .eq('status', 'pendente');

      // Verificar solicitações pendentes
      const { count: solicitacoesPendentes } = await supabase
        .from('solicitacoes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', usuario.id)
        .eq('status', 'pendente');

      // Gerar resumo se houver pendências
      const pendencias = [];
      
      if ((notifsNaoLidas || 0) > 0) {
        pendencias.push(`${notifsNaoLidas} notificações não lidas`);
      }
      if ((treinamentosPendentes || 0) > 0) {
        pendencias.push(`${treinamentosPendentes} treinamentos pendentes`);
      }
      if ((feriasPendentes?.length || 0) > 0) {
        pendencias.push(`${feriasPendentes?.length} solicitação(ões) de férias aguardando`);
      }

      if (pendencias.length > 0) {
        await supabase.from('notificacoes').insert({
          user_id: usuario.id,
          titulo: '📋 Resumo do Dia',
          mensagem: `Você tem: ${pendencias.join(', ')}.`,
          tipo: 'info',
          link: '/',
        });
        console.log(`[resumo-diario] Resumo criado para ${usuario.nome}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        usuarios_processados: usuarios?.length || 0
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[resumo-diario] Erro:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
