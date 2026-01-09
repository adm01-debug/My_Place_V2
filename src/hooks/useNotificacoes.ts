import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type TipoNotificacao = 'info' | 'success' | 'warning' | 'alert' | 'system';

export interface Notificacao {
  id: string;
  user_id: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  link: string | null;
  dados: Record<string, unknown> | null;
  lida: boolean;
  lida_em: string | null;
  arquivada: boolean;
  created_at: string;
}

interface NotificacoesData {
  notificacoes: Notificacao[];
  naoLidas: Notificacao[];
  unreadCount: number;
}

export function useNotificacoes() {
  const [data, setData] = useState<NotificacoesData>({
    notificacoes: [],
    naoLidas: [],
    unreadCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchNotificacoes = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);

    const { data: notificacoesData, error } = await supabase
      .from('notificacoes')
      .select('*')
      .eq('user_id', user.id)
      .eq('arquivada', false)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching notificacoes:', error);
      setIsLoading(false);
      return;
    }

    const notificacoes = (notificacoesData || []) as Notificacao[];
    const naoLidas = notificacoes.filter(n => !n.lida);

    setData({
      notificacoes,
      naoLidas,
      unreadCount: naoLidas.length,
    });

    setIsLoading(false);
  }, [user]);

  const marcarComoLida = async (notificacaoId: string) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    const { error } = await supabase
      .from('notificacoes')
      .update({
        lida: true,
        lida_em: new Date().toISOString(),
      })
      .eq('id', notificacaoId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    // Atualizar estado local
    setData(prev => {
      const notificacoes = prev.notificacoes.map(n =>
        n.id === notificacaoId ? { ...n, lida: true, lida_em: new Date().toISOString() } : n
      );
      const naoLidas = notificacoes.filter(n => !n.lida);
      return {
        notificacoes,
        naoLidas,
        unreadCount: naoLidas.length,
      };
    });

    return { success: true };
  };

  const marcarTodasComoLidas = async () => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    const { error } = await supabase
      .from('notificacoes')
      .update({
        lida: true,
        lida_em: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .eq('lida', false);

    if (error) {
      return { success: false, error: error.message };
    }

    setData(prev => ({
      notificacoes: prev.notificacoes.map(n => ({ ...n, lida: true })),
      naoLidas: [],
      unreadCount: 0,
    }));

    return { success: true };
  };

  const arquivarNotificacao = async (notificacaoId: string) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    const { error } = await supabase
      .from('notificacoes')
      .update({ arquivada: true })
      .eq('id', notificacaoId)
      .eq('user_id', user.id);

    if (error) {
      return { success: false, error: error.message };
    }

    setData(prev => {
      const notificacoes = prev.notificacoes.filter(n => n.id !== notificacaoId);
      const naoLidas = notificacoes.filter(n => !n.lida);
      return {
        notificacoes,
        naoLidas,
        unreadCount: naoLidas.length,
      };
    });

    return { success: true };
  };

  const limparNotificacao = arquivarNotificacao; // Alias

  // Realtime subscription para novas notificações
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('notificacoes-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const novaNotificacao = payload.new as Notificacao;
          
          // Adicionar à lista
          setData(prev => ({
            notificacoes: [novaNotificacao, ...prev.notificacoes],
            naoLidas: [novaNotificacao, ...prev.naoLidas],
            unreadCount: prev.unreadCount + 1,
          }));

          // Mostrar toast
          toast({
            title: novaNotificacao.titulo,
            description: novaNotificacao.mensagem,
            variant: novaNotificacao.tipo === 'alert' ? 'destructive' : 'default',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  useEffect(() => {
    fetchNotificacoes();
  }, [fetchNotificacoes]);

  return {
    notifications: data.notificacoes, // Compatibilidade com nome antigo
    notificacoes: data.notificacoes,
    naoLidas: data.naoLidas,
    unreadCount: data.unreadCount,
    isLoading,
    markAsRead: marcarComoLida, // Compatibilidade
    marcarComoLida,
    markAllAsRead: marcarTodasComoLidas, // Compatibilidade
    marcarTodasComoLidas,
    clearNotification: arquivarNotificacao, // Compatibilidade
    arquivarNotificacao,
    refetch: fetchNotificacoes,
  };
}

// Export com nome antigo para compatibilidade
export { useNotificacoes as useNotifications };
