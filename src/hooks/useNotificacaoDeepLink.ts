import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Notificacao } from '@/components/notificacoes/types';
import { groupLabel } from '@/components/notificacoes/relevance';

interface Params {
  notificacoes: Notificacao[];
  loading: boolean;
  agruparSimilares: boolean;
  setThreadsExpandidas: Dispatch<SetStateAction<Set<string>>>;
  setHighlightedId: Dispatch<SetStateAction<string | null>>;
  marcarComoLida: (id: string) => void | Promise<void>;
}

/**
 * Deep-linking via `?focus=<id>`:
 * - Expande a thread que contém o item, se agrupamento estiver ativo (≥3 irmãos).
 * - Rola o card até o centro da viewport com animação suave.
 * - Destaca o item por 2.6s e marca como lido (se ainda não estiver).
 * - Remove o parâmetro `focus` da URL para não repetir o efeito.
 */
export function useNotificacaoDeepLink({
  notificacoes,
  loading,
  agruparSimilares,
  setThreadsExpandidas,
  setHighlightedId,
  marcarComoLida,
}: Params): void {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const focusId = searchParams.get('focus');
    if (!focusId || loading || notificacoes.length === 0) return;

    const alvo = notificacoes.find((n) => n.id === focusId);
    if (!alvo) return;

    if (agruparSimilares) {
      const label = groupLabel(new Date(alvo.created_at));
      const key = `${label}::${alvo.titulo.trim().toLowerCase()}`;
      const irmaos = notificacoes.filter(
        (n) =>
          groupLabel(new Date(n.created_at)) === label &&
          n.titulo.trim().toLowerCase() === alvo.titulo.trim().toLowerCase(),
      );
      if (irmaos.length >= 3) {
        setThreadsExpandidas((prev) => {
          if (prev.has(key)) return prev;
          const next = new Set(prev);
          next.add(key);
          return next;
        });
      }
    }

    const t = window.setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[data-notif-id="${focusId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedId(focusId);
        if (!alvo.lida) void marcarComoLida(focusId);
        window.setTimeout(() => setHighlightedId(null), 2600);
      }
      const next = new URLSearchParams(searchParams);
      next.delete('focus');
      setSearchParams(next, { replace: true });
    }, 120);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, notificacoes, loading, agruparSimilares]);
}
