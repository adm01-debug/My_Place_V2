import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

// =====================================================
// TYPES
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
  // Joined fields
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
// HOOK
// =====================================================

export function useKudos() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [kudos, setKudos] = useState<Kudo[]>([]);
  const [categorias, setCategorias] = useState<KudoCategoria[]>([]);
  const [meusPontos, setMeusPontos] = useState<KudoPontos | null>(null);
  const [meusBadges, setMeusBadges] = useState<BadgeUsuario[]>([]);
  const [ranking, setRanking] = useState<KudoRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // =====================================================
  // FETCH FUNCTIONS
  // =====================================================

  const fetchCategorias = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('kudos_categorias')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setCategorias(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar categorias:', err);
    }
  }, []);

  const fetchKudosFeed = useCallback(async (limit = 50) => {
    try {
      const { data, error } = await supabase
        .from('kudos')
        .select(`
          *,
          de_usuario:profiles!kudos_de_usuario_id_fkey(id, nome, avatar_url, cargo, departamento),
          para_usuario:profiles!kudos_para_usuario_id_fkey(id, nome, avatar_url, cargo, departamento),
          categoria:kudos_categorias(*)
        `)
        .eq('publico', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      setKudos(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar kudos:', err);
      setError(err.message);
    }
  }, []);

  const fetchMeusKudos = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('kudos')
        .select(`
          *,
          de_usuario:profiles!kudos_de_usuario_id_fkey(id, nome, avatar_url, cargo, departamento),
          para_usuario:profiles!kudos_para_usuario_id_fkey(id, nome, avatar_url, cargo, departamento),
          categoria:kudos_categorias(*)
        `)
        .or(`de_usuario_id.eq.${user.id},para_usuario_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Erro ao buscar meus kudos:', err);
      return [];
    }
  }, [user?.id]);

  const fetchMeusPontos = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('kudos_pontos')
        .select('*')
        .eq('usuario_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setMeusPontos(data);
    } catch (err: any) {
      console.error('Erro ao buscar pontos:', err);
    }
  }, [user?.id]);

  const fetchMeusBadges = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('badges_usuarios')
        .select(`
          *,
          badge:badges(*)
        `)
        .eq('usuario_id', user.id)
        .order('conquistado_em', { ascending: false });

      if (error) throw error;
      setMeusBadges(data || []);
    } catch (err: any) {
      console.error('Erro ao buscar badges:', err);
    }
  }, [user?.id]);

  const fetchRanking = useCallback(async (limit = 10) => {
    try {
      const { data, error } = await supabase
        .from('kudos_pontos')
        .select(`
          *,
          usuario:profiles(id, nome, avatar_url, cargo, departamento)
        `)
        .order('pontos_recebidos', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const rankingData: KudoRanking[] = (data || []).map((item, index) => ({
        usuario_id: item.usuario_id,
        nome: item.usuario?.nome || 'Usuário',
        avatar_url: item.usuario?.avatar_url,
        cargo: item.usuario?.cargo,
        departamento: item.usuario?.departamento,
        pontos_recebidos: item.pontos_recebidos,
        total_kudos_recebidos: item.total_kudos_recebidos,
        nivel: item.nivel,
        posicao: index + 1,
      }));

      setRanking(rankingData);
    } catch (err: any) {
      console.error('Erro ao buscar ranking:', err);
    }
  }, []);

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

    try {
      const { data, error } = await supabase
        .from('kudos')
        .insert({
          de_usuario_id: user.id,
          para_usuario_id: params.para_usuario_id,
          categoria_id: params.categoria_id,
          mensagem: params.mensagem,
          publico: params.publico ?? true,
        })
        .select(`
          *,
          de_usuario:profiles!kudos_de_usuario_id_fkey(id, nome, avatar_url, cargo, departamento),
          para_usuario:profiles!kudos_para_usuario_id_fkey(id, nome, avatar_url, cargo, departamento),
          categoria:kudos_categorias(*)
        `)
        .single();

      if (error) throw error;

      toast({
        title: '🎉 Kudo enviado!',
        description: 'Seu reconhecimento foi enviado com sucesso!',
      });

      // Atualizar feed
      await fetchKudosFeed();
      await fetchMeusPontos();

      return data;
    } catch (err: any) {
      console.error('Erro ao enviar kudo:', err);
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar o kudo',
        variant: 'destructive',
      });
      return null;
    }
  }, [user?.id, toast, fetchKudosFeed, fetchMeusPontos]);

  const reagirKudo = useCallback(async (kudoId: string, emoji: string) => {
    if (!user?.id) return null;

    try {
      // Verificar se já reagiu
      const { data: existing } = await supabase
        .from('kudos_reacoes')
        .select('id')
        .eq('kudo_id', kudoId)
        .eq('usuario_id', user.id)
        .single();

      if (existing) {
        // Remover reação
        await supabase
          .from('kudos_reacoes')
          .delete()
          .eq('id', existing.id);
      } else {
        // Adicionar reação
        await supabase
          .from('kudos_reacoes')
          .insert({
            kudo_id: kudoId,
            usuario_id: user.id,
            emoji,
          });
      }

      await fetchKudosFeed();
      return true;
    } catch (err: any) {
      console.error('Erro ao reagir:', err);
      return null;
    }
  }, [user?.id, fetchKudosFeed]);

  const getReacoesKudo = useCallback(async (kudoId: string) => {
    try {
      const { data, error } = await supabase
        .from('kudos_reacoes')
        .select('*')
        .eq('kudo_id', kudoId);

      if (error) throw error;
      return data || [];
    } catch (err: any) {
      console.error('Erro ao buscar reações:', err);
      return [];
    }
  }, []);

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
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCategorias(),
        fetchKudosFeed(),
        fetchMeusPontos(),
        fetchMeusBadges(),
        fetchRanking(),
      ]);
      setLoading(false);
    };

    loadData();
  }, [fetchCategorias, fetchKudosFeed, fetchMeusPontos, fetchMeusBadges, fetchRanking]);

  // =====================================================
  // REALTIME SUBSCRIPTION
  // =====================================================

  useEffect(() => {
    const channel = supabase
      .channel('kudos-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kudos' },
        () => {
          fetchKudosFeed();
          fetchMeusPontos();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'badges_usuarios' },
        () => {
          fetchMeusBadges();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchKudosFeed, fetchMeusPontos, fetchMeusBadges]);

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
      await Promise.all([
        fetchKudosFeed(),
        fetchMeusPontos(),
        fetchMeusBadges(),
        fetchRanking(),
      ]);
    }, [fetchKudosFeed, fetchMeusPontos, fetchMeusBadges, fetchRanking]),
  };
}

export default useKudos;
