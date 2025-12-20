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
    const emTresDias = new Date(hoje);
    emTresDias.setDate(hoje.getDate() + 3);
    const emSeteDias = new Date(hoje);
    emSeteDias.setDate(hoje.getDate() + 7);
    const ontem = new Date(hoje);
    ontem.setDate(hoje.getDate() - 1);

    console.log('[vencimentos] Verificando vencimentos próximos...');
    let notificacoesCriadas = 0;

    // Helper para verificar se notificação já existe
    const notificacaoExiste = async (userId: string, dadosKey: string, dadosValue: string, horasAtras: number = 24) => {
      const limite = new Date(Date.now() - horasAtras * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from('notificacoes')
        .select('id')
        .eq('user_id', userId)
        .gte('created_at', limite)
        .like('dados', `%"${dadosKey}":"${dadosValue}"%`)
        .limit(1);
      return data && data.length > 0;
    };

    // 1. Treinamentos com prazo próximo (7 dias)
    const { data: treinamentosVencendo } = await supabase
      .from('treinamentos_colaborador')
      .select('id, user_id, data_limite, treinamento:treinamentos(titulo, obrigatorio)')
      .in('status', ['pendente', 'em_andamento'])
      .lte('data_limite', emSeteDias.toISOString().split('T')[0])
      .gte('data_limite', hoje.toISOString().split('T')[0]);

    console.log(`[vencimentos] ${(treinamentosVencendo || []).length} treinamentos vencendo`);

    for (const tr of treinamentosVencendo || []) {
      if (await notificacaoExiste(tr.user_id, 'treinamento_colaborador_id', tr.id)) continue;
      
      const treinamento = tr.treinamento as unknown as { titulo: string; obrigatorio: boolean } | null;
      const diasRestantes = Math.ceil((new Date(tr.data_limite).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      const isObrigatorio = treinamento?.obrigatorio;
      
      const { error } = await supabase.rpc('criar_notificacao', {
        p_user_id: tr.user_id,
        p_titulo: isObrigatorio ? '🔴 Treinamento obrigatório vencendo!' : '⏰ Treinamento vencendo',
        p_mensagem: `"${treinamento?.titulo}" vence em ${diasRestantes} dia(s). Complete antes do prazo!`,
        p_tipo: isObrigatorio ? 'alert' : 'warning',
        p_link: '/treinamentos',
        p_dados: { treinamento_colaborador_id: tr.id, data_limite: tr.data_limite }
      });
      
      if (!error) notificacoesCriadas++;
    }

    // 2. Parcelas de empréstimo vencendo (3 dias)
    const { data: parcelasVencendo } = await supabase
      .from('parcelas_emprestimo')
      .select('id, emprestimo_id, numero, vencimento, valor, emprestimo:emprestimos(user_id)')
      .eq('status', 'pendente')
      .lte('vencimento', emTresDias.toISOString().split('T')[0])
      .gte('vencimento', hoje.toISOString().split('T')[0]);

    console.log(`[vencimentos] ${(parcelasVencendo || []).length} parcelas vencendo`);

    for (const parcela of parcelasVencendo || []) {
      const userId = (parcela.emprestimo as any)?.user_id;
      if (!userId) continue;
      if (await notificacaoExiste(userId, 'parcela_id', parcela.id)) continue;

      const diasRestantes = Math.ceil((new Date(parcela.vencimento).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      
      const { error } = await supabase.rpc('criar_notificacao', {
        p_user_id: userId,
        p_titulo: '💳 Parcela vencendo',
        p_mensagem: `Parcela ${parcela.numero} (R$ ${parcela.valor.toFixed(2)}) vence em ${diasRestantes} dia(s).`,
        p_tipo: 'warning',
        p_link: '/emprestimos',
        p_dados: { parcela_id: parcela.id, emprestimo_id: parcela.emprestimo_id }
      });
      
      if (!error) notificacoesCriadas++;
    }

    // 3. Documentos expirando (7 dias)
    const { data: documentosExpirando } = await supabase
      .from('documentos')
      .select('id, user_id, nome, data_validade')
      .not('data_validade', 'is', null)
      .lte('data_validade', emSeteDias.toISOString().split('T')[0])
      .gte('data_validade', hoje.toISOString().split('T')[0]);

    console.log(`[vencimentos] ${(documentosExpirando || []).length} documentos expirando`);

    for (const doc of documentosExpirando || []) {
      if (await notificacaoExiste(doc.user_id, 'documento_id', doc.id)) continue;

      const diasRestantes = Math.ceil((new Date(doc.data_validade).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      
      const { error } = await supabase.rpc('criar_notificacao', {
        p_user_id: doc.user_id,
        p_titulo: '📄 Documento expirando',
        p_mensagem: `"${doc.nome}" vence em ${diasRestantes} dia(s). Providencie a renovação.`,
        p_tipo: 'warning',
        p_link: '/documentos',
        p_dados: { documento_id: doc.id, data_validade: doc.data_validade }
      });
      
      if (!error) notificacoesCriadas++;
    }

    // 4. Férias aprovadas próximas (lembrete 7 dias antes)
    const { data: feriasProximas } = await supabase
      .from('ferias')
      .select('id, user_id, data_inicio, data_fim, dias_solicitados')
      .eq('status', 'aprovado')
      .gte('data_inicio', hoje.toISOString().split('T')[0])
      .lte('data_inicio', emSeteDias.toISOString().split('T')[0]);

    console.log(`[vencimentos] ${(feriasProximas || []).length} férias próximas`);

    for (const ferias of feriasProximas || []) {
      if (await notificacaoExiste(ferias.user_id, 'ferias_lembrete_id', ferias.id, 72)) continue;

      const diasRestantes = Math.ceil((new Date(ferias.data_inicio).getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
      
      const { error } = await supabase.rpc('criar_notificacao', {
        p_user_id: ferias.user_id,
        p_titulo: '🏖️ Férias começam em breve!',
        p_mensagem: `Suas férias de ${ferias.dias_solicitados} dias começam em ${diasRestantes} dia(s). Bom descanso!`,
        p_tipo: 'info',
        p_link: '/ferias',
        p_dados: { ferias_lembrete_id: ferias.id, data_inicio: ferias.data_inicio }
      });
      
      if (!error) notificacoesCriadas++;
    }

    // 5. Saldo de férias alto (mensal, no dia 1)
    if (hoje.getDate() === 1) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome, data_admissao');

      for (const profile of profiles || []) {
        if (!profile.data_admissao) continue;
        
        const admissao = new Date(profile.data_admissao);
        const mesesTrabalhados = Math.floor((hoje.getTime() - admissao.getTime()) / (1000 * 60 * 60 * 24 * 30));
        
        const { data: feriasUsadas } = await supabase
          .from('ferias')
          .select('dias_solicitados')
          .eq('user_id', profile.id)
          .in('status', ['aprovado', 'concluido']);

        const diasUsados = feriasUsadas?.reduce((acc, f) => acc + f.dias_solicitados, 0) || 0;
        const diasDisponiveis = Math.min(30, Math.floor(mesesTrabalhados * 2.5)) - diasUsados;

        if (diasDisponiveis >= 25) {
          const { error } = await supabase.rpc('criar_notificacao', {
            p_user_id: profile.id,
            p_titulo: '📅 Lembrete de férias',
            p_mensagem: `Você tem ${diasDisponiveis} dias de férias disponíveis. Que tal programar um descanso?`,
            p_tipo: 'info',
            p_link: '/ferias',
            p_dados: { dias_disponiveis: diasDisponiveis }
          });
          
          if (!error) notificacoesCriadas++;
        }
      }
    }

    console.log(`[vencimentos] Total: ${notificacoesCriadas} notificações criadas`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        notificacoes_criadas: notificacoesCriadas,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[vencimentos] Erro:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
