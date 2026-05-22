import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Info, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'sucesso' | 'alerta' | 'erro';
  lida: boolean;
  link: string | null;
  created_at: string;
}

const tipoIcons = {
  info: Info,
  sucesso: CheckCircle2,
  alerta: AlertTriangle,
  erro: XCircle,
};

const tipoColors = {
  info: 'text-blue-400',
  sucesso: 'text-emerald-400',
  alerta: 'text-amber-400',
  erro: 'text-red-400',
};

export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [open, setOpen] = useState(false);

  const unreadCount = notificacoes.filter(n => !n.lida).length;

  const fetchNotificacoes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notificacoes')
      .select('id, titulo, mensagem, tipo, lida, link, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    if (data) setNotificacoes(data as Notificacao[]);
  }, [user]);

  useEffect(() => {
    fetchNotificacoes();
  }, [fetchNotificacoes]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notificacoes-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as Notificacao;
          setNotificacoes(prev => [newNotif, ...prev].slice(0, 30));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const unreadIds = notificacoes.filter(n => !n.lida).map(n => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from('notificacoes').update({ lida: true }).in('id', unreadIds);
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
  };

  const handleClick = (n: Notificacao) => {
    if (!n.lida) markAsRead(n.id);
    if (n.link) {
      setOpen(false);
      navigate(n.link);
    }
  };

  const formatTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'agora';
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-full" aria-label={`Notificações (${unreadCount} não lidas)`}>
          <Bell className={`w-5 h-5 transition-transform ${unreadCount > 0 ? 'animate-[wiggle_0.5s_ease-in-out]' : ''}`} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground animate-in zoom-in-50 duration-200">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
          <h3 className="text-sm font-semibold text-foreground">Notificações</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-7 gap-1" onClick={markAllAsRead}>
              <CheckCheck className="w-3.5 h-3.5" />
              Marcar todas
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-80">
          {notificacoes.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <Bell className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">Nenhuma notificação</p>
            </div>
          ) : (
            notificacoes.map((n) => {
              const Icon = tipoIcons[n.tipo] || Info;
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 border-b border-border/20 ${
                    !n.lida ? 'bg-primary/5' : ''
                  }`}
                >
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${tipoColors[n.tipo]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-xs font-medium truncate ${!n.lida ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {n.titulo}
                      </p>
                      <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(n.created_at)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.mensagem}</p>
                  </div>
                  {!n.lida && <span className="w-2 h-2 mt-1.5 rounded-full bg-primary shrink-0" />}
                </button>
              );
            })
          )}
        </ScrollArea>
        <div className="p-2 border-t border-border/50">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs font-medium text-primary hover:text-primary hover:bg-primary/5"
            onClick={() => {
              setOpen(false);
              navigate('/notificacoes');
            }}
          >
            Ver todas as notificações
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
