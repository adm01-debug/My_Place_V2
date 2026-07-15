import { memo, type ReactNode } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import type { Notificacao } from './types';

export type ThreadItem =
  | { kind: 'single'; notif: Notificacao }
  | { kind: 'thread'; key: string; titulo: string; tipo: Notificacao['tipo']; items: Notificacao[] };

/**
 * Agrupa notificações com título idêntico dentro do mesmo grupo (≥3 itens vira thread).
 * Função pura — testável isoladamente.
 */
export function buildThreads(
  label: string,
  itens: Notificacao[],
  agrupar: boolean,
): ThreadItem[] {
  if (!agrupar) return itens.map((n) => ({ kind: 'single' as const, notif: n }));
  const byTitle = new Map<string, Notificacao[]>();
  for (const n of itens) {
    const k = n.titulo.trim().toLowerCase();
    if (!byTitle.has(k)) byTitle.set(k, []);
    byTitle.get(k)!.push(n);
  }
  const result: ThreadItem[] = [];
  const seen = new Set<string>();
  for (const n of itens) {
    const k = n.titulo.trim().toLowerCase();
    if (seen.has(k)) continue;
    const bucket = byTitle.get(k)!;
    if (bucket.length >= 3) {
      seen.add(k);
      result.push({
        kind: 'thread',
        key: `${label}::${k}`,
        titulo: bucket[0].titulo,
        tipo: bucket[0].tipo,
        items: bucket,
      });
    } else {
      result.push({ kind: 'single', notif: n });
    }
  }
  return result;
}

interface NotificacaoThreadGroupProps {
  thread: Extract<ThreadItem, { kind: 'thread' }>;
  expandida: boolean;
  selecionadas: Set<string>;
  icon: ReactNode;
  onToggle: (key: string) => void;
  onToggleSelecionadas: (ids: string[], checked: boolean) => void;
  renderChild: (n: Notificacao) => ReactNode;
}

function NotificacaoThreadGroupImpl({
  thread,
  expandida,
  selecionadas,
  icon,
  onToggle,
  onToggleSelecionadas,
  renderChild,
}: NotificacaoThreadGroupProps) {
  const naoLidas = thread.items.filter((n) => !n.lida).length;
  const ids = thread.items.map((n) => n.id);
  const todasSel = ids.every((id) => selecionadas.has(id));

  return (
    <div className="space-y-1">
      <Card
        className={`border-border/50 transition-all hover:shadow-md cursor-pointer ${
          naoLidas > 0 ? 'bg-primary/5 border-primary/20' : 'bg-card'
        }`}
        onClick={() => onToggle(thread.key)}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={todasSel}
                onCheckedChange={(checked) => onToggleSelecionadas(ids, Boolean(checked))}
                aria-label="Selecionar thread"
              />
            </div>
            <div className="shrink-0">{icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3
                  className={`text-sm font-semibold truncate ${
                    naoLidas > 0 ? 'text-primary' : 'text-foreground'
                  }`}
                >
                  {thread.titulo}
                </h3>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {thread.items.length}
                </Badge>
                {naoLidas > 0 && (
                  <Badge className="text-[10px] shrink-0 bg-primary/20 text-primary hover:bg-primary/20">
                    {naoLidas} nova(s)
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                Última:{' '}
                {format(new Date(thread.items[0].created_at), 'dd MMM, HH:mm', { locale: ptBR })}
              </p>
            </div>
            {expandida ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </CardContent>
      </Card>
      {expandida && <div className="space-y-2">{thread.items.map((n) => renderChild(n))}</div>}
    </div>
  );
}

export const NotificacaoThreadGroup = memo(NotificacaoThreadGroupImpl);
