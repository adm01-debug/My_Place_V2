import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { createLogger } from '@/lib/logger';

const log = createLogger('DashboardGestor');

interface ResumoGestor {
  totalColaboradores: number;
  mediaAssiduidade: number;
  treinamentosPendentes: number;
  treinamentosObrigatorios: number;
  emFeriasAgora: number;
  justificativasPendentes: number;
  solicitacoesPendentes: number;
}

interface FeriaProgramada {
  id: string;
  nome: string;
  dataInicio: string;
  dataFim: string;
  dias: number;
}

interface GraficoDepartamento {
  nome: string;
  valor: number;
}

interface GraficoPontoDia {
  dia: string;
  entradas: number;
}

interface GraficoStatusTreinamento {
  nome: string;
  valor: number;
  cor: string;
}

interface DashboardGestorData {
  resumo: ResumoGestor;
  feriasProgramadas: FeriaProgramada[];
  graficos: {
    departamentos: GraficoDepartamento[];
    pontosPorDia: GraficoPontoDia[];
    statusTreinamentos: GraficoStatusTreinamento[];
  };
}

export function useDashboardGestor() {
  const [data, setData] = useState<DashboardGestorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchDashboard = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: response, error: fnError } = await supabase.functions.invoke(
        'dashboard-gestor'
      );

      if (fnError) {
        throw fnError;
      }

      if (response?.error) {
        throw new Error(response.error);
      }

      setData(response);
    } catch (err) {
      log.error('Dashboard gestor error:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchDashboard,
  };
}
