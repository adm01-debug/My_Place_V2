import { useState, useCallback } from 'react';
import { Notificacao } from '@/components/notificacoes/types';

interface UseNotificacoesSelecaoProps {
  filtradas: Notificacao[];
}

export function useNotificacoesSelecao({ filtradas }: UseNotificacoesSelecaoProps) {
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  const toggleSelecao = useCallback((id: string, shiftKey?: boolean) => {
    setSelecionadas(prev => {
      const newSet = new Set(prev);
      
      if (shiftKey && lastSelectedId) {
        const ids = filtradas.map(n => n.id);
        const currentIndex = ids.indexOf(id);
        const lastIndex = ids.indexOf(lastSelectedId);
        
        if (currentIndex !== -1 && lastIndex !== -1) {
          const start = Math.min(currentIndex, lastIndex);
          const end = Math.max(currentIndex, lastIndex);
          const rangeIds = ids.slice(start, end + 1);
          
          // Se o item clicado estava sendo selecionado, seleciona o range
          // Se estava sendo desselecionado, remove o range
          const isSelecting = !prev.has(id);
          rangeIds.forEach(rangeId => {
            if (isSelecting) newSet.add(rangeId);
            else newSet.delete(rangeId);
          });
          
          setLastSelectedId(id);
          return newSet;
        }
      }

      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      
      setLastSelectedId(id);
      return newSet;
    });
  }, [filtradas, lastSelectedId]);

  const selecionarVisiveis = useCallback((checked: boolean) => {
    if (checked) {
      setSelecionadas(new Set(filtradas.map(n => n.id)));
    } else {
      setSelecionadas(new Set());
    }
  }, [filtradas]);

  const limparSelecao = useCallback(() => {
    setSelecionadas(new Set());
    setLastSelectedId(null);
  }, []);

  const todasSelecionadasVisiveis = filtradas.length > 0 && filtradas.every(n => selecionadas.has(n.id));

  return {
    selecionadas,
    setSelecionadas,
    toggleSelecao,
    selecionarVisiveis,
    limparSelecao,
    todasSelecionadasVisiveis
  };
}
