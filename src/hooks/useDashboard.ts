import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { calcularHorasTrabalhadas, calcularBancoHoras } from './useHorasCalculator';
import { createLogger } from '@/lib/logger';

const log = createLogger('Dashboard');

// ============================================================================
// TYPES
// ============================================================================

interface Alerta {
  id: string;
  tipo: 'warning' | 'info' | 'success' | 'alert';
  titulo: string;
  descricao: string;
  acao?: { label: string; link: string };
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

// ============================================================================
// HOOK
// ============================================================================

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

      const [
        holeriteResult,
        registrosMesResult,
        registrosHojeResult,
        feriasAprovadasResult,
        feriasUsadasResult,
        remuneracaoResult,
        emprestimoResult,
        comunicadosResult,
        notificacoesResult,
        solicitacoesResult,
        treinamentosResult,
      ] = await Promise.all([
        supabase.from('holerites').select('mes, ano, salario_liquido').eq('user_id', user.id).order('ano', { ascending: false }).order('mes', { ascending: false }).limit(1).single(),
        supabase.from('registros_ponto').select('*').eq('user_id', user.id).gte('data_hora', inicioMes.toISOString()).lte('data_hora', fimMes.toISOString()).order('data_hora', { ascending: true }),
        supabase.from('registros_ponto').select('*').eq('user_id', user.id).gte('data_hora', `${hoje}T00:00:00`).lte('data_hora', `${hoje}T23:59:59`).order('data_hora', { ascending: true }),
        supabase.from('ferias').select('*').eq('user_id', user.id).eq('status', 'aprovado').gte('data_inicio', hoje).order('data_inicio', { ascending: true }).limit(1),
        supabase.from('ferias').select('dias_solicitados').eq('user_id', user.id).in('status', ['aprovado', 'concluido']),
        supabase.from('remuneracao_variavel').select('valor').eq('user_id', user.id).eq('mes', mesAtual).eq('ano', anoAtual).in('status', ['aprovado', 'pago']),
        supabase.from('emprestimos').select('saldo_devedor, quantidade_parcelas, parcelas_pagas, valor_parcela').eq('user_id', user.id).eq('status', 'ativo').limit(1).single(),
        supabase.from('comunicados').select('id, titulo, resumo, categoria, data_publicacao, importante, comunicados_lidos!left(id)').eq('ativo', true).order('data_publicacao', { ascending: false }).limit(3),
        supabase.from('notificacoes').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('lida', false),
        supabase.from('solicitacoes').select('*', { count: 'exact', head: true }).eq('user_id', user.id).in('status', ['pendente', 'em_analise']),
        supabase.from('treinamentos_colaborador').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'pendente'),
      ]);

      const holerite = holeriteResult.data;
      const registrosMes = registrosMesResult.data as Array<{ tipo: string; data_hora: string }> | null;
      const registrosHoje = registrosHojeResult.data as Array<{ tipo: string; data_hora: string }> | null;

      const comissaoTotal = (remuneracaoResult.data || []).reduce((acc: number, r: { valor: number }) => acc + Number(r.valor), 0);
      const diasUsados = (feriasUsadasResult.data || []).reduce((acc: number, f: { dias_solicitados: number }) => acc + f.dias_solicitados, 0);
      const saldoFerias = Math.max(0, 30 - diasUsados);
      const emprestimo = emprestimoResult.data;

      // Alertas
      const alertas: Alerta[] = [];
      if (registrosHoje && registrosHoje.length === 0 && new Date().getHours() >= 9) {
        alertas.push({ id: 'ponto-hoje', tipo: 'warning', titulo: 'Ponto não registrado', descricao: 'Você ainda não registrou o ponto hoje', acao: { label: 'Registrar', link: '/ponto' } });
      }
      if (saldoFerias >= 25) {
        alertas.push({ id: 'ferias-saldo', tipo: 'info', titulo: 'Férias disponíveis', descricao: `Você tem ${saldoFerias} dias de férias disponíveis`, acao: { label: 'Solicitar', link: '/ferias' } });
      }

      // Comunicados
      const comunicadosProcessados: ComunicadoResumo[] = (comunicadosResult.data || []).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        titulo: c.titulo as string,
        resumo: c.resumo as string | null,
        categoria: c.categoria as string,
        data_publicacao: c.data_publicacao as string,
        importante: c.importante as boolean,
        lido: Array.isArray(c.comunicados_lidos) ? (c.comunicados_lidos as unknown[]).length > 0 : !!c.comunicados_lidos,
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
        ultimoHolerite: holerite ? { mes: holerite.mes, ano: holerite.ano, liquido: holerite.salario_liquido } : null,
        horasTrabalhadas: calcularHorasTrabalhadas(registrosMes),
        horasHoje: calcularHorasTrabalhadas(registrosHoje),
        bancoHoras: calcularBancoHoras(registrosMes),
        saldoFerias,
        proximasFerias: feriasAprovadasResult.data?.[0] ? { data_inicio: feriasAprovadasResult.data[0].data_inicio, dias: feriasAprovadasResult.data[0].dias_solicitados } : null,
        comissaoMes: comissaoTotal,
        emprestimoAtivo: emprestimo ? { saldo_devedor: emprestimo.saldo_devedor, parcelas_restantes: emprestimo.quantidade_parcelas - emprestimo.parcelas_pagas, proxima_parcela: emprestimo.valor_parcela, quantidade_parcelas: emprestimo.quantidade_parcelas } : null,
        alertas,
        comunicados: comunicadosProcessados,
        notificacoesNaoLidas: notificacoesResult.count || 0,
        solicitacoesPendentes: solicitacoesResult.count || 0,
        treinamentosPendentes: treinamentosResult.count || 0,
      });
    } catch (error) {
      log.error('Error fetching dashboard:', error);
      toast({ title: 'Erro ao carregar dashboard', description: 'Alguns dados podem estar indisponíveis', variant: 'destructive' });
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchDashboard();
  }, [user, profile]);

  return { ...data, isLoading, refetch: fetchDashboard };
}
