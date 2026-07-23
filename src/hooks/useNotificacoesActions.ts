import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Notificacao } from '@/components/notificacoes/types';

interface Params {
  user: User | null;
  notificacoes: Notificacao[];
  setNotificacoes: Dispatch<SetStateAction<Notificacao[]>>;
  selecionadas: Set<string>;
  setSelecionadas: Dispatch<SetStateAction<Set<string>>>;
}

export interface NotificacoesActions {
  marcarComoLida: (id: string) => Promise<void>;
  marcarComoNaoLida: (id: string) => Promise<void>;
  togglePin: (n: Notificacao) => Promise<void>;
  marcarTodasComoLidas: () => Promise<void>;
  excluirNotificacao: (id: string) => Promise<void>;
  adiarNotificacoes: (ids: string[], minutos: number) => Promise<void>;
  acaoEmMassa: (acao: 'ler' | 'excluir') => Promise<void>;
  restaurarNotificacoes: (snapshot: Notificacao[]) => Promise<void>;
  reverterAdiamento: (snapshot: Notificacao[]) => Promise<void>;
  toggleSelecao: (id: string) => void;
}

const formatDuracao = (minutos: number): string =>
  minutos < 60
    ? `${minutos} min`
    : minutos < 1440
      ? `${Math.round(minutos / 60)}h`
      : `${Math.round(minutos / 1440)}d`;

/**
 * Consolida todas as ações mutantes sobre notificações com:
 * - Optimistic updates + rollback quando aplicável.
 * - Toasts de sucesso/erro e ações "Desfazer" (restaurar/reverter).
 * - Sincronização de `selecionadas` ao excluir/adiar.
 */
