import { Bell, Check, CheckCheck, Trash2, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotificacoes, Notificacao } from '@/hooks/useNotificacoes';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

const tipoColors: Record<string, string> = {
  info: 'bg-primary/10 text-primary',
  success: 'bg-finance/10 text-finance',
  warning: 'bg-projects/10 text-projects',
  alert: 'bg-destructive/10 text-destructive',
  system: 'bg-muted text-muted-foreground',
};

const tipoIcons: Record<string, string> = {
  info: '🔔',
  success: '✅',
  warning: '⚠️',
  alert: '🚨',
  system: '⚙️',
};

interface NotificationItemProps {
  notificacao: Notificacao;
  onMarkRead: (id: string) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onNavigate: (rota: string) => void;
}

function NotificationItem({ 
  notificacao, 
  onMarkRead, 
  onArchive,
  onNavigate 
}: NotificationItemProps) {
  const timeAgo = formatDistanceToNow(new Date(notificacao.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  const handleClick = async () => {
    if (!notificacao.lida) {
      await onMarkRead(notificacao.id);
    }
    if (notificacao.link) {
      onNavigate(notificacao.link);
    }
  };

  return (
    <Card 
      className={`p-3 cursor-pointer transition-all hover:shadow-md ${
        !notificacao.lida ? 'border-l-4 border-l-primary bg-primary/5' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg ${tipoColors[notificacao.tipo]}`}>
          {tipoIcons[notificacao.tipo] || '🔔'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className={`font-medium text-sm ${!notificacao.lida ? 'text-foreground' : 'text-muted-foreground'}`}>
              {notificacao.titulo}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onArchive(notificacao.id);
              }}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {notificacao.mensagem}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
            {notificacao.link && (
              <Badge variant="outline" className="text-[10px] h-4">
                Ver detalhes
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function NotificationsPanel() {
  const navigate = useNavigate();
  const { 
    notificacoes, 
    unreadCount, 
    isLoading,
    marcarComoLida,
    marcarTodasComoLidas,
    arquivarNotificacao,
  } = useNotificacoes();

  const handleMarkRead = async (id: string) => {
    await marcarComoLida(id);
  };

  const handleArchive = async (id: string) => {
    await arquivarNotificacao(id);
  };

  const handleMarkAllRead = async () => {
    await marcarTodasComoLidas();
  };

  const handleNavigate = (rota: string) => {
    navigate(rota);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificações
              {unreadCount > 0 && (
                <Badge variant="secondary">{unreadCount} novas</Badge>
              )}
            </SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllRead}
                className="text-xs"
              >
                <CheckCheck className="w-4 h-4 mr-1" />
                Marcar todas
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-4 space-y-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : notificacoes.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhuma notificação</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Suas notificações aparecerão aqui
                </p>
              </div>
            ) : (
              notificacoes.map((notificacao) => (
                <NotificationItem
                  key={notificacao.id}
                  notificacao={notificacao}
                  onMarkRead={handleMarkRead}
                  onArchive={handleArchive}
                  onNavigate={handleNavigate}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
