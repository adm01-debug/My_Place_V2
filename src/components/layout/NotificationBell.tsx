import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Info, CheckCircle2, AlertTriangle, XCircle, Pin } from 'lucide-react';
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
  fixada_em: string | null;
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

const MAX_ITEMS = 30;
const DESKTOP_KEY = 'bell_desktop_v1';

type BellFilter = 'todas' | 'nao_lidas' | 'fixadas';
const FILTER_KEY = 'bell_filter_v1';

const isBellFilter = (v: unknown): v is BellFilter =>
  v === 'todas' || v === 'nao_lidas' || v === 'fixadas';

const canUseDesktop = () =>
  typeof window !== 'undefined' && 'Notification' in window;


export default function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [open, setOpen] = useState(false);
  const [filtro, setFiltro] = useState<BellFilter>(() => {
    if (typeof window === 'undefined') return 'todas';
    const raw = localStorage.getItem(FILTER_KEY);
    return isBellFilter(raw) ? raw : 'todas';
  });

  useEffect(() => {
    try {
      localStorage.setItem(FILTER_KEY, filtro);
    } catch {
      /* quota — ignore */
    }
  }, [filtro]);

  const unreadCount = useMemo(
    () => notificacoes.filter((n) => !n.lida).length,
    [notificacoes]
  );

  const fixadasCount = useMemo(
    () => notificacoes.filter((n) => !!n.fixada_em).length,
    [notificacoes]
  );

  // Fixadas primeiro (por fixada_em desc), depois por created_at desc.
  const ordenadas = useMemo(() => {
    return [...notificacoes].sort((a, b) => {
      if (!!a.fixada_em !== !!b.fixada_em) return a.fixada_em ? -1 : 1;
      if (a.fixada_em && b.fixada_em) {
        return new Date(b.fixada_em).getTime() - new Date(a.fixada_em).getTime();
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [notificacoes]);

  const filtradas = useMemo(() => {
    if (filtro === 'nao_lidas') return ordenadas.filter((n) => !n.lida);
    if (filtro === 'fixadas') return ordenadas.filter((n) => !!n.fixada_em);
    return ordenadas;
  }, [ordenadas, filtro]);

  // Agrupamento temporal: Fixadas | Hoje | Ontem | Esta semana | Anteriores
  const grupos = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startYesterday = startToday - 86400000;
    const startWeek = startToday - 6 * 86400000;

    const buckets: Record<string, Notificacao[]> = {
      Fixadas: [],
      Hoje: [],
      Ontem: [],
      'Esta semana': [],
      Anteriores: [],
    };

    for (const n of filtradas) {
      if (n.fixada_em && filtro !== 'fixadas') {
        buckets.Fixadas.push(n);
        continue;
      }
      const t = new Date(n.created_at).getTime();
      if (t >= startToday) buckets.Hoje.push(n);
      else if (t >= startYesterday) buckets.Ontem.push(n);
      else if (t >= startWeek) buckets['Esta semana'].push(n);
      else buckets.Anteriores.push(n);
    }

    return (Object.entries(buckets) as [string, Notificacao[]][]).filter(
      ([, items]) => items.length > 0
    );
  }, [filtradas, filtro]);


  const fetchNotificacoes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('notificacoes')
      .select('id, titulo, mensagem, tipo, lida, link, created_at, fixada_em')
      .eq('user_id', user.id)
      .order('fixada_em', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(MAX_ITEMS);

    if (data) setNotificacoes(data as Notificacao[]);
  }, [user]);

  useEffect(() => {
    fetchNotificacoes();
  }, [fetchNotificacoes]);

  // Preferência de notificações desktop persistida
  const [desktopOn, setDesktopOn] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(DESKTOP_KEY) === '1';
  });

  const toggleDesktop = useCallback(async () => {
    if (!canUseDesktop()) return;
    if (!desktopOn) {
      const perm =
        Notification.permission === 'granted'
          ? 'granted'
          : await Notification.requestPermission();
      if (perm === 'granted') {
        setDesktopOn(true);
        localStorage.setItem(DESKTOP_KEY, '1');
      }
    } else {
      setDesktopOn(false);
      localStorage.setItem(DESKTOP_KEY, '0');
    }
  }, [desktopOn]);

  const showDesktop = useCallback(
    (n: Notificacao) => {
      if (!desktopOn || !canUseDesktop() || Notification.permission !== 'granted') return;
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') return;
      try {
        const notif = new Notification(n.titulo, {
          body: n.mensagem,
          icon: '/favicon.ico',
          tag: n.id,
          silent: false,
        });
        notif.onclick = () => {
          window.focus();
          navigate(n.link || `/notificacoes?focus=${n.id}`);
          notif.close();
        };
      } catch {
        /* alguns browsers exigem SW — ignora silenciosamente */
      }
    },
  const showDesktopRef = useRef(showDesktop);
  useEffect(() => {
    showDesktopRef.current = showDesktop;
  }, [showDesktop]);

  // Realtime: INSERT, UPDATE e DELETE — mantém o sino sincronizado
  // mesmo quando alterações acontecem na página /notificacoes ou em outro tab.
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('notificacoes-bell')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificacoes', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const nova = payload.new as Notificacao;
          setNotificacoes((prev) => {
            if (prev.some((n) => n.id === nova.id)) return prev;
            return [nova, ...prev].slice(0, MAX_ITEMS);
          });
          showDesktopRef.current(nova);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notificacoes', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const upd = payload.new as Notificacao;
          setNotificacoes((prev) => prev.map((n) => (n.id === upd.id ? { ...n, ...upd } : n)));
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'notificacoes', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const old = payload.old as { id: string };
          setNotificacoes((prev) => prev.filter((n) => n.id !== old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);


  const markAsRead = async (id: string) => {
    setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)));
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    const unreadIds = notificacoes.filter((n) => !n.lida).map((n) => n.id);
    if (unreadIds.length === 0) return;
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
    await supabase.from('notificacoes').update({ lida: true }).in('id', unreadIds);
  };

  const handleClick = (n: Notificacao) => {
    if (!n.lida) markAsRead(n.id);
    setOpen(false);
    if (n.link) {
      navigate(n.link);
    } else {
      navigate(`/notificacoes?focus=${n.id}`);
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
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full"
          aria-label={`Notificações (${unreadCount} não lidas)`}
        >
          <Bell
            className={`w-5 h-5 transition-transform ${
              unreadCount > 0 ? 'animate-[wiggle_0.5s_ease-in-out]' : ''
            }`}
          />
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
        <div
          role="tablist"
          aria-label="Filtro de notificações"
          className="flex items-center gap-1 px-2 py-1.5 border-b border-border/50 bg-muted/20"
        >
          {(
            [
              { id: 'todas', label: 'Todas', count: notificacoes.length },
              { id: 'nao_lidas', label: 'Não lidas', count: unreadCount },
              { id: 'fixadas', label: 'Fixadas', count: fixadasCount },
            ] as { id: BellFilter; label: string; count: number }[]
          ).map((tab) => {
            const ativo = filtro === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={ativo}
                onClick={() => setFiltro(tab.id)}
                className={`flex-1 text-[11px] font-medium py-1.5 px-2 rounded-md transition-colors flex items-center justify-center gap-1 ${
                  ativo
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`text-[10px] px-1 rounded ${
                      ativo ? 'bg-primary/15 text-primary' : 'bg-muted-foreground/15'
                    }`}
                  >
                    {tab.count > 99 ? '99+' : tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <ScrollArea className="max-h-80">
          {filtradas.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-muted-foreground">
              <Bell className="w-8 h-8 mb-2 opacity-40" />
              <p className="text-sm">
                {filtro === 'nao_lidas'
                  ? 'Nenhuma notificação não lida'
                  : filtro === 'fixadas'
                    ? 'Nenhuma notificação fixada'
                    : 'Nenhuma notificação'}
              </p>
            </div>
          ) : (
            grupos.map(([grupo, itens]) => (
              <div key={grupo}>
                <div className="sticky top-0 z-10 px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground bg-background/95 backdrop-blur border-b border-border/30">
                  {grupo}
                  <span className="ml-1.5 text-muted-foreground/60 normal-case tracking-normal">
                    ({itens.length})
                  </span>
                </div>
                {itens.map((n) => {
                  const Icon = tipoIcons[n.tipo] || Info;
                  const fixada = !!n.fixada_em;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 border-b border-border/20 ${
                        !n.lida ? 'bg-primary/5' : ''
                      } ${fixada ? 'border-l-2 border-l-primary/60' : ''}`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${tipoColors[n.tipo]}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`text-xs font-medium truncate flex items-center gap-1 ${
                              !n.lida ? 'text-foreground' : 'text-muted-foreground'
                            }`}
                          >
                            {fixada && (
                              <Pin
                                className="w-3 h-3 text-primary shrink-0 fill-primary/20"
                                aria-label="Fixada"
                              />
                            )}
                            <span className="truncate">{n.titulo}</span>
                          </p>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatTime(n.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                          {n.mensagem}
                        </p>
                      </div>
                      {!n.lida && (
                        <span className="w-2 h-2 mt-1.5 rounded-full bg-primary shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
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
