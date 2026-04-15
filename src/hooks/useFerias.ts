import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { differenceInMonths, addYears } from 'date-fns';
import { createLogger } from '@/lib/logger';

const log = createLogger('Ferias');

interface Ferias {
  id: string;
  data_inicio: string;
  data_fim: string;
  dias_solicitados: number;
  tipo: 'ferias' | 'abono' | 'venda';
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'cancelado';
  observacao: string | null;
  created_at: string;
}

interface PeriodoAquisitivo {
  inicio: Date;
  fim: Date;
  vencimento: Date;
  diasAdquiridos: number;
  diasUsados: number;
  saldo: number;
}

interface FeriasData {
  ferias: Ferias[];
  periodoAquisitivo: PeriodoAquisitivo | null;
  saldoTotal: number;
  proximasFerias: Ferias | null;
}

export function useFerias() {
  const [data, setData] = useState<FeriasData>({
    ferias: [],
    periodoAquisitivo: null,
    saldoTotal: 30,
    proximasFerias: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const calcularPeriodoAquisitivo = (dataAdmissao: string | null): PeriodoAquisitivo | null => {
    if (!dataAdmissao) return null;

    const admissao = new Date(dataAdmissao);
    const hoje = new Date();
    
    // Calcular quantos anos completos desde a admissão
    const anosCompletos = Math.floor(differenceInMonths(hoje, admissao) / 12);
    
    // Período aquisitivo atual
    const inicioPeriodo = addYears(admissao, anosCompletos);
    const fimPeriodo = addYears(admissao, anosCompletos + 1);
    const vencimento = addYears(fimPeriodo, 1); // 1 ano após fim do período
    
    // Meses trabalhados no período atual
    const mesesTrabalhados = differenceInMonths(hoje, inicioPeriodo);
    
    // Dias adquiridos (2.5 dias por mês trabalhado, máximo 30)
    const diasAdquiridos = Math.min(30, Math.floor(mesesTrabalhados * 2.5));

    return {
      inicio: inicioPeriodo,
      fim: fimPeriodo,
      vencimento,
      diasAdquiridos,
      diasUsados: 0, // Será calculado abaixo
      saldo: diasAdquiridos,
    };
  };

  const fetchFerias = async () => {
    if (!user) return;

    setIsLoading(true);
    
    // Buscar férias
    const { data: feriasData, error } = await supabase
      .from('ferias')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      log.error('Error fetching ferias:', error);
      toast({
        title: 'Erro ao carregar férias',
        description: error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const ferias = (feriasData || []) as Ferias[];

    // Calcular período aquisitivo
    const periodoAquisitivo = calcularPeriodoAquisitivo(profile?.data_admissao || null);

    // Calcular dias usados (apenas férias aprovadas/concluídas)
    const diasUsados = ferias
      .filter(f => ['aprovado', 'concluido'].includes(f.status))
      .reduce((acc, f) => acc + f.dias_solicitados, 0);

    // Atualizar período com dias usados
    if (periodoAquisitivo) {
      periodoAquisitivo.diasUsados = diasUsados;
      periodoAquisitivo.saldo = Math.max(0, periodoAquisitivo.diasAdquiridos - diasUsados);
    }

    // Saldo total (simplificado: 30 dias - usados)
    const saldoTotal = Math.max(0, 30 - diasUsados);

    // Próximas férias (aprovadas e futuras)
    const hoje = new Date().toISOString().split('T')[0];
    const proximasFerias = ferias.find(f => 
      f.status === 'aprovado' && f.data_inicio >= hoje
    ) || null;

    setData({
      ferias,
      periodoAquisitivo,
      saldoTotal,
      proximasFerias,
    });

    setIsLoading(false);
  };

  const solicitarFerias = async (
    data_inicio: string,
    data_fim: string,
    dias_solicitados: number,
    tipo: Ferias['tipo'] = 'ferias',
    observacao?: string
  ) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    // Validar saldo
    if (dias_solicitados > data.saldoTotal) {
      return { success: false, error: `Saldo insuficiente. Você tem ${data.saldoTotal} dias disponíveis.` };
    }

    // Validar mínimo de dias
    if (tipo === 'ferias' && dias_solicitados < 5) {
      return { success: false, error: 'O período mínimo de férias é de 5 dias.' };
    }

    const { data: result, error } = await supabase
      .from('ferias')
      .insert({
        user_id: user.id,
        data_inicio,
        data_fim,
        dias_solicitados,
        tipo,
        observacao,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    await fetchFerias();
    return { success: true, data: result };
  };

  const cancelarFerias = async (id: string) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    // Verificar se pode cancelar (apenas pendentes)
    const ferias = data.ferias.find(f => f.id === id);
    if (!ferias) {
      return { success: false, error: 'Férias não encontradas' };
    }

    if (ferias.status !== 'pendente') {
      return { success: false, error: 'Apenas férias pendentes podem ser canceladas' };
    }

    const { error } = await supabase
      .from('ferias')
      .update({ status: 'cancelado' })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    await fetchFerias();
    return { success: true };
  };

  const getFeriasPendentes = (): Ferias[] => {
    return data.ferias.filter(f => f.status === 'pendente');
  };

  const getFeriasAprovadas = (): Ferias[] => {
    return data.ferias.filter(f => f.status === 'aprovado');
  };

  const getHistorico = (): Ferias[] => {
    return data.ferias.filter(f => ['rejeitado', 'cancelado', 'concluido'].includes(f.status));
  };

  useEffect(() => {
    fetchFerias();
  }, [user, profile]);

  return {
    ferias: data.ferias,
    periodoAquisitivo: data.periodoAquisitivo,
    saldoTotal: data.saldoTotal,
    proximasFerias: data.proximasFerias,
    isLoading,
    solicitarFerias,
    cancelarFerias,
    getFeriasPendentes,
    getFeriasAprovadas,
    getHistorico,
    refetch: fetchFerias,
  };
}
