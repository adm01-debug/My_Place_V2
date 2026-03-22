import { ReactNode } from 'react';
import { Bell, User, Sparkles, X, Check, CheckCheck, Search, ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { GlobalSearchButton } from '@/components/portal/GlobalSearch';
import { useNavigateBack } from '@/hooks/useNavigateBack';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface HeaderProps {
  title?: string;
  showBack?: boolean;
  alertCount?: number;
  action?: ReactNode;
}

export function Header({ title = 'Portal do Colaborador', showBack = false, action }: HeaderProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotification } = useNotificationContext();
  const navigate = useNavigate();
  const goBack = useNavigateBack();

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-finance/10 text-finance';
      case 'warning': return 'bg-projects/10 text-projects';
      case 'alert': return 'bg-destructive/10 text-destructive';
      default: return 'bg-primary/10 text-primary';
    }
  };

  const handleNotificationClick = (notif: { id: string; action?: { route: string } }) => {
    markAsRead(notif.id);
    if (notif.action?.route) {
      navigate(notif.action.route);
    }
  };

  return (
    <header className="sticky top-0 z-40 safe-area-pt" role="banner">
      <div className="glass-subtle border-b border-border/50">
        <div className="flex items-center justify-between max-w-lg lg:max-w-3xl xl:max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {showBack ? (
              <button
                type="button"
                onClick={goBack}
                aria-label="Voltar para a página anterior"
                className="w-9 h-9 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 motion-reduce:active:scale-100"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="relative">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                  <span className="text-primary-foreground font-bold text-sm">PB</span>
                </div>
                <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-projects animate-bounce-subtle" />
              </div>
            )}
            <div>
              <h1 className="font-display font-bold text-foreground text-lg leading-tight">{title}</h1>
              {!showBack && (
                <p className="text-xs text-muted-foreground">Promo Brindes</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            {action}
            <GlobalSearchButton />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover-scale">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium animate-bounce-subtle">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-80 p-0 mr-2" 
                align="end"
                sideOffset={8}
              >
                <div className="flex items-center justify-between p-3 border-b border-border">
                  <h3 className="font-semibold text-foreground">Notificações</h3>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={markAllAsRead}
                    >
                      <CheckCheck className="w-3 h-3" />
                      Marcar todas
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-[300px]">
                  {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <Bell className="w-8 h-8 mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma notificação</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={cn(
                            "p-3 hover:bg-muted/50 transition-colors cursor-pointer relative group",
                            !notif.read && "bg-primary/5"
                          )}
                          onClick={() => handleNotificationClick(notif)}
                        >
                          <div className="flex gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                              getTypeColor(notif.type)
                            )}>
                              <Bell className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={cn(
                                  "text-sm font-medium truncate",
                                  !notif.read && "text-foreground",
                                  notif.read && "text-muted-foreground"
                                )}>
                                  {notif.title}
                                </p>
                                {!notif.read && (
                                  <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                {notif.message}
                              </p>
                              <p className="text-xs text-muted-foreground/70 mt-1">
                                {formatDistanceToNow(notif.timestamp, { addSuffix: true, locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              clearNotification(notif.id);
                            }}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                          >
                            <X className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                <div className="p-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    asChild
                  >
                    <Link to="/comunicados">Ver todos os comunicados</Link>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" className="hover-scale" asChild>
              <Link to="/perfil">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-hr flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