export function useNotificacoesActions({
  user,
  notificacoes,
  setNotificacoes,
  selecionadas,
  setSelecionadas,
}: Params): NotificacoesActions {
  const marcarComoLida = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
      if (error) throw error;
      setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)));
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  }, [setNotificacoes]);

  const marcarComoNaoLida = useCallback(async (id: string) => {
    try {
      const { error } = await supabase.from('notificacoes').update({ lida: false }).eq('id', id);
      if (error) throw error;
      setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: false } : n)));
    } catch (error) {
      console.error('Erro ao marcar como não lida:', error);
      toast.error('Não foi possível marcar como não lida');
    }
  }, [setNotificacoes]);

  const togglePin = useCallback(async (n: Notificacao) => {
    const proximoValor = n.fixada_em ? null : new Date().toISOString();
    setNotificacoes((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, fixada_em: proximoValor } : x)),
    );
    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ fixada_em: proximoValor })
        .eq('id', n.id);
      if (error) throw error;
      toast.success(proximoValor ? 'Notificação fixada' : 'Notificação desafixada');
    } catch (error) {
      console.error('Erro ao alternar fixar:', error);
      setNotificacoes((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, fixada_em: n.fixada_em } : x)),
      );
      toast.error('Não foi possível fixar a notificação');
    }
  }, [setNotificacoes]);

  const marcarTodasComoLidas = useCallback(async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('user_id', user.id)
        .eq('lida', false);
      if (error) throw error;
      setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
      toast.success('Todas as notificações foram marcadas como lidas');
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast.error('Erro ao atualizar notificações');
    }
  }, [user, setNotificacoes]);

  const restaurarNotificacoes = useCallback(async (snapshot: Notificacao[]) => {
    if (!user || snapshot.length === 0) return;
    try {
      const rows = snapshot.map((n) => ({
        id: n.id,
        user_id: user.id,
        titulo: n.titulo,
        mensagem: n.mensagem,
        tipo: n.tipo,
        lida: n.lida,
        link: n.link,
        created_at: n.created_at,
      }));
      const { error } = await supabase.from('notificacoes').insert(rows);
      if (error) throw error;
      setNotificacoes((prev) => {
        const existentes = new Set(prev.map((n) => n.id));
        const novos = snapshot.filter((n) => !existentes.has(n.id));
        return [...novos, ...prev].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      });
      toast.success(`${snapshot.length} restaurada(s)`);
    } catch (error) {
      console.error('Erro ao restaurar notificação:', error);
      toast.error('Não foi possível desfazer a exclusão');
    }
  }, [user, setNotificacoes]);

  const reverterAdiamento = useCallback(async (snapshot: Notificacao[]) => {
    if (snapshot.length === 0) return;
    const ids = snapshot.map((n) => n.id);
    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ adiada_ate: null })
        .in('id', ids);
      if (error) throw error;
      setNotificacoes((prev) => {
        const existentes = new Set(prev.map((n) => n.id));
        const novos = snapshot.filter((n) => !existentes.has(n.id));
        return [...novos, ...prev].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      });
      toast.success('Adiamento cancelado');
    } catch (error) {
      console.error('Erro ao reverter adiamento:', error);
      toast.error('Não foi possível desfazer');
    }
  }, [setNotificacoes]);

  const excluirNotificacao = useCallback(async (id: string) => {
    const snapshot = notificacoes.find((n) => n.id === id);
    try {
      const { error } = await supabase.from('notificacoes').delete().eq('id', id);
      if (error) throw error;
      setNotificacoes((prev) => prev.filter((n) => n.id !== id));
      setSelecionadas((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success('Notificação removida', {
        duration: 6000,
        action: snapshot
          ? { label: 'Desfazer', onClick: () => restaurarNotificacoes([snapshot]) }
          : undefined,
      });
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
      toast.error('Erro ao excluir notificação');
    }
  }, [notificacoes, setNotificacoes, setSelecionadas, restaurarNotificacoes]);

  const adiarNotificacoes = useCallback(async (ids: string[], minutos: number) => {
    if (ids.length === 0) return;
    const snapshot = notificacoes.filter((n) => ids.includes(n.id));
    const ate = new Date(Date.now() + minutos * 60_000).toISOString();
    try {
      const { error } = await supabase.rpc('fn_adiar_notificacoes', { _ids: ids, _ate: ate });
      if (error) throw error;
      setNotificacoes((prev) => prev.filter((n) => !ids.includes(n.id)));
      setSelecionadas((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      toast.success(`Adiada${ids.length > 1 ? 's' : ''} por ${formatDuracao(minutos)}`, {
        duration: 6000,
        action:
          snapshot.length > 0
            ? { label: 'Desfazer', onClick: () => reverterAdiamento(snapshot) }
            : undefined,
      });
    } catch (error) {
      console.error('Erro ao adiar notificação:', error);
      toast.error('Não foi possível adiar');
    }
  }, [notificacoes, setNotificacoes, setSelecionadas, reverterAdiamento]);

  const acaoEmMassa = useCallback(async (acao: 'ler' | 'excluir') => {
    const ids = Array.from(selecionadas);
    if (ids.length === 0) return;
    const snapshot = notificacoes.filter((n) => selecionadas.has(n.id));
    try {
      if (acao === 'ler') {
        const { error } = await supabase.from('notificacoes').update({ lida: true }).in('id', ids);
        if (error) throw error;
        setNotificacoes((prev) =>
          prev.map((n) => (selecionadas.has(n.id) ? { ...n, lida: true } : n)),
        );
        toast.success(`${ids.length} marcada(s) como lida(s)`);
      } else {
        const { error } = await supabase.from('notificacoes').delete().in('id', ids);
        if (error) throw error;
        setNotificacoes((prev) => prev.filter((n) => !selecionadas.has(n.id)));
        toast.success(`${ids.length} removida(s)`, {
          duration: 8000,
          action: { label: 'Desfazer', onClick: () => restaurarNotificacoes(snapshot) },
        });
      }
      setSelecionadas(new Set());
    } catch (error) {
      console.error('Erro na ação em massa:', error);
      toast.error('Não foi possível concluir a ação');
    }
  }, [notificacoes, selecionadas, setNotificacoes, setSelecionadas, restaurarNotificacoes]);

  const toggleSelecao = useCallback((id: string) => {
    setSelecionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, [setSelecionadas]);

  return {
    marcarComoLida,
    marcarComoNaoLida,
    togglePin,
    marcarTodasComoLidas,
    excluirNotificacao,
    adiarNotificacoes,
    acaoEmMassa,
    restaurarNotificacoes,
    reverterAdiamento,
    toggleSelecao,
  };
}
