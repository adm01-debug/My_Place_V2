import { memo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Flame,
  Info,
  Mail,
  MailOpen,
  Pin,
  PinOff,
  Share2,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AnexoPreview } from './AnexoPreview';
import { LinkPreview } from './LinkPreview';
import { SwipeableRow } from './SwipeableRow';
import { HighlightText } from './HighlightText';
import { relevanceScore } from './relevance';
import type { Notificacao } from './types';

export function getNotificacaoIcon(tipo: Notificacao['tipo']) {
  switch (tipo) {
    case 'sucesso':
      return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
    case 'erro':
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    case 'alerta':
      return <AlertCircle className="w-5 h-5 text-amber-500" />;
    default:
      return <Info className="w-5 h-5 text-blue-500" />;
  }
}

export interface NotificacaoListItemProps {
  n: Notificacao;
  inThread?: boolean;
  selecionada: boolean;
  densidade: 'compact' | 'comfortable';
  busca: string;
  highlighted: boolean;
  focused: boolean;
  onFocus: (id: string) => void;
  onToggleSelecao: (id: string) => void;
  onAction: (n: Notificacao) => void;
  onMarcarLida: (id: string) => void;
  onMarcarNaoLida: (id: string) => void;
  onExcluir: (id: string) => void;
  onAdiar: (ids: string[], minutos: number) => void;
  onTogglePin: (n: Notificacao) => void;
  onCopiar: (n: Notificacao) => void;
  onCompartilhar: (n: Notificacao) => void;
}

function NotificacaoListItemImpl({
  n,
  inThread,
  selecionada,
  densidade,
  busca,
  highlighted,
  focused,
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
}: NotificacaoListItemProps) {
  const isStorageLink =
    !!n.link && (n.link.startsWith('http') || n.link.startsWith('/storage/') || n.link.includes('/object/public/'));
  const isExternalLink =
    !!n.link && n.link.startsWith('http') && !n.link.includes('/object/public/') && !n.link.includes('/storage/');

  return (
    <SwipeableRow
      onSwipeRight={n.lida ? undefined : () => onMarcarLida(n.id)}
      onSwipeLeft={() => onExcluir(n.id)}
      rightLabel={n.lida ? 'Já lida' : 'Marcar lida'}
    >
      <Card
        data-notif-id={n.id}
        className={`group border-border/50 transition-all hover:shadow-md ${
          !n.lida ? 'bg-primary/5 border-primary/20' : 'bg-card'
        } ${selecionada ? 'ring-2 ring-primary/40' : ''} ${
          inThread ? 'ml-6 border-l-2 border-l-primary/30' : ''
        } ${highlighted ? 'ring-2 ring-primary shadow-lg animate-pulse' : ''} ${
          focused ? 'ring-2 ring-primary/60' : ''
        }`}
        onMouseEnter={() => onFocus(n.id)}
      >
        <CardContent className={densidade === 'compact' ? 'p-2.5' : 'p-4'}>
          <div className="flex gap-3">
            <div className="pt-1">
              <Checkbox
                checked={selecionada}
                onCheckedChange={() => onToggleSelecao(n.id)}
                aria-label="Selecionar notificação"
              />
            </div>
            <button
              type="button"
              onClick={() => onAction(n)}
              className="flex-1 min-w-0 text-left"
            >
              <div className="flex gap-3">
                <div className="shrink-0 mt-1">{getNotificacaoIcon(n.tipo)}</div>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <h3
                        className={`text-sm font-semibold truncate ${
                          !n.lida ? 'text-primary' : 'text-foreground'
                        }`}
                      >
                        <HighlightText text={n.titulo} query={busca} />
                      </h3>
                      {relevanceScore(n) >= 130 && (
                        <Badge
                          variant="destructive"
                          className="shrink-0 h-4 px-1.5 text-[9px] font-semibold uppercase tracking-wide gap-0.5"
                          title="Item de alta prioridade segundo o score de relevância"
                        >
                          <Flame className="w-2.5 h-2.5" />
                          Prioritária
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(n.created_at), 'dd MMM, HH:mm', { locale: ptBR })}
                    </span>
                  </div>
                  <p
                    className={`text-xs text-muted-foreground leading-relaxed ${
                      densidade === 'compact' ? 'line-clamp-1' : 'line-clamp-2'
                    }`}
                  >
                    <HighlightText text={n.mensagem} query={busca} />
                  </p>
                  {n.link && (
                    <span className="text-[10px] font-medium text-primary flex items-center gap-1 pt-1">
                      Acessar <ExternalLink className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>
              </div>
            </button>
            {isStorageLink && (
              <div className="pl-11 -mt-1">
                <AnexoPreview url={n.link!} titulo={n.titulo} />
              </div>
            )}
            {isExternalLink && (
              <div className="pl-11">
                <LinkPreview url={n.link!} />
              </div>
            )}
            <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary"
                    onClick={(e) => e.stopPropagation()}
                    aria-label="Adiar notificação"
                  >
                    <Clock className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuLabel>Adiar por…</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onAdiar([n.id], 30)}>30 minutos</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAdiar([n.id], 60)}>1 hora</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAdiar([n.id], 60 * 4)}>4 horas</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAdiar([n.id], 60 * 24)}>Amanhã</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAdiar([n.id], 60 * 24 * 7)}>Próxima semana</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 ${
                  n.fixada_em
                    ? 'text-amber-500 hover:text-amber-600'
                    : 'text-muted-foreground hover:text-amber-500'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin(n);
                }}
                aria-label={n.fixada_em ? 'Desafixar notificação' : 'Fixar notificação'}
                title={n.fixada_em ? 'Desafixar do topo' : 'Fixar no topo'}
              >
                {n.fixada_em ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  if (n.lida) onMarcarNaoLida(n.id);
                  else onMarcarLida(n.id);
                }}
                aria-label={n.lida ? 'Marcar como não lida' : 'Marcar como lida'}
                title={n.lida ? 'Marcar como não lida (u)' : 'Marcar como lida (e)'}
              >
                {n.lida ? <Mail className="w-3.5 h-3.5" /> : <MailOpen className="w-3.5 h-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onCopiar(n);
                }}
                aria-label="Copiar notificação"
                title="Copiar título, mensagem e link"
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onCompartilhar(n);
                }}
                aria-label="Compartilhar notificação"
                title="Compartilhar (usa Web Share API quando disponível)"
              >
                <Share2 className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onExcluir(n.id);
                }}
                aria-label="Excluir notificação"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </SwipeableRow>
  );
}

export const NotificacaoListItem = memo(NotificacaoListItemImpl);
