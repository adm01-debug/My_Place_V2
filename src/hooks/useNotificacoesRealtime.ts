import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Notificacao } from '@/components/notificacoes/types';
import type { AutoRule } from '@/hooks/useAutoRules';

type Priority = 'alta' | 'media' | 'baixa';

interface Params {
  user: User | null;
  setNotificacoes: Dispatch<SetStateAction<Notificacao[]>>;
  playAlert: (p: Priority) => void;
  matchRule: (n: { titulo: string; mensagem: string; tipo: string }) => AutoRule | null;
}

/**
 * Subscription do Supabase Realtime para INSERT em `notificacoes`.
 * - Dedupe por id (evita duplicar se optimistic update já inseriu).
 * - Aplica regras automáticas (marcar_lida / excluir / fixar) num microtask.
 * - Cleanup determinístico via `supabase.removeChannel` no unmount / troca de usuário.
 */
export function useNotificacoesRealtime({
  user,
  setNotificacoes,
  playAlert,
  matchRule,
}: Params): void {
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notif-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const nova = payload.new as Notificacao;
          setNotificacoes((prev) => {
            if (prev.some((n) => n.id === nova.id)) return prev;
            const prioridade: Priority =
              nova.tipo === 'erro' ? 'alta' : nova.tipo === 'alerta' ? 'media' : 'baixa';
            playAlert(prioridade);
            return [nova, ...prev];
          });

          const match = matchRule(nova);
          if (!match) return;

          setTimeout(async () => {
            try {
              if (match.acao === 'marcar_lida') {
                await supabase.from('notificacoes').update({ lida: true }).eq('id', nova.id);
                setNotificacoes((prev) =>
                  prev.map((n) => (n.id === nova.id ? { ...n, lida: true } : n)),
                );
              } else if (match.acao === 'excluir') {
                await supabase.from('notificacoes').delete().eq('id', nova.id);
                setNotificacoes((prev) => prev.filter((n) => n.id !== nova.id));
              } else if (match.acao === 'fixar') {
                const fixada_em = new Date().toISOString();
                await supabase.from('notificacoes').update({ fixada_em }).eq('id', nova.id);
                setNotificacoes((prev) =>
                  prev.map((n) => (n.id === nova.id ? { ...n, fixada_em } : n)),
                );
              }
              toast.info(`Regra automática aplicada: ${match.acao.replace('_', ' ')}`);
            } catch {
              /* falha silenciosa — a linha permanece intocada */
            }
          }, 0);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, playAlert, matchRule, setNotificacoes]);
}
