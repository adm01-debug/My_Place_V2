import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// =====================================================
// TYPES
// =====================================================

export interface Trilha {
  id: string;
  nome: string;
  descricao: string | null;
  departamento: string | null;
  nivel: 'iniciante' | 'intermediario' | 'avancado' | 'especialista';
  carga_horaria_total: number;
  ativo: boolean;
  created_at: string;
  // Computed
  etapas_count?: number;
  progresso?: number;
}

export interface TrilhaEtapa {
  id: string;
  trilha_id: string;
  ordem: number;
  titulo: string;
  descricao: string | null;
  tipo: 'video' | 'documento' | 'quiz' | 'tarefa' | 'treinamento' | 'mentoria';
  recurso_url: string | null;
  duracao_minutos: number;
  obrigatoria: boolean;
  treinamento_id: string | null;
  created_at: string;
  // Computed
  concluida?: boolean;
  data_conclusao?: string;
}

export interface TrilhaProgresso {
  id: string;
  usuario_id: string;
  trilha_id: string;
  status: 'nao_iniciada' | 'em_andamento' | 'concluida' | 'pausada';
  progresso_percentual: number;
  iniciado_em: string | null;
  concluido_em: string | null;
  updated_at: string;
}

export interface TrilhaEtapaConcluida {
  id: string;
  usuario_id: string;
  etapa_id: string;
  concluido_em: string;
  nota: number | null;
  observacoes: string | null;
}

export interface TrilhaComProgresso extends Trilha {
  progresso: TrilhaProgresso | null;
  etapas: TrilhaEtapa[];
  etapas_concluidas: number;
  total_etapas: number;
}

export interface IniciarTrilhaParams {
  trilha_id: string;
}

export interface ConcluirEtapaParams {
  etapa_id: string;
  nota?: number;
  observacoes?: string;
}

// =====================================================
// HOOK
// =====================================================

