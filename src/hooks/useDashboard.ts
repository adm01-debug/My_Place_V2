import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, differenceInMinutes } from 'date-fns';

interface Alerta {
  id: string;
  tipo: 'warning' | 'info' | 'success' | 'alert';
  titulo: string;
  descricao: string;
  acao?: {
    label: string;
    link: string;
  };
}

interface ComunicadoResumo {
  id: string;
  titulo: string;
  resumo: string | null;
  categoria: string;
  data_publicacao: string;
  lido: boolean;
  importante: boolean;
}

interface DashboardData {
  colaborador: {
    id: string;
    nome: string;
    cargo: string | null;
    departamento: string | null;
    avatar_url: string | null;
    matricula: string | null;
  } | null;
  salarioEstimado: number;
  ultimoHolerite: { mes: number; ano: number; liquido: number } | null;
  horasTrabalhadas: string;
  horasHoje: string;
  bancoHoras: string;
  saldoFerias: number;
  proximasFerias: { data_inicio: string; dias: number } | null;
  comissaoMes: number;
  emprestimoAtivo: { saldo_devedor: number; parcelas_restantes: number; proxima_parcela: number; quantidade_parcelas: number } | null;
  alertas: Alerta[];
  comunicados: ComunicadoResumo[];
  notificacoesNaoLidas: number;
  solicitacoesPendentes: number;
  treinamentosPendentes: number;
}

