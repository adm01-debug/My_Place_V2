import { useMemo } from 'react';
import type { Notificacao } from '@/components/notificacoes/types';
import { relevanceScore } from '@/components/notificacoes/relevance';

export interface NotificacaoStats {
  total: number;
  naoLidas: number;
  prioritarias: number;
  fixadas: number;
  porTipo: Record<Notificacao['tipo'], number>;
  porTipoNaoLidas: Record<Notificacao['tipo'], number>;
}

const emptyPorTipo = (): Record<Notificacao['tipo'], number> => ({
  sucesso: 0,
  erro: 0,
  alerta: 0,
  info: 0,
});

/**
 * Calcula estatísticas agregadas de notificações em uma única passada O(n).
 * Puro e memoizado — recalcula apenas quando a referência do array muda.
 */
export function computeNotificacaoStats(items: Notificacao[]): NotificacaoStats {
  const porTipo = emptyPorTipo();
  const porTipoNaoLidas = emptyPorTipo();
  let naoLidas = 0;
  let prioritarias = 0;
  let fixadas = 0;

  for (const n of items) {
    if (porTipo[n.tipo] !== undefined) porTipo[n.tipo]++;
    if (!n.lida) {
      naoLidas++;
      if (porTipoNaoLidas[n.tipo] !== undefined) porTipoNaoLidas[n.tipo]++;
      if (relevanceScore(n) >= 130) prioritarias++;
    }
    if (n.fixada_em) fixadas++;
  }

  return {
    total: items.length,
    naoLidas,
    prioritarias,
    fixadas,
    porTipo,
    porTipoNaoLidas,
  };
}

export function useNotificacaoStats(items: Notificacao[]): NotificacaoStats {
  return useMemo(() => computeNotificacaoStats(items), [items]);
}