export function useTrilhas() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [trilhas, setTrilhas] = useState<TrilhaComProgresso[]>([]);
  const [trilhaAtual, setTrilhaAtual] = useState<TrilhaComProgresso | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // =====================================================
  // FETCH FUNCTIONS
  // =====================================================

  const fetchTrilhas = useCallback(async () => {
    try {
      // Buscar trilhas ativas
      const { data: trilhasData, error: trilhasError } = await supabase
        .from('trilhas_desenvolvimento')
        .select('*')
        .eq('ativo', true)
        .order('nivel')
        .order('nome');

      if (trilhasError) throw trilhasError;

      // Se não houver usuário logado, retornar só as trilhas
      if (!user?.id) {
        const trilhasSemProgresso = (trilhasData || []).map(t => ({
          ...t,
          progresso: null,
          etapas: [],
          etapas_concluidas: 0,
          total_etapas: 0,
        }));
        setTrilhas(trilhasSemProgresso);
        return;
      }

      // Buscar progresso do usuário
      const { data: progressoData } = await supabase
        .from('trilhas_progresso')
        .select('*')
        .eq('usuario_id', user.id);

      // Buscar etapas
      const { data: etapasData } = await supabase
        .from('trilhas_etapas')
        .select('*')
        .in('trilha_id', trilhasData?.map(t => t.id) || [])
        .order('ordem');

      // Buscar etapas concluídas
      const { data: concluidasData } = await supabase
        .from('trilhas_etapas_concluidas')
        .select('*')
        .eq('usuario_id', user.id);

      // Montar trilhas com progresso
      const trilhasComProgresso: TrilhaComProgresso[] = (trilhasData || []).map(trilha => {
        const progresso = progressoData?.find(p => p.trilha_id === trilha.id) || null;
        const etapas = (etapasData || []).filter(e => e.trilha_id === trilha.id);
        const etapasConcluidas = etapas.filter(e => 
          concluidasData?.some(c => c.etapa_id === e.id)
        );

        return {
          ...trilha,
          progresso,
          etapas: etapas.map(e => ({
            ...e,
            concluida: concluidasData?.some(c => c.etapa_id === e.id),
            data_conclusao: concluidasData?.find(c => c.etapa_id === e.id)?.concluido_em,
          })),
          etapas_concluidas: etapasConcluidas.length,
          total_etapas: etapas.length,
        };
      });

      setTrilhas(trilhasComProgresso);
    } catch (err: any) {
      console.error('Erro ao buscar trilhas:', err);
      setError(err.message);
    }
  }, [user?.id]);

  const fetchTrilha = useCallback(async (trilhaId: string) => {
    try {
      // Buscar trilha
      const { data: trilhaData, error: trilhaError } = await supabase
        .from('trilhas_desenvolvimento')
        .select('*')
        .eq('id', trilhaId)
        .single();

      if (trilhaError) throw trilhaError;

      // Buscar etapas
      const { data: etapasData } = await supabase
        .from('trilhas_etapas')
        .select('*')
        .eq('trilha_id', trilhaId)
        .order('ordem');

      // Se não houver usuário, retornar sem progresso
      if (!user?.id) {
        const trilhaSemProgresso: TrilhaComProgresso = {
          ...trilhaData,
          progresso: null,
          etapas: etapasData || [],
          etapas_concluidas: 0,
          total_etapas: (etapasData || []).length,
        };
        setTrilhaAtual(trilhaSemProgresso);
        return trilhaSemProgresso;
      }

      // Buscar progresso
      const { data: progressoData } = await supabase
        .from('trilhas_progresso')
        .select('*')
        .eq('usuario_id', user.id)
        .eq('trilha_id', trilhaId)
        .single();

      // Buscar etapas concluídas
      const { data: concluidasData } = await supabase
        .from('trilhas_etapas_concluidas')
        .select('*')
        .eq('usuario_id', user.id)
        .in('etapa_id', (etapasData || []).map(e => e.id));

      const etapas = (etapasData || []).map(e => ({
        ...e,
        concluida: concluidasData?.some(c => c.etapa_id === e.id),
        data_conclusao: concluidasData?.find(c => c.etapa_id === e.id)?.concluido_em,
      }));

      const trilhaComProgresso: TrilhaComProgresso = {
        ...trilhaData,
        progresso: progressoData || null,
        etapas,
        etapas_concluidas: etapas.filter(e => e.concluida).length,
        total_etapas: etapas.length,
      };

      setTrilhaAtual(trilhaComProgresso);
      return trilhaComProgresso;
    } catch (err: any) {
      console.error('Erro ao buscar trilha:', err);
      setError(err.message);
      return null;
    }
  }, [user?.id]);

  // =====================================================
  // ACTION FUNCTIONS
  // =====================================================

  const iniciarTrilha = useCallback(async (params: IniciarTrilhaParams) => {
    if (!user?.id) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para iniciar uma trilha',
        variant: 'destructive',
      });
      return null;
    }

    try {
      // Verificar se já iniciou
      const { data: existing } = await supabase
        .from('trilhas_progresso')
        .select('id')
        .eq('usuario_id', user.id)
        .eq('trilha_id', params.trilha_id)
        .single();

      if (existing) {
        toast({
          title: 'Aviso',
          description: 'Você já iniciou esta trilha',
        });
        return existing;
      }

      // Criar progresso
      const { data, error } = await supabase
        .from('trilhas_progresso')
        .insert({
          usuario_id: user.id,
          trilha_id: params.trilha_id,
          status: 'em_andamento',
          progresso_percentual: 0,
          iniciado_em: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '🚀 Trilha iniciada!',
        description: 'Boa sorte na sua jornada de desenvolvimento!',
      });

      await fetchTrilhas();
      return data;
    } catch (err: any) {
      console.error('Erro ao iniciar trilha:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível iniciar a trilha',
        variant: 'destructive',
      });
      return null;
    }
  }, [user?.id, toast, fetchTrilhas]);

  const concluirEtapa = useCallback(async (params: ConcluirEtapaParams) => {
    if (!user?.id) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado',
        variant: 'destructive',
      });
      return null;
    }

    try {
      // Verificar se já concluiu
      const { data: existing } = await supabase
        .from('trilhas_etapas_concluidas')
        .select('id')
        .eq('usuario_id', user.id)
        .eq('etapa_id', params.etapa_id)
        .single();

      if (existing) {
        toast({
          title: 'Aviso',
          description: 'Você já concluiu esta etapa',
        });
        return existing;
      }

      // Marcar como concluída
      const { data, error } = await supabase
        .from('trilhas_etapas_concluidas')
        .insert({
          usuario_id: user.id,
          etapa_id: params.etapa_id,
          nota: params.nota,
          observacoes: params.observacoes,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '✅ Etapa concluída!',
        description: 'Continue assim, você está progredindo!',
      });

      // Atualizar dados
      if (trilhaAtual) {
        await fetchTrilha(trilhaAtual.id);
      }
      await fetchTrilhas();

      return data;
    } catch (err: any) {
      console.error('Erro ao concluir etapa:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível concluir a etapa',
        variant: 'destructive',
      });
      return null;
    }
  }, [user?.id, toast, trilhaAtual, fetchTrilha, fetchTrilhas]);

  const pausarTrilha = useCallback(async (trilhaId: string) => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('trilhas_progresso')
        .update({ status: 'pausada' })
        .eq('usuario_id', user.id)
        .eq('trilha_id', trilhaId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Trilha pausada',
        description: 'Você pode continuar quando quiser',
      });

      await fetchTrilhas();
      return data;
    } catch (err: any) {
      console.error('Erro ao pausar trilha:', err);
      return null;
    }
  }, [user?.id, toast, fetchTrilhas]);

  const retornarTrilha = useCallback(async (trilhaId: string) => {
    if (!user?.id) return null;

    try {
      const { data, error } = await supabase
        .from('trilhas_progresso')
        .update({ status: 'em_andamento' })
        .eq('usuario_id', user.id)
        .eq('trilha_id', trilhaId)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Bem-vindo de volta!',
        description: 'Continue sua jornada de desenvolvimento',
      });

      await fetchTrilhas();
      return data;
    } catch (err: any) {
      console.error('Erro ao retomar trilha:', err);
      return null;
    }
  }, [user?.id, toast, fetchTrilhas]);

  // =====================================================
  // COMPUTED VALUES
  // =====================================================

  const trilhasEmAndamento = useMemo(() => {
    return trilhas.filter(t => t.progresso?.status === 'em_andamento');
  }, [trilhas]);

  const trilhasConcluidas = useMemo(() => {
    return trilhas.filter(t => t.progresso?.status === 'concluida');
  }, [trilhas]);

  const trilhasDisponiveis = useMemo(() => {
    return trilhas.filter(t => !t.progresso);
  }, [trilhas]);

  const totalHorasConcluidas = useMemo(() => {
    return trilhasConcluidas.reduce((acc, t) => acc + t.carga_horaria_total, 0);
  }, [trilhasConcluidas]);

  const getNivelLabel = useCallback((nivel: string) => {
    const labels: Record<string, string> = {
      iniciante: '🌱 Iniciante',
      intermediario: '🌿 Intermediário',
      avancado: '🌳 Avançado',
      especialista: '🏆 Especialista',
    };
    return labels[nivel] || nivel;
  }, []);

  const getTipoLabel = useCallback((tipo: string) => {
    const labels: Record<string, string> = {
      video: '🎬 Vídeo',
      documento: '📄 Documento',
      quiz: '❓ Quiz',
      tarefa: '📝 Tarefa',
      treinamento: '🎓 Treinamento',
      mentoria: '👥 Mentoria',
    };
    return labels[tipo] || tipo;
  }, []);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchTrilhas();
      setLoading(false);
    };

    loadData();
  }, [fetchTrilhas]);

  // =====================================================
  // REALTIME SUBSCRIPTION
  // =====================================================

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('trilhas-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trilhas_progresso', filter: `usuario_id=eq.${user.id}` },
        () => fetchTrilhas()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trilhas_etapas_concluidas', filter: `usuario_id=eq.${user.id}` },
        () => fetchTrilhas()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchTrilhas]);

  // =====================================================
  // RETURN
  // =====================================================

  return {
    // Data
    trilhas,
    trilhaAtual,
    trilhasEmAndamento,
    trilhasConcluidas,
    trilhasDisponiveis,
    totalHorasConcluidas,
    
    // State
    loading,
    error,
    
    // Actions
    iniciarTrilha,
    concluirEtapa,
    pausarTrilha,
    retornarTrilha,
    fetchTrilha,
    
    // Helpers
    getNivelLabel,
    getTipoLabel,
    
    // Refresh
    refresh: fetchTrilhas,
  };
}

export default useTrilhas;
