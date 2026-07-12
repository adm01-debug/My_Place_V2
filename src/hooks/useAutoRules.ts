import { useState, useEffect, useCallback } from 'react';

export type RuleAction = 'marcar_lida' | 'fixar' | 'excluir';
export type RuleField = 'titulo' | 'mensagem' | 'tipo' | 'qualquer';

export interface AutoRule {
  id: string;
  padrao: string;           // termo (case-insensitive) ou tipo exato quando campo='tipo'
  campo: RuleField;
  acao: RuleAction;
  ativa: boolean;
  criado_em: string;
}

const STORAGE_KEY = 'notif_auto_rules_v1';

const safeParse = (raw: string | null): AutoRule[] => {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((r) => r && typeof r.id === 'string') : [];
  } catch {
    return [];
  }
};

export function useAutoRules() {
  const [rules, setRules] = useState<AutoRule[]>(() =>
    typeof window === 'undefined' ? [] : safeParse(localStorage.getItem(STORAGE_KEY))
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
    } catch {
      /* quota exceeded — silencioso */
    }
  }, [rules]);

  const addRule = useCallback((rule: Omit<AutoRule, 'id' | 'criado_em'>) => {
    setRules((prev) => [
      ...prev,
      { ...rule, id: crypto.randomUUID(), criado_em: new Date().toISOString() },
    ]);
  }, []);

  const removeRule = useCallback((id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const toggleRule = useCallback((id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, ativa: !r.ativa } : r)));
  }, []);

  /**
   * Retorna a PRIMEIRA regra ativa que casa com a notificação (ordem de criação).
   * `excluir` tem precedência implícita apenas se for a primeira a bater.
   */
  const matchRule = useCallback(
    (n: { titulo: string; mensagem: string; tipo: string }): AutoRule | null => {
      for (const r of rules) {
        if (!r.ativa) continue;
        const padrao = r.padrao.trim().toLowerCase();
        if (!padrao) continue;
        const alvo = (
          r.campo === 'titulo'
            ? n.titulo
            : r.campo === 'mensagem'
              ? n.mensagem
              : r.campo === 'tipo'
                ? n.tipo
                : `${n.titulo} ${n.mensagem} ${n.tipo}`
        ).toLowerCase();
        const hit = r.campo === 'tipo' ? alvo === padrao : alvo.includes(padrao);
        if (hit) return r;
      }
      return null;
    },
    [rules]
  );

  return { rules, addRule, removeRule, toggleRule, matchRule };
}
