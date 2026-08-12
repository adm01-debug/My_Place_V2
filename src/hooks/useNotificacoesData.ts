import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Notificacao } from '@/components/notificacoes/types';

const PAGE_SIZE = 50;
const FETCH_LIMIT = 200;

export interface UseNotificacoesDataParams {
  user: User | null;
  /** Chaves de filtro que, ao mudarem, reiniciam a paginação. */
  resetKeys: readonly unknown[];
}

export interface UseNotificacoesData {
  notificacoes: Notificacao[];
  setNotificacoes: React.Dispatch<React.SetStateAction<Notificacao[]>>;
  loading: boolean;
  fetchNotificacoes: () => Promise<void>;
  visibleCount: number;
  loadMore: () => void;
  /** Informa ao hook quantos itens existem após a filtragem (teto da paginação). */
  setTotalFiltradas: (total: number) => void;
  sentinelRef: React.RefObject<HTMLDivElement>;
}

/**
 * Centraliza o carregamento das notificações do usuário, a paginação
 * incremental e o scroll infinito via IntersectionObserver.
 *
 * O total filtrado é informado pelo consumidor (`setTotalFiltradas`) porque a
 * filtragem depende do resultado deste hook — evitando dependência circular.
 *
 * Robustez:
 * - Fetch ignorado sem usuário autenticado.
 * - Notificações adiadas para o futuro são excluídas no servidor.
 * - Observer desconectado quando não há mais itens a carregar.
 */
export function useNotificacoesData({
  user,
  resetKeys,
}: UseNotificacoesDataParams): UseNotificacoesData {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState<number>(PAGE_SIZE);
  const [totalFiltradas, setTotalFiltradasState] = useState<number>(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const setTotalFiltradas = useCallback((total: number) => {
    setTotalFiltradasState((prev) => (prev === total ? prev : total));
  }, []);

  const fetchNotificacoes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('user_id', user.id)
        .or('adiada_ate.is.null,adiada_ate.lte.' + new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(FETCH_LIMIT);

      if (error) throw error;
      setNotificacoes((data || []) as Notificacao[]);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      toast.error('Não foi possível carregar as notificações');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotificacoes();
  }, [fetchNotificacoes]);

  const loadMore = useCallback(() => {
    setVisibleCount((c) => Math.min(c + PAGE_SIZE, totalFiltradas));
  }, [totalFiltradas]);

  // Reset da paginação quando qualquer filtro muda.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, resetKeys);

  // Scroll infinito.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (visibleCount >= totalFiltradas) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, totalFiltradas));
        }
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visibleCount, totalFiltradas]);

  return {
    notificacoes,
    setNotificacoes,
    loading,
    fetchNotificacoes,
    visibleCount,
    loadMore,
    setTotalFiltradas,
    sentinelRef,
  };
}