export function useDashboard() {
  const [data, setData] = useState<DashboardData>({
    colaborador: null,
    salarioEstimado: 0,
    ultimoHolerite: null,
    horasTrabalhadas: '0:00',
    horasHoje: '0:00',
    bancoHoras: '0:00',
    saldoFerias: 0,
    proximasFerias: null,
    comissaoMes: 0,
    emprestimoAtivo: null,
    alertas: [],
    comunicados: [],
    notificacoesNaoLidas: 0,
    solicitacoesPendentes: 0,
    treinamentosPendentes: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const fetchDashboard = async () => {
    if (!user) return;

    setIsLoading(true);

    try {
      const mesAtual = new Date().getMonth() + 1;
      const anoAtual = new Date().getFullYear();
      const inicioMes = startOfMonth(new Date());
      const fimMes = endOfMonth(new Date());
      const hoje = format(new Date(), 'yyyy-MM-dd');

      // 1. Último holerite
      const { data: holerite } = await supabase
        .from('holerites')
        .select('mes, ano, salario_liquido')
        .eq('user_id', user.id)
        .order('ano', { ascending: false })
        .order('mes', { ascending: false })
        .limit(1)
        .single();

      // 2. Registros de ponto do mês
      const { data: registrosMes } = await supabase
        .from('registros_ponto')
        .select('*')
        .eq('user_id', user.id)
        .gte('data_hora', inicioMes.toISOString())
        .lte('data_hora', fimMes.toISOString())
        .order('data_hora', { ascending: true });

      // 3. Registros de ponto de hoje
      const { data: registrosHoje } = await supabase
        .from('registros_ponto')
        .select('*')
        .eq('user_id', user.id)
        .gte('data_hora', `${hoje}T00:00:00`)
        .lte('data_hora', `${hoje}T23:59:59`)
        .order('data_hora', { ascending: true });

      // 4. Férias aprovadas
      const { data: feriasAprovadas } = await supabase
        .from('ferias')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'aprovado')
        .gte('data_inicio', hoje)
        .order('data_inicio', { ascending: true })
        .limit(1);

      // 5. Saldo de férias (simplificado - 30 dias por ano)
      const { data: feriasUsadas } = await supabase
        .from('ferias')
        .select('dias_solicitados')
        .eq('user_id', user.id)
        .in('status', ['aprovado', 'concluido']);

      // 6. Remuneração variável do mês (usando tabela consolidada)
      const { data: remuneracaoVariavel } = await supabase
        .from('remuneracao_variavel')
        .select('valor')
        .eq('user_id', user.id)
        .eq('mes', mesAtual)
        .eq('ano', anoAtual)
        .in('status', ['aprovado', 'pago']);

      const comissaoTotal = (remuneracaoVariavel || []).reduce((acc, r) => acc + Number(r.valor), 0);

      // 7. Empréstimo ativo
      const { data: emprestimo } = await supabase
        .from('emprestimos')
        .select('saldo_devedor, quantidade_parcelas, parcelas_pagas, valor_parcela')
        .eq('user_id', user.id)
        .eq('status', 'ativo')
        .limit(1)
        .single();

      // 8. Comunicados recentes
      const { data: comunicados } = await supabase
        .from('comunicados')
        .select(`
          id, titulo, resumo, categoria, data_publicacao, importante,
          comunicados_lidos!left(id)
        `)
        .eq('ativo', true)
        .order('data_publicacao', { ascending: false })
        .limit(3);

      // 9. Notificações não lidas
      const { count: notificacoesCount } = await supabase
        .from('notificacoes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('lida', false);

      // 10. Solicitações pendentes
      const { count: solicitacoesCount } = await supabase
        .from('solicitacoes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .in('status', ['pendente', 'em_analise']);

      // 11. Treinamentos pendentes
      const { count: treinamentosCount } = await supabase
        .from('treinamentos_colaborador')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'pendente');

      // Calcular horas trabalhadas
      const calcularHoras = (registros: any[] | null): string => {
        if (!registros || registros.length === 0) return '0:00';
        
        let totalMinutos = 0;
        const entradas = registros.filter(r => r.tipo === 'entrada');
        const saidas = registros.filter(r => r.tipo === 'saida');

        for (let i = 0; i < entradas.length; i++) {
          const entrada = new Date(entradas[i].data_hora);
          const saida = saidas[i] ? new Date(saidas[i].data_hora) : new Date();
          totalMinutos += differenceInMinutes(saida, entrada);
        }

        const horas = Math.floor(totalMinutos / 60);
        const minutos = totalMinutos % 60;
        return `${horas}:${String(minutos).padStart(2, '0')}`;
      };

      // Calcular saldo de férias
      const diasUsados = (feriasUsadas || []).reduce((acc, f) => acc + f.dias_solicitados, 0);
      const saldoFerias = Math.max(0, 30 - diasUsados);

      // Gerar alertas baseados em dados reais
      const alertas: Alerta[] = [];

      // Alerta de ponto não batido
      if (registrosHoje && registrosHoje.length === 0 && new Date().getHours() >= 9) {
        alertas.push({
          id: 'ponto-hoje',
          tipo: 'warning',
          titulo: 'Ponto não registrado',
          descricao: 'Você ainda não registrou o ponto hoje',
          acao: { label: 'Registrar', link: '/ponto' },
        });
      }

      // Alerta de férias vencendo
      if (saldoFerias >= 25) {
        alertas.push({
          id: 'ferias-saldo',
          tipo: 'info',
          titulo: 'Férias disponíveis',
          descricao: `Você tem ${saldoFerias} dias de férias disponíveis`,
          acao: { label: 'Solicitar', link: '/ferias' },
        });
      }

      // Processar comunicados
      const comunicadosProcessados: ComunicadoResumo[] = (comunicados || []).map((c: any) => ({
        id: c.id,
        titulo: c.titulo,
        resumo: c.resumo,
        categoria: c.categoria,
        data_publicacao: c.data_publicacao,
        importante: c.importante,
        lido: Array.isArray(c.comunicados_lidos) ? c.comunicados_lidos.length > 0 : !!c.comunicados_lidos,
      }));

      setData({
        colaborador: profile ? {
          id: profile.id,
          nome: profile.nome,
          cargo: profile.cargo,
          departamento: profile.departamento,
          avatar_url: profile.avatar_url,
          matricula: profile.matricula,
        } : null,
        salarioEstimado: holerite?.salario_liquido || 0,
        ultimoHolerite: holerite ? {
          mes: holerite.mes,
          ano: holerite.ano,
          liquido: holerite.salario_liquido,
        } : null,
        horasTrabalhadas: calcularHoras(registrosMes),
        horasHoje: calcularHoras(registrosHoje),
        bancoHoras: '+0:00', // TODO: Implementar cálculo real
        saldoFerias,
        proximasFerias: feriasAprovadas?.[0] ? {
          data_inicio: feriasAprovadas[0].data_inicio,
          dias: feriasAprovadas[0].dias_solicitados,
        } : null,
        comissaoMes: comissaoTotal,
        emprestimoAtivo: emprestimo ? {
          saldo_devedor: emprestimo.saldo_devedor,
          parcelas_restantes: emprestimo.quantidade_parcelas - emprestimo.parcelas_pagas,
          proxima_parcela: emprestimo.valor_parcela,
        } : null,
        alertas,
        comunicados: comunicadosProcessados,
        notificacoesNaoLidas: notificacoesCount || 0,
        solicitacoesPendentes: solicitacoesCount || 0,
        treinamentosPendentes: treinamentosCount || 0,
      });

    } catch (error) {
      console.error('Error fetching dashboard:', error);
      toast({
        title: 'Erro ao carregar dashboard',
        description: 'Alguns dados podem estar indisponíveis',
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchDashboard();
  }, [user, profile]);

  return {
    ...data,
    isLoading,
    refetch: fetchDashboard,
  };
}
