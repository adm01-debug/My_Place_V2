import { useCallback, useEffect, useState } from 'react';
import type { Filtro } from '@/components/notificacoes/types';

export type Densidade = 'compact' | 'comfortable';

export interface NotificacoesPreferences {
  filtro: Filtro;
  agruparSimilares: boolean;
  ordenarPorRelevancia: boolean;
  modoFoco: boolean;
  densidade: Densidade;
  dataInicio: string;
  dataFim: string;
}

const STORAGE_KEYS = {
  filtro: 'notif_filtro',
  agruparSimilares: 'notif_agrupar_similares',
  ordenarPorRelevancia: 'notif_ordenar_relevancia',
  modoFoco: 'notif_modo_foco',
  densidade: 'notif_densidade',
  dataInicio: 'notif_data_inicio',
  dataFim: 'notif_data_fim',
} as const;

const FILTROS_VALIDOS: readonly Filtro[] = [
  'todas', 'nao_lidas', 'sucesso', 'erro', 'alerta', 'info',
];

const hasWindow = () => typeof window !== 'undefined';

const readEnum = <T extends string>(key: string, allowed: readonly T[], fallback: T): T => {
  if (!hasWindow()) return fallback;
  const v = localStorage.getItem(key);
  return v && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
};

const readString = (key: string, fallback = ''): string => {
  if (!hasWindow()) return fallback;
  return localStorage.getItem(key) ?? fallback;
};

/** Boolean lido com "1" = true. Se `defaultTrue`, ausência ou valor != '0' → true. */
const readBool = (key: string, defaultTrue = false): boolean => {
  if (!hasWindow()) return defaultTrue;
  const v = localStorage.getItem(key);
  return defaultTrue ? v !== '0' : v === '1';
};

const safeWrite = (key: string, value: string) => {
  if (!hasWindow()) return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* quota/privado — silencioso */
  }
};

export function useNotificacoesPreferences() {
  const [filtro, setFiltro] = useState<Filtro>(() =>
    readEnum<Filtro>(STORAGE_KEYS.filtro, FILTROS_VALIDOS, 'todas'),
  );
  const [agruparSimilares, setAgruparSimilares] = useState<boolean>(() =>
    readBool(STORAGE_KEYS.agruparSimilares, true),
  );
  const [ordenarPorRelevancia, setOrdenarPorRelevancia] = useState<boolean>(() =>
    readBool(STORAGE_KEYS.ordenarPorRelevancia, false),
  );
  const [modoFoco, setModoFoco] = useState<boolean>(() =>
    readBool(STORAGE_KEYS.modoFoco, false),
  );
  const [densidade, setDensidade] = useState<Densidade>(() =>
    readEnum<Densidade>(STORAGE_KEYS.densidade, ['compact', 'comfortable'], 'comfortable'),
  );
  const [dataInicio, setDataInicio] = useState<string>(() =>
    readString(STORAGE_KEYS.dataInicio, ''),
  );
  const [dataFim, setDataFim] = useState<string>(() =>
    readString(STORAGE_KEYS.dataFim, ''),
  );

  useEffect(() => { safeWrite(STORAGE_KEYS.filtro, filtro); }, [filtro]);
  useEffect(() => { safeWrite(STORAGE_KEYS.agruparSimilares, agruparSimilares ? '1' : '0'); }, [agruparSimilares]);
  useEffect(() => { safeWrite(STORAGE_KEYS.ordenarPorRelevancia, ordenarPorRelevancia ? '1' : '0'); }, [ordenarPorRelevancia]);
  useEffect(() => { safeWrite(STORAGE_KEYS.modoFoco, modoFoco ? '1' : '0'); }, [modoFoco]);
  useEffect(() => { safeWrite(STORAGE_KEYS.densidade, densidade); }, [densidade]);
  useEffect(() => { safeWrite(STORAGE_KEYS.dataInicio, dataInicio); }, [dataInicio]);
  useEffect(() => { safeWrite(STORAGE_KEYS.dataFim, dataFim); }, [dataFim]);

  const resetPreferences = useCallback(() => {
    setFiltro('todas');
    setAgruparSimilares(true);
    setOrdenarPorRelevancia(false);
    setModoFoco(false);
    setDensidade('comfortable');
    setDataInicio('');
    setDataFim('');
    if (!hasWindow()) return;
    for (const k of Object.values(STORAGE_KEYS)) {
      try { localStorage.removeItem(k); } catch { /* noop */ }
    }
  }, []);

  return {
    prefs: {
      filtro, agruparSimilares, ordenarPorRelevancia,
      modoFoco, densidade, dataInicio, dataFim,
    } satisfies NotificacoesPreferences,
    setFiltro,
    setAgruparSimilares,
    setOrdenarPorRelevancia,
    setModoFoco,
    setDensidade,
    setDataInicio,
    setDataFim,
    resetPreferences,
  };
}
