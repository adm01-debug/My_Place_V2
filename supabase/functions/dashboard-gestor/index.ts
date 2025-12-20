import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Client with user's token to verify identity
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user is authenticated and is admin or gestor
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if user is admin or gestor
    const { data: roles } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isManagerOrAdmin = roles?.some(r => r.role === "admin" || r.role === "gestor");
    if (!isManagerOrAdmin) {
      throw new Error("Acesso restrito a gestores e administradores");
    }

    // Use service role client for aggregated queries
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get current date info
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    // 1. Total de colaboradores
    const { count: totalColaboradores } = await adminClient
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // 2. Registros de ponto do mês
    const { data: registrosPonto } = await adminClient
      .from("registros_ponto")
      .select("user_id, data_hora, tipo")
      .gte("data_hora", inicioMes.toISOString())
      .lte("data_hora", fimMes.toISOString());

    // Calcular dias trabalhados únicos por colaborador
    const diasTrabalhados = new Map<string, Set<string>>();
    registrosPonto?.forEach(reg => {
      const dia = reg.data_hora.split("T")[0];
      if (!diasTrabalhados.has(reg.user_id)) {
        diasTrabalhados.set(reg.user_id, new Set());
      }
      diasTrabalhados.get(reg.user_id)!.add(dia);
    });

    // Calcular média de assiduidade (dias trabalhados / dias úteis do mês)
    const diasUteisNoMes = calcularDiasUteis(inicioMes, hoje);
    let totalAssiduidade = 0;
    let colaboradoresComPonto = 0;
    diasTrabalhados.forEach(dias => {
      colaboradoresComPonto++;
      totalAssiduidade += (dias.size / diasUteisNoMes) * 100;
    });
    const mediaAssiduidade = colaboradoresComPonto > 0 
      ? Math.round(totalAssiduidade / colaboradoresComPonto) 
      : 0;

    // 3. Treinamentos pendentes
    const { data: treinamentosPendentes } = await adminClient
      .from("treinamentos_colaborador")
      .select(`
        id,
        status,
        data_limite,
        user_id,
        treinamento_id
      `)
      .in("status", ["pendente", "em_andamento"]);

    // Buscar info dos treinamentos separadamente
    const treinamentoIds = [...new Set(treinamentosPendentes?.map(t => t.treinamento_id) || [])];
    const { data: treinamentosInfo } = await adminClient
      .from("treinamentos")
      .select("id, titulo, obrigatorio")
      .in("id", treinamentoIds);

    const treinamentosMap = new Map(treinamentosInfo?.map(t => [t.id, t]) || []);

    const treinamentosPendentesCount = treinamentosPendentes?.length || 0;
    const treinamentosObrigatoriosPendentes = treinamentosPendentes?.filter(
      t => treinamentosMap.get(t.treinamento_id)?.obrigatorio
    ).length || 0;

    // 4. Férias programadas
    const { data: feriasProgramadas } = await adminClient
      .from("ferias")
      .select(`
        id,
        data_inicio,
        data_fim,
        dias_solicitados,
        status,
        user_id
      `)
      .eq("status", "aprovado")
      .gte("data_fim", hoje.toISOString().split("T")[0])
      .order("data_inicio", { ascending: true })
      .limit(10);

    // Buscar nomes dos usuários separadamente
    const userIds = [...new Set(feriasProgramadas?.map(f => f.user_id) || [])];
    const { data: profilesInfo } = await adminClient
      .from("profiles")
      .select("id, nome")
      .in("id", userIds);

    const profilesMap = new Map(profilesInfo?.map(p => [p.id, p.nome]) || []);

    // Contar quantos estão de férias agora
    const emFeriasAgora = feriasProgramadas?.filter(f => {
      const inicio = new Date(f.data_inicio);
      const fim = new Date(f.data_fim);
      return hoje >= inicio && hoje <= fim;
    }).length || 0;

    // 5. Justificativas pendentes
    const { count: justificativasPendentes } = await adminClient
      .from("justificativas_ponto")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendente");

    // 6. Solicitações pendentes
    const { count: solicitacoesPendentes } = await adminClient
      .from("solicitacoes")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendente");

    // 7. Distribuição por departamento
    const { data: colaboradoresPorDepto } = await adminClient
      .from("profiles")
      .select("departamento")
      .not("departamento", "is", null);

    const departamentos: Record<string, number> = {};
    colaboradoresPorDepto?.forEach(c => {
      const depto = c.departamento || "Não definido";
      departamentos[depto] = (departamentos[depto] || 0) + 1;
    });

    // 8. Gráfico de pontos por dia da semana
    const pontosPorDia: Record<string, number> = {
      "Dom": 0, "Seg": 0, "Ter": 0, "Qua": 0, "Qui": 0, "Sex": 0, "Sáb": 0
    };
    const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    registrosPonto?.forEach(reg => {
      if (reg.tipo === "entrada") {
        const dia = new Date(reg.data_hora).getDay();
        pontosPorDia[diasSemana[dia]]++;
      }
    });

    // 9. Status dos treinamentos
    const { data: todosTreinamentos } = await adminClient
      .from("treinamentos_colaborador")
      .select("status");

    const statusTreinamentos = {
      concluido: 0,
      em_andamento: 0,
      pendente: 0,
    };
    todosTreinamentos?.forEach(t => {
      if (t.status === "concluido") statusTreinamentos.concluido++;
      else if (t.status === "em_andamento") statusTreinamentos.em_andamento++;
      else statusTreinamentos.pendente++;
    });

    return new Response(
      JSON.stringify({
        resumo: {
          totalColaboradores: totalColaboradores || 0,
          mediaAssiduidade,
          treinamentosPendentes: treinamentosPendentesCount,
          treinamentosObrigatorios: treinamentosObrigatoriosPendentes,
          emFeriasAgora,
          justificativasPendentes: justificativasPendentes || 0,
          solicitacoesPendentes: solicitacoesPendentes || 0,
        },
        feriasProgramadas: feriasProgramadas?.map(f => ({
          id: f.id,
          nome: profilesMap.get(f.user_id) || "Colaborador",
          dataInicio: f.data_inicio,
          dataFim: f.data_fim,
          dias: f.dias_solicitados,
        })) || [],
        graficos: {
          departamentos: Object.entries(departamentos).map(([nome, valor]) => ({
            nome,
            valor,
          })),
          pontosPorDia: diasSemana.map(dia => ({
            dia,
            entradas: pontosPorDia[dia],
          })),
          statusTreinamentos: [
            { nome: "Concluídos", valor: statusTreinamentos.concluido, cor: "hsl(var(--finance))" },
            { nome: "Em andamento", valor: statusTreinamentos.em_andamento, cor: "hsl(var(--primary))" },
            { nome: "Pendentes", valor: statusTreinamentos.pendente, cor: "hsl(var(--projects))" },
          ],
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Dashboard gestor error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function calcularDiasUteis(inicio: Date, fim: Date): number {
  let count = 0;
  const current = new Date(inicio);
  while (current <= fim) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count || 1;
}
