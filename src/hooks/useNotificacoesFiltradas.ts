import { useMemo } from 'react';
import type { Notificacao, Filtro } from '@/components/notificacoes/types';
import { groupLabel, relevanceScore } from '@/components/notificacoes/relevance';

interface Params {
  notificacoes: Notificacao[];
  filtro: Filtro;
  busca: string;
  dataInicio: string;
  dataFim: string;
  modoFoco: boolean;
  ordenarPorRelevancia: boolean;
  visibleCount: number;
}

export interface NotificacoesFiltradasResult {
  filtradas: Notificacao[];
  filtradasVisiveis: Notificacao[];
  grupos: Array<[string, Notificacao[]]>;
}

/**
 * Encapsula os pipelines de filtragem, paginação e agrupamento das notificações.
 * Pure/memoizado — recomputa apenas quando dependências mudam.
 */
export function useNotificacoesFiltradas({
  notificacoes,
  filtro,
  busca,
  dataInicio,
  dataFim,
  modoFoco,
  ordenarPorRelevancia,
  visibleCount,
}: Params): NotificacoesFiltradasResult {
  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const ini = dataInicio ? new Date(`${dataInicio}T00:00:00`).getTime() : null;
    const fim = dataFim ? new Date(`${dataFim}T23:59:59.999`).getTime() : null;
    return notificacoes.filter((n) => {
      if (filtro === 'nao_lidas' && n.lida) return false;
      if (['sucesso', 'erro', 'alerta', 'info'].includes(filtro) && n.tipo !== filtro) return false;
      if (termo && !`${n.titulo} ${n.mensagem}`.toLowerCase().includes(termo)) return false;
      if (ini || fim) {
        const t = new Date(n.created_at).getTime();
        if (ini && t < ini) return false;
        if (fim && t > fim) return false;
      }
      if (modoFoco) {
        if (n.lida) return false;
        const prioritaria = n.tipo === 'erro' || n.tipo === 'alerta' || relevanceScore(n) >= 130;
        if (!prioritaria) return false;
      }
      return true;
    });
  }, [notificacoes, filtro, busca, dataInicio, dataFim, modoFoco]);

  const filtradasVisiveis = useMemo(
    () => filtradas.slice(0, visibleCount),
    [filtradas, visibleCount],
  );

  const grupos = useMemo(() => {
    const fixadas: Notificacao[] = [];
    const map = new Map<string, Notificacao[]>();
    for (const n of filtradasVisiveis) {
      if (n.fixada_em) {
        fixadas.push(n);
        continue;
      }
      const label = groupLabel(new Date(n.created_at));
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(n);
    }
    if (ordenarPorRelevancia) {
      for (const [, itens] of map) {
        itens.sort((a, b) => relevanceScore(b) - relevanceScore(a));
      }
      fixadas.sort((a, b) => relevanceScore(b) - relevanceScore(a));
    } else {
      fixadas.sort(
        (a, b) => new Date(b.fixada_em ?? 0).getTime() - new Date(a.fixada_em ?? 0).getTime(),
      );
    }
    const result: Array<[string, Notificacao[]]> = [];
    if (fixadas.length > 0) result.push(['📌 Fixadas', fixadas]);
    for (const entry of map.entries()) result.push(entry);
    return result;
  }, [filtradasVisiveis, ordenarPorRelevancia]);

  return { filtradas, filtradasVisiveis, grupos };
}
