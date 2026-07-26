import { useCallback, useMemo, useState } from 'react';
import type { Notificacao } from '@/components/notificacoes/types';
import { buildThreads as buildThreadsPure } from '@/components/notificacoes/NotificacaoThreadGroup';

export interface UseNotificacoesThreadsParams {
  /** Grupos já filtrados/ordenados, no formato [rótulo, itens]. */
  grupos: ReadonlyArray<readonly [string, Notificacao[]]>;
  /** Quando falso, cada notificação é renderizada isoladamente. */
  agruparSimilares: boolean;
}

export interface UseNotificacoesThreads {
  threadsExpandidas: Set<string>;
  setThreadsExpandidas: React.Dispatch<React.SetStateAction<Set<string>>>;
  toggleThread: (key: string) => void;
  /** Constrói as threads de um grupo específico (memoizada por `agruparSimilares`). */
  buildThreads: (label: string, itens: Notificacao[]) => ReturnType<typeof buildThreadsPure>;
  /** IDs na ordem exata de renderização, respeitando threads colapsadas. */
  visibleIds: string[];
}

/**
 * Centraliza o estado de expansão das threads e deriva a ordem de navegação
 * por teclado (`visibleIds`), que precisa refletir exatamente o que está
 * visível na tela — threads colapsadas não expõem seus filhos.
 */
export function useNotificacoesThreads({
  grupos,
  agruparSimilares,
}: UseNotificacoesThreadsParams): UseNotificacoesThreads {
  const [threadsExpandidas, setThreadsExpandidas] = useState<Set<string>>(new Set());

  const toggleThread = useCallback((key: string) => {
    setThreadsExpandidas((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const buildThreads = useCallback(
    (label: string, itens: Notificacao[]) => buildThreadsPure(label, itens, agruparSimilares),
    [agruparSimilares],
  );

  const visibleIds = useMemo(() => {
    const ids: string[] = [];
    for (const [label, itens] of grupos) {
      for (const t of buildThreads(label, itens)) {
        if (t.kind === 'single') ids.push(t.notif.id);
        else if (threadsExpandidas.has(t.key)) t.items.forEach((n) => ids.push(n.id));
      }
    }
    return ids;
  }, [grupos, buildThreads, threadsExpandidas]);

  return { threadsExpandidas, setThreadsExpandidas, toggleThread, buildThreads, visibleIds };
}
