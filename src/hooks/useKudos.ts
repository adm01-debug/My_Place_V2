import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// =====================================================
// TYPES - Mock types for kudos system
// =====================================================

export interface KudoCategoria {
  id: string;
  nome: string;
  descricao: string | null;
  icone: string;
  pontos: number;
  cor: string;
  ativo: boolean;
}

export interface Kudo {
  id: string;
  de_usuario_id: string;
  para_usuario_id: string;
  categoria_id: string;
  mensagem: string;
  publico: boolean;
  created_at: string;
  de_usuario?: {
    id: string;
    nome: string;
    avatar_url: string | null;
    cargo: string | null;
    departamento: string | null;
  };
  para_usuario?: {
    id: string;
    nome: string;
    avatar_url: string | null;
    cargo: string | null;
    departamento: string | null;
  };
  categoria?: KudoCategoria;
  reacoes_count?: number;
  user_reacted?: boolean;
}

export interface KudoReacao {
  id: string;
  kudo_id: string;
  usuario_id: string;
  emoji: string;
  created_at: string;
}

export interface KudoPontos {
  id: string;
  usuario_id: string;
  pontos_recebidos: number;
  pontos_enviados: number;
  total_kudos_recebidos: number;
  total_kudos_enviados: number;
  nivel: number;
  updated_at: string;
}

export interface Badge {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  cor: string;
  criterio: string;
  pontos_necessarios: number | null;
  ativo: boolean;
}

export interface BadgeUsuario {
  id: string;
  usuario_id: string;
  badge_id: string;
  conquistado_em: string;
  badge?: Badge;
}

export interface KudoRanking {
  usuario_id: string;
  nome: string;
  avatar_url: string | null;
  cargo: string | null;
  departamento: string | null;
  pontos_recebidos: number;
  total_kudos_recebidos: number;
  nivel: number;
  posicao: number;
}

export interface EnviarKudoParams {
  para_usuario_id: string;
  categoria_id: string;
  mensagem: string;
  publico?: boolean;
}

// =====================================================
// MOCK DATA - Dados estáticos enquanto tabelas não existem
// =====================================================

const mockCategorias: KudoCategoria[] = [
  { id: '1', nome: 'Colaboração', descricao: 'Reconheça trabalho em equipe', icone: '🤝', pontos: 10, cor: '#6366f1', ativo: true },
  { id: '2', nome: 'Inovação', descricao: 'Ideias criativas e soluções', icone: '💡', pontos: 15, cor: '#22c55e', ativo: true },
  { id: '3', nome: 'Liderança', descricao: 'Inspiração e mentoria', icone: '⭐', pontos: 20, cor: '#f59e0b', ativo: true },
  { id: '4', nome: 'Excelência', descricao: 'Trabalho excepcional', icone: '🏆', pontos: 25, cor: '#ef4444', ativo: true },
];

const mockBadges: Badge[] = [
  { id: '1', nome: 'Primeira Estrela', descricao: 'Enviou seu primeiro kudo', icone: '⭐', cor: '#6366f1', criterio: 'enviar_primeiro', pontos_necessarios: null, ativo: true },
  { id: '2', nome: 'Colaborador', descricao: 'Recebeu 10 kudos', icone: '🤝', cor: '#22c55e', criterio: 'receber_10', pontos_necessarios: 10, ativo: true },
  { id: '3', nome: 'Mentor', descricao: 'Enviou 50 kudos', icone: '🎓', cor: '#f59e0b', criterio: 'enviar_50', pontos_necessarios: 50, ativo: true },
];

// =====================================================
// HOOK
// =====================================================

