import { useEffect, type RefObject } from 'react';
import type { Notificacao } from '@/components/notificacoes/types';

interface Params {
  visibleIds: string[];
  focusedId: string | null;
  setFocusedId: (id: string | null) => void;
  notificacoes: Notificacao[];
  selecionadas: Set<string>;
  setSelecionadas: (s: Set<string>) => void;
  helpOpen: boolean;
  setHelpOpen: (updater: (v: boolean) => boolean) => void;
  searchInputRef: RefObject<HTMLInputElement | null>;
  handleAction: (n: Notificacao) => void;
  toggleSelecao: (id: string) => void;
  marcarComoLida: (id: string) => void;
  marcarComoNaoLida: (id: string) => void;
  excluirNotificacao: (id: string) => void;
  marcarTodasComoLidas: () => void;
}

const isTypingTarget = (el: EventTarget | null): boolean => {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
};

/**
 * Atalhos globais da página de Notificações:
 * `/` busca, `?` ajuda, `j/k` navegação, Enter abrir, `x` selecionar,
 * `e` marcar lida, `u` alternar lido, `#` excluir, `Shift+A` marcar todas, `Esc` limpar.
 */
export function useNotificacaoKeyboardShortcuts(params: Params): void {
  const {
    visibleIds,
    focusedId,
    setFocusedId,
    notificacoes,
    selecionadas,
    setSelecionadas,
    helpOpen,
    setHelpOpen,
    searchInputRef,
    handleAction,
    toggleSelecao,
    marcarComoLida,
    marcarComoNaoLida,
    excluirNotificacao,
    marcarTodasComoLidas,
  } = params;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === '/' && !isTypingTarget(e.target)) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (e.key === '?' && !isTypingTarget(e.target)) {
        e.preventDefault();
        setHelpOpen((v) => !v);
        return;
      }
      if (e.key === 'Escape') {
        if (helpOpen) return;
        if (selecionadas.size > 0) {
          setSelecionadas(new Set());
          return;
        }
        if (focusedId) {
          setFocusedId(null);
          return;
        }
      }
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'j' || e.key === 'k') {
        e.preventDefault();
        if (visibleIds.length === 0) return;
        const idx = focusedId ? visibleIds.indexOf(focusedId) : -1;
        const nextIdx =
          e.key === 'j'
            ? Math.min(visibleIds.length - 1, idx + 1)
            : Math.max(0, idx <= 0 ? 0 : idx - 1);
        const nextId = visibleIds[nextIdx];
        setFocusedId(nextId);
        window.requestAnimationFrame(() => {
          const el = document.querySelector<HTMLElement>(`[data-notif-id="${nextId}"]`);
          el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
        return;
      }

      if (!focusedId) return;
      const alvo = notificacoes.find((n) => n.id === focusedId);
      if (!alvo) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        handleAction(alvo);
      } else if (e.key === 'x') {
        e.preventDefault();
        toggleSelecao(focusedId);
      } else if (e.key === 'e') {
        e.preventDefault();
        if (!alvo.lida) marcarComoLida(focusedId);
      } else if (e.key === 'u') {
        e.preventDefault();
        if (alvo.lida) marcarComoNaoLida(focusedId);
        else marcarComoLida(focusedId);
      } else if (e.key === '#') {
        e.preventDefault();
        excluirNotificacao(focusedId);
      } else if (e.key === 'A' && e.shiftKey) {
        e.preventDefault();
        marcarTodasComoLidas();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [
    visibleIds,
    focusedId,
    notificacoes,
    selecionadas,
    helpOpen,
    setFocusedId,
    setSelecionadas,
    setHelpOpen,
    searchInputRef,
    handleAction,
    toggleSelecao,
    marcarComoLida,
    marcarComoNaoLida,
    excluirNotificacao,
    marcarTodasComoLidas,
  ]);
}
