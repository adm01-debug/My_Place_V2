import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const diaAtual = hoje.getDate();

    console.log(`[aniversariantes] Verificando aniversariantes do dia ${diaAtual}/${mesAtual}`);

    // Buscar aniversariantes do dia
    const { data: aniversariantes, error } = await supabase
      .from('profiles')
      .select('id, nome, email, data_nascimento')
      .not('data_nascimento', 'is', null);

    if (error) {
      console.error('[aniversariantes] Erro ao buscar profiles:', error);
      throw error;
    }

    const aniversariantesHoje = (aniversariantes || []).filter((p: any) => {
      if (!p.data_nascimento) return false;
      const nascimento = new Date(p.data_nascimento);
      return nascimento.getMonth() + 1 === mesAtual && nascimento.getDate() === diaAtual;
    });

    console.log(`[aniversariantes] Encontrados ${aniversariantesHoje.length} aniversariantes hoje`);

    // Criar notificação para cada aniversariante
    for (const aniversariante of aniversariantesHoje) {
      const { error: notifError } = await supabase
        .from('notificacoes')
        .insert({
          user_id: aniversariante.id,
          titulo: '🎂 Feliz Aniversário!',
          mensagem: `Parabéns pelo seu dia especial, ${aniversariante.nome?.split(' ')[0]}! Desejamos tudo de melhor para você!`,
          tipo: 'success',
          link: '/perfil',
        });

      if (notifError) {
        console.error(`[aniversariantes] Erro ao criar notificação para ${aniversariante.nome}:`, notifError);
      } else {
        console.log(`[aniversariantes] Notificação criada para ${aniversariante.nome}`);
      }
    }

    // Buscar todos os usuários para notificar sobre aniversariantes (exceto os próprios)
    if (aniversariantesHoje.length > 0) {
      const { data: todosUsuarios } = await supabase
        .from('profiles')
        .select('id')
        .not('id', 'in', `(${aniversariantesHoje.map((a: any) => `'${a.id}'`).join(',')})`);

      const nomes = aniversariantesHoje.map((a: any) => a.nome?.split(' ')[0]).join(', ');
      
      for (const usuario of todosUsuarios || []) {
        await supabase
          .from('notificacoes')
          .insert({
            user_id: usuario.id,
            titulo: '🎉 Aniversariantes do Dia',
            mensagem: `Hoje é aniversário de: ${nomes}. Não esqueça de parabenizar!`,
            tipo: 'info',
            link: '/',
          });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        aniversariantes: aniversariantesHoje.length,
        message: `Verificação concluída. ${aniversariantesHoje.length} aniversariantes hoje.`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[aniversariantes] Erro:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
