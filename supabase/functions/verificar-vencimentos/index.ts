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

    console.log('[vencimentos] Verificando vencimentos próximos...');

    // 1. Treinamentos com prazo próximo
    const { data: treinamentosVencendo } = await supabase
      .from('treinamentos_colaborador')
      .select('id, user_id, data_limite, treinamento:treinamentos(titulo)')
      .eq('status', 'pendente')
      .lte('data_limite', emTresDias.toISOString().split('T')[0])
      .gte('data_limite', hoje.toISOString().split('T')[0]);

    console.log(`[vencimentos] ${(treinamentosVencendo || []).length} treinamentos vencendo`);

    for (const tr of treinamentosVencendo || []) {
      await supabase.from('notificacoes').insert({
        user_id: tr.user_id,
        titulo: '⏰ Treinamento Vencendo',
        mensagem: `O treinamento "${(tr.treinamento as any)?.titulo}" vence em breve. Complete-o antes do prazo!`,
        tipo: 'warning',
        link: '/treinamentos',
        dados: { treinamento_colaborador_id: tr.id }
      });
    }

    // 2. Parcelas de empréstimo vencendo
    const { data: parcelasVencendo } = await supabase
      .from('parcelas_emprestimo')
      .select('id, emprestimo_id, numero, vencimento, valor, emprestimo:emprestimos(user_id)')
      .eq('status', 'pendente')
      .lte('vencimento', emTresDias.toISOString().split('T')[0])
      .gte('vencimento', hoje.toISOString().split('T')[0]);

    console.log(`[vencimentos] ${(parcelasVencendo || []).length} parcelas vencendo`);

    for (const parcela of parcelasVencendo || []) {
      const userId = (parcela.emprestimo as any)?.user_id;
      if (userId) {
        await supabase.from('notificacoes').insert({
          user_id: userId,
          titulo: '💳 Parcela Vencendo',
          mensagem: `A parcela ${parcela.numero} do seu empréstimo (R$ ${parcela.valor}) vence em breve.`,
          tipo: 'warning',
          link: '/emprestimos',
          dados: { parcela_id: parcela.id, emprestimo_id: parcela.emprestimo_id }
        });
      }
    }

    // 3. Documentos expirando
    const { data: documentosExpirando } = await supabase
      .from('documentos')
      .select('id, user_id, titulo, data_validade')
      .not('data_validade', 'is', null)
      .lte('data_validade', emTresDias.toISOString().split('T')[0])
      .gte('data_validade', hoje.toISOString().split('T')[0]);

    console.log(`[vencimentos] ${(documentosExpirando || []).length} documentos expirando`);

    for (const doc of documentosExpirando || []) {
      await supabase.from('notificacoes').insert({
        user_id: doc.user_id,
        titulo: '📄 Documento Expirando',
        mensagem: `O documento "${doc.titulo}" expira em breve. Providencie a renovação.`,
        tipo: 'warning',
        link: '/documentos',
        dados: { documento_id: doc.id }
      });
    }

    const totalAlertas = (treinamentosVencendo?.length || 0) + 
                        (parcelasVencendo?.length || 0) + 
                        (documentosExpirando?.length || 0);

    return new Response(
      JSON.stringify({ 
        success: true, 
        alertas: totalAlertas,
        detalhes: {
          treinamentos: treinamentosVencendo?.length || 0,
          parcelas: parcelasVencendo?.length || 0,
          documentos: documentosExpirando?.length || 0
        }
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
