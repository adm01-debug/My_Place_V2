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

    const hoje = new Date();
    const diaSemana = hoje.getDay();
    
    // Só envia resumo em dias úteis (segunda a sexta)
    if (diaSemana === 0 || diaSemana === 6) {
      console.log('[resumo-diario] Fim de semana - não gerar resumo');
      return new Response(
        JSON.stringify({ success: true, message: 'Fim de semana - resumo não gerado' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[resumo-diario] Gerando resumo diário...');
    let resumosEnviados = 0;

    const { data: usuarios } = await supabase
      .from('profiles')
      .select('id, nome, email');

    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);

    for (const usuario of usuarios || []) {
      const pendencias: string[] = [];

      // 1. Registros de ponto incompletos (ontem)
      const { data: pontoOntem } = await supabase
        .from('registros_ponto')
        .select('id, tipo')
        .eq('user_id', usuario.id)
        .gte('data_hora', ontem.toISOString().split('T')[0])
        .lt('data_hora', hoje.toISOString().split('T')[0]);

      if (pontoOntem && pontoOntem.length > 0 && pontoOntem.length < 4) {
        pendencias.push('⏰ Registros de ponto incompletos ontem');
      }

      // 2. Justificativas pendentes de aprovação
      const { count: justificativasPendentes } = await supabase
        .from('justificativas_ponto')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', usuario.id)
        .eq('status', 'pendente');

      if ((justificativasPendentes || 0) > 0) {
        pendencias.push(`📋 ${justificativasPendentes} justificativa(s) aguardando aprovação`);
      }

      // 3. Treinamentos em andamento
      const { count: treinamentosPendentes } = await supabase
        .from('treinamentos_colaborador')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', usuario.id)
        .in('status', ['pendente', 'em_andamento']);

      if ((treinamentosPendentes || 0) > 0) {
        pendencias.push(`📚 ${treinamentosPendentes} treinamento(s) pendente(s)`);
      }

      // 4. Solicitações pendentes
      const { count: solicitacoesPendentes } = await supabase
        .from('solicitacoes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', usuario.id)
        .eq('status', 'pendente');

      if ((solicitacoesPendentes || 0) > 0) {
        pendencias.push(`📝 ${solicitacoesPendentes} solicitação(ões) em análise`);
      }

      // 5. Notificações não lidas (se mais de 5)
      const { count: notifsNaoLidas } = await supabase
        .from('notificacoes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', usuario.id)
        .eq('lida', false);

      if ((notifsNaoLidas || 0) > 5) {
        pendencias.push(`🔔 ${notifsNaoLidas} notificações não lidas`);
      }

      // 6. Férias pendentes de aprovação
      const { count: feriasPendentes } = await supabase
        .from('ferias')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', usuario.id)
        .eq('status', 'pendente');

      if ((feriasPendentes || 0) > 0) {
        pendencias.push(`🏖️ ${feriasPendentes} solicitação(ões) de férias pendente(s)`);
      }

      // Se houver pendências, criar notificação de resumo
      if (pendencias.length > 0) {
        const itensExibir = pendencias.slice(0, 3);
        const temMais = pendencias.length > 3 ? `\n... e mais ${pendencias.length - 3} item(s)` : '';

        const { error } = await supabase.rpc('criar_notificacao', {
          p_user_id: usuario.id,
          p_titulo: '📊 Seu resumo de hoje',
          p_mensagem: itensExibir.join('\n') + temMais,
          p_tipo: 'info',
          p_link: '/',
          p_dados: { pendencias: pendencias.length, data: hoje.toISOString().split('T')[0] }
        });

        if (!error) {
          resumosEnviados++;
          console.log(`[resumo-diario] Resumo criado para ${usuario.nome}`);
        }
      }
    }

    console.log(`[resumo-diario] Total: ${resumosEnviados} resumos enviados`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        resumos_enviados: resumosEnviados,
        usuarios_processados: usuarios?.length || 0,
        timestamp: new Date().toISOString()
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