export function useKudos() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [kudos, setKudos] = useState<Kudo[]>([]);
  const [categorias] = useState<KudoCategoria[]>(mockCategorias);
  const [meusPontos, setMeusPontos] = useState<KudoPontos | null>(null);
  const [meusBadges, setMeusBadges] = useState<BadgeUsuario[]>([]);
  const [ranking, setRanking] = useState<KudoRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // =====================================================
  // INITIAL LOAD - Mock data
  // =====================================================

  useEffect(() => {
    const loadMockData = async () => {
      setLoading(true);
      
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Dados mock do usuário
      if (user?.id) {
        setMeusPontos({
          id: '1',
          usuario_id: user.id,
          pontos_recebidos: 150,
          pontos_enviados: 80,
          total_kudos_recebidos: 12,
          total_kudos_enviados: 8,
          nivel: 2,
          updated_at: new Date().toISOString(),
        });

        setMeusBadges([
          { id: '1', usuario_id: user.id, badge_id: '1', conquistado_em: '2024-01-15', badge: mockBadges[0] },
          { id: '2', usuario_id: user.id, badge_id: '2', conquistado_em: '2024-06-20', badge: mockBadges[1] },
        ]);
      }

      // Ranking mock
      setRanking([
        { usuario_id: '1', nome: 'Maria Silva', avatar_url: null, cargo: 'Desenvolvedora', departamento: 'TI', pontos_recebidos: 350, total_kudos_recebidos: 28, nivel: 4, posicao: 1 },
        { usuario_id: '2', nome: 'João Santos', avatar_url: null, cargo: 'Designer', departamento: 'Marketing', pontos_recebidos: 280, total_kudos_recebidos: 22, nivel: 3, posicao: 2 },
        { usuario_id: '3', nome: 'Ana Costa', avatar_url: null, cargo: 'Gerente', departamento: 'Vendas', pontos_recebidos: 220, total_kudos_recebidos: 18, nivel: 3, posicao: 3 },
      ]);

      setLoading(false);
    };

    loadMockData();
  }, [user?.id]);

  // =====================================================
  // ACTION FUNCTIONS
  // =====================================================

  const enviarKudo = useCallback(async (params: EnviarKudoParams) => {
    if (!user?.id) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para enviar kudos',
        variant: 'destructive',
      });
      return null;
    }

    if (params.para_usuario_id === user.id) {
      toast({
        title: 'Erro',
        description: 'Você não pode enviar kudos para si mesmo',
        variant: 'destructive',
      });
      return null;
    }

    // Mock de envio - quando as tabelas existirem, integrar com Supabase
    const novoKudo: Kudo = {
      id: Date.now().toString(),
      de_usuario_id: user.id,
      para_usuario_id: params.para_usuario_id,
      categoria_id: params.categoria_id,
      mensagem: params.mensagem,
      publico: params.publico ?? true,
      created_at: new Date().toISOString(),
      categoria: categorias.find(c => c.id === params.categoria_id),
    };

    setKudos(prev => [novoKudo, ...prev]);

    toast({
      title: '🎉 Kudo enviado!',
      description: 'Seu reconhecimento foi enviado com sucesso!',
    });

    return novoKudo;
  }, [user?.id, toast, categorias]);

  const reagirKudo = useCallback(async (kudoId: string, emoji: string) => {
    if (!user?.id) return null;
    
    toast({
      title: `${emoji} Reação registrada!`,
    });
    
    return true;
  }, [user?.id, toast]);

  const getReacoesKudo = useCallback(async (kudoId: string): Promise<KudoReacao[]> => {
    return [];
  }, []);

  const fetchMeusKudos = useCallback(async (): Promise<Kudo[]> => {
    return kudos.filter(k => k.de_usuario_id === user?.id || k.para_usuario_id === user?.id);
  }, [kudos, user?.id]);

  // =====================================================
  // COMPUTED VALUES
  // =====================================================

  const kudosRecebidos = useMemo(() => {
    return kudos.filter(k => k.para_usuario_id === user?.id);
  }, [kudos, user?.id]);

  const kudosEnviados = useMemo(() => {
    return kudos.filter(k => k.de_usuario_id === user?.id);
  }, [kudos, user?.id]);

  const nivelAtual = useMemo(() => {
    if (!meusPontos) return 1;
    return Math.floor(meusPontos.pontos_recebidos / 100) + 1;
  }, [meusPontos]);

  const progressoNivel = useMemo(() => {
    if (!meusPontos) return 0;
    return (meusPontos.pontos_recebidos % 100);
  }, [meusPontos]);

  // =====================================================
  // RETURN
  // =====================================================

  return {
    // Data
    kudos,
    categorias,
    meusPontos,
    meusBadges,
    ranking,
    kudosRecebidos,
    kudosEnviados,
    
    // Computed
    nivelAtual,
    progressoNivel,
    
    // State
    loading,
    error,
    
    // Actions
    enviarKudo,
    reagirKudo,
    getReacoesKudo,
    fetchMeusKudos,
    
    // Refresh
    refresh: useCallback(async () => {
      // Mock refresh
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));
      setLoading(false);
    }, []),
  };
}

export default useKudos;
