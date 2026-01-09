import { useState, useEffect, useCallback, useMemo } from 'react';
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

export interface TrilhaComProgresso extends Omit<Trilha, 'progresso'> {
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
// MOCK DATA
// =====================================================

const mockTrilhas: Trilha[] = [
  {
    id: '1',
    nome: 'Onboarding Novo Colaborador',
    descricao: 'Trilha de integração para novos colaboradores',
    departamento: null,
    nivel: 'iniciante',
    carga_horaria_total: 8,
    ativo: true,
    created_at: '2024-01-01',
  },
  {
    id: '2',
    nome: 'Liderança e Gestão',
    descricao: 'Desenvolvimento de habilidades de liderança',
    departamento: 'RH',
    nivel: 'intermediario',
    carga_horaria_total: 20,
    ativo: true,
    created_at: '2024-01-01',
  },
  {
    id: '3',
    nome: 'Excel Avançado',
    descricao: 'Domine as funcionalidades avançadas do Excel',
    departamento: 'Financeiro',
    nivel: 'avancado',
    carga_horaria_total: 12,
    ativo: true,
    created_at: '2024-01-01',
  },
];

const mockEtapas: TrilhaEtapa[] = [
  { id: '1', trilha_id: '1', ordem: 1, titulo: 'Bem-vindo à empresa', descricao: 'Conheça nossa história', tipo: 'video', recurso_url: null, duracao_minutos: 15, obrigatoria: true, treinamento_id: null, created_at: '2024-01-01' },
  { id: '2', trilha_id: '1', ordem: 2, titulo: 'Políticas internas', descricao: 'Regras e normas', tipo: 'documento', recurso_url: null, duracao_minutos: 30, obrigatoria: true, treinamento_id: null, created_at: '2024-01-01' },
  { id: '3', trilha_id: '1', ordem: 3, titulo: 'Quiz de integração', descricao: 'Teste seus conhecimentos', tipo: 'quiz', recurso_url: null, duracao_minutos: 20, obrigatoria: true, treinamento_id: null, created_at: '2024-01-01' },
  { id: '4', trilha_id: '2', ordem: 1, titulo: 'Fundamentos de liderança', descricao: 'O que é liderança', tipo: 'video', recurso_url: null, duracao_minutos: 45, obrigatoria: true, treinamento_id: null, created_at: '2024-01-01' },
  { id: '5', trilha_id: '2', ordem: 2, titulo: 'Comunicação efetiva', descricao: 'Como se comunicar', tipo: 'video', recurso_url: null, duracao_minutos: 60, obrigatoria: true, treinamento_id: null, created_at: '2024-01-01' },
];

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
  const [progressoLocal, setProgressoLocal] = useState<Map<string, TrilhaProgresso>>(new Map());
  const [etapasConcluidas, setEtapasConcluidas] = useState<Set<string>>(new Set());

  // =====================================================
  // FETCH FUNCTIONS
  // =====================================================

  const fetchTrilhas = useCallback(async () => {
    try {
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 300));

      const trilhasComProgresso: TrilhaComProgresso[] = mockTrilhas.map(trilha => {
        const etapasTrilha = mockEtapas.filter(e => e.trilha_id === trilha.id);
        const progresso = progressoLocal.get(trilha.id) || null;
        const etapasConcluidasTrilha = etapasTrilha.filter(e => etapasConcluidas.has(e.id));

        return {
          ...trilha,
          progresso,
          etapas: etapasTrilha.map(e => ({
            ...e,
            concluida: etapasConcluidas.has(e.id),
          })),
          etapas_concluidas: etapasConcluidasTrilha.length,
          total_etapas: etapasTrilha.length,
        };
      });

      setTrilhas(trilhasComProgresso);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Erro ao buscar trilhas:', err);
      setError(errorMessage);
    }
  }, [progressoLocal, etapasConcluidas]);

  const fetchTrilha = useCallback(async (trilhaId: string) => {
    const trilha = mockTrilhas.find(t => t.id === trilhaId);
    if (!trilha) return null;

    const etapasTrilha = mockEtapas.filter(e => e.trilha_id === trilhaId);
    const progresso = progressoLocal.get(trilhaId) || null;

    const trilhaComProgresso: TrilhaComProgresso = {
      ...trilha,
      progresso,
      etapas: etapasTrilha.map(e => ({
        ...e,
        concluida: etapasConcluidas.has(e.id),
      })),
      etapas_concluidas: etapasTrilha.filter(e => etapasConcluidas.has(e.id)).length,
      total_etapas: etapasTrilha.length,
    };

    setTrilhaAtual(trilhaComProgresso);
    return trilhaComProgresso;
  }, [progressoLocal, etapasConcluidas]);

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

    const novoProgresso: TrilhaProgresso = {
      id: Date.now().toString(),
      usuario_id: user.id,
      trilha_id: params.trilha_id,
      status: 'em_andamento',
      progresso_percentual: 0,
      iniciado_em: new Date().toISOString(),
      concluido_em: null,
      updated_at: new Date().toISOString(),
    };

    setProgressoLocal(prev => new Map(prev).set(params.trilha_id, novoProgresso));

    toast({
      title: '🚀 Trilha iniciada!',
      description: 'Boa sorte na sua jornada de desenvolvimento!',
    });

    await fetchTrilhas();
    return novoProgresso;
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

    setEtapasConcluidas(prev => new Set(prev).add(params.etapa_id));

    toast({
      title: '✅ Etapa concluída!',
      description: 'Continue assim, você está progredindo!',
    });

    await fetchTrilhas();
    return { id: params.etapa_id };
  }, [user?.id, toast, fetchTrilhas]);

  const pausarTrilha = useCallback(async (trilhaId: string) => {
    if (!user?.id) return null;

    setProgressoLocal(prev => {
      const map = new Map(prev);
      const progresso = map.get(trilhaId);
      if (progresso) {
        map.set(trilhaId, { ...progresso, status: 'pausada' });
      }
      return map;
    });

    toast({
      title: 'Trilha pausada',
      description: 'Você pode continuar quando quiser',
    });

    await fetchTrilhas();
    return { id: trilhaId };
  }, [user?.id, toast, fetchTrilhas]);

  const retornarTrilha = useCallback(async (trilhaId: string) => {
    if (!user?.id) return null;

    setProgressoLocal(prev => {
      const map = new Map(prev);
      const progresso = map.get(trilhaId);
      if (progresso) {
        map.set(trilhaId, { ...progresso, status: 'em_andamento' });
      }
      return map;
    });

    toast({
      title: 'Bem-vindo de volta!',
      description: 'Continue sua jornada de desenvolvimento',
    });

    await fetchTrilhas();
    return { id: trilhaId };
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
