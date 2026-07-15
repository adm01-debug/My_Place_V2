import { memo, useCallback } from 'react';
import {
  NotificacaoListItem,
  getNotificacaoIcon,
} from './NotificacaoListItem';
import {
  buildThreads as buildThreadsPure,
  NotificacaoThreadGroup,
} from './NotificacaoThreadGroup';
import type { Notificacao } from './types';

interface Props {
  grupos: Array<[string, Notificacao[]]>;
  agruparSimilares: boolean;
  threadsExpandidas: Set<string>;
  selecionadas: Set<string>;
  densidade: 'compact' | 'comfortable';
  busca: string;
  highlightedId: string | null;
  focusedId: string | null;
  onToggleThread: (key: string) => void;
  onSetSelecionadas: React.Dispatch<React.SetStateAction<Set<string>>>;
  onFocus: (id: string) => void;
  onToggleSelecao: (id: string) => void;
  onAction: (n: Notificacao) => void;
  onMarcarLida: (id: string) => void;
  onMarcarNaoLida: (id: string) => void;
  onExcluir: (id: string) => void;
  onAdiar: (ids: string[], min: number) => void;
  onTogglePin: (n: Notificacao) => void;
  onCopiar: (n: Notificacao) => void;
  onCompartilhar: (n: Notificacao) => void;
}

function NotificacaoGroupListImpl(props: Props) {
  const {
    grupos,
    agruparSimilares,
    threadsExpandidas,
    selecionadas,
    densidade,
    busca,
    highlightedId,
    focusedId,
    onToggleThread,
    onSetSelecionadas,
    onFocus,
    onToggleSelecao,
    onAction,
    onMarcarLida,
    onMarcarNaoLida,
    onExcluir,
    onAdiar,
    onTogglePin,
    onCopiar,
    onCompartilhar,
  } = props;

  const renderCard = useCallback(
    (n: Notificacao, opts?: { inThread?: boolean }) => (
      <NotificacaoListItem
        key={n.id}
        n={n}
        inThread={opts?.inThread}
        selecionada={selecionadas.has(n.id)}
        densidade={densidade}
        busca={busca}
        highlighted={highlightedId === n.id}
        focused={focusedId === n.id}
        onFocus={onFocus}
        onToggleSelecao={onToggleSelecao}
        onAction={onAction}
        onMarcarLida={onMarcarLida}
        onMarcarNaoLida={onMarcarNaoLida}
        onExcluir={onExcluir}
        onAdiar={onAdiar}
        onTogglePin={onTogglePin}
        onCopiar={onCopiar}
        onCompartilhar={onCompartilhar}
      />
    ),
    [
      selecionadas,
      densidade,
      busca,
      highlightedId,
      focusedId,
      onFocus,
      onToggleSelecao,
      onAction,
      onMarcarLida,
      onMarcarNaoLida,
      onExcluir,
      onAdiar,
      onTogglePin,
      onCopiar,
      onCompartilhar,
    ],
  );

  return (
    <>
      {grupos.map(([label, itens]) => {
        const threads = buildThreadsPure(label, itens, agruparSimilares);
        return (
          <div key={label} className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
              {label} · {itens.length}
            </h4>
            <div className="space-y-2">
              {threads.map((t) => {
                if (t.kind === 'single') return renderCard(t.notif);
                return (
                  <NotificacaoThreadGroup
                    key={t.key}
                    thread={t}
                    expandida={threadsExpandidas.has(t.key)}
                    selecionadas={selecionadas}
                    icon={getNotificacaoIcon(t.tipo)}
                    onToggle={onToggleThread}
                    onToggleSelecionadas={(ids, checked) => {
                      onSetSelecionadas((prev) => {
                        const next = new Set(prev);
                        if (checked) ids.forEach((id) => next.add(id));
                        else ids.forEach((id) => next.delete(id));
                        return next;
                      });
                    }}
                    renderChild={(n) => renderCard(n, { inThread: true })}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}

export const NotificacaoGroupList = memo(NotificacaoGroupListImpl);
