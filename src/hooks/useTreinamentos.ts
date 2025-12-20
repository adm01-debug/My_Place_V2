import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Treinamento {
  id: string;
  titulo: string;
  descricao: string | null;
  carga_horaria: number;
  tipo: 'obrigatorio' | 'recomendado' | 'opcional';
  categoria: string;
  url_treinamento: string | null;
  url_material: string | null;
}

interface TreinamentoColaborador {
  id: string;
  treinamento_id: string;
  status: 'pendente' | 'em_andamento' | 'concluido' | 'expirado';
  progresso: number;
  data_inicio: string | null;
  data_conclusao: string | null;
  nota: number | null;
  certificado_url: string | null;
  validade: string | null;
  prazo: string | null;
  treinamento: Treinamento;
}

interface TrilhaDesenvolvimento {
  id: string;
  nivel_atual: string;
  proximo_nivel: string | null;
  progresso_percentual: number;
  treinamentos_faltantes: number;
}

interface TreinamentosData {
  pendentes: TreinamentoColaborador[];
  emAndamento: TreinamentoColaborador[];
  realizados: TreinamentoColaborador[];
  totalRealizados: number;
  totalPendentes: number;
  horasTotal: number;
  trilha: TrilhaDesenvolvimento | null;
}

export function useTreinamentos() {
  const [data, setData] = useState<TreinamentosData>({
    pendentes: [],
    emAndamento: [],
    realizados: [],
    totalRealizados: 0,
    totalPendentes: 0,
    horasTotal: 0,
    trilha: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchTreinamentos = async () => {
    if (!user) return;

    setIsLoading(true);

    // Fetch treinamentos do colaborador com dados do treinamento
    const { data: treinamentosData, error: treinamentosError } = await supabase
      .from('treinamentos_colaborador' as any)
      .select(`
        *,
        treinamento:treinamentos(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }) as { data: any[] | null; error: any };

    if (treinamentosError) {
      console.error('Error fetching treinamentos:', treinamentosError);
      toast({
        title: 'Erro ao carregar treinamentos',
        description: treinamentosError.message,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    // Fetch trilha de desenvolvimento
    const { data: trilhaData } = await supabase
      .from('trilha_desenvolvimento' as any)
      .select('*')
      .eq('user_id', user.id)
      .single() as { data: any };

    // Organizar por status
    const pendentes = (treinamentosData || [])
      .filter(t => t.status === 'pendente')
      .map(t => ({ ...t, treinamento: t.treinamento as Treinamento })) as TreinamentoColaborador[];
    
    const emAndamento = (treinamentosData || [])
      .filter(t => t.status === 'em_andamento')
      .map(t => ({ ...t, treinamento: t.treinamento as Treinamento })) as TreinamentoColaborador[];
    
    const realizados = (treinamentosData || [])
      .filter(t => t.status === 'concluido')
      .map(t => ({ ...t, treinamento: t.treinamento as Treinamento })) as TreinamentoColaborador[];

    // Calcular totais
    const horasTotal = realizados.reduce((acc, t) => acc + (t.treinamento?.carga_horaria || 0), 0);

    setData({
      pendentes,
      emAndamento,
      realizados,
      totalRealizados: realizados.length,
      totalPendentes: pendentes.length + emAndamento.length,
      horasTotal,
      trilha: trilhaData as TrilhaDesenvolvimento | null,
    });

    setIsLoading(false);
  };

  const iniciarTreinamento = async (treinamentoColaboradorId: string) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    const { error } = await supabase
      .from('treinamentos_colaborador' as any)
      .update({
        status: 'em_andamento',
        data_inicio: new Date().toISOString(),
        progresso: 0,
      } as any)
      .eq('id', treinamentoColaboradorId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    await fetchTreinamentos();
    return { success: true };
  };

  const atualizarProgresso = async (treinamentoColaboradorId: string, progresso: number) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    const updates: Record<string, unknown> = { progresso };

    // Se completou 100%, marcar como concluído
    if (progresso >= 100) {
      updates.status = 'concluido';
      updates.data_conclusao = new Date().toISOString();
      updates.progresso = 100;
    }

    const { error } = await supabase
      .from('treinamentos_colaborador' as any)
      .update(updates as any)
      .eq('id', treinamentoColaboradorId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    await fetchTreinamentos();
    return { success: true };
  };

  const concluirTreinamento = async (treinamentoColaboradorId: string, nota?: number) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    const { error } = await supabase
      .from('treinamentos_colaborador' as any)
      .update({
        status: 'concluido',
        progresso: 100,
        data_conclusao: new Date().toISOString(),
        nota: nota || null,
      } as any)
      .eq('id', treinamentoColaboradorId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    await fetchTreinamentos();
    return { success: true };
  };

  useEffect(() => {
    fetchTreinamentos();
  }, [user]);

  return {
    ...data,
    isLoading,
    iniciarTreinamento,
    atualizarProgresso,
    concluirTreinamento,
    refetch: fetchTreinamentos,
  };
}
