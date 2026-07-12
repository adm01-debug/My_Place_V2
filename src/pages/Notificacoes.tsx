import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
  Trash2,
  Calendar,
  ExternalLink,
  Search,
  CheckCheck,
  X,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { PullToRefresh } from '@/components/portal/PullToRefresh';
import { toast } from 'sonner';

interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: 'sucesso' | 'erro' | 'info' | 'alerta';
  lida: boolean;
  link: string | null;
  created_at: string;
}

type Filtro = 'todas' | 'nao_lidas' | 'sucesso' | 'erro' | 'alerta' | 'info';

const groupLabel = (date: Date): string => {
  if (isToday(date)) return 'Hoje';
  if (isYesterday(date)) return 'Ontem';
  if (isThisWeek(date, { locale: ptBR })) return 'Esta semana';
  return 'Anteriores';
};

export default function Notificacoes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [agruparSimilares, setAgruparSimilares] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('notif_agrupar_similares') !== '0';
  });
  const [threadsExpandidas, setThreadsExpandidas] = useState<Set<string>>(new Set());

  useEffect(() => {
    localStorage.setItem('notif_agrupar_similares', agruparSimilares ? '1' : '0');
  }, [agruparSimilares]);

  const toggleThread = (key: string) => {
    setThreadsExpandidas((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const fetchNotificacoes = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('user_id', user.id)
        .or('adiada_ate.is.null,adiada_ate.lte.' + new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      setNotificacoes((data || []) as Notificacao[]);
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      toast.error('Não foi possível carregar as notificações');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchNotificacoes();
  }, [fetchNotificacoes]);

  // Realtime: novas notificações entram no topo automaticamente
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`notif-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notificacoes', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setNotificacoes((prev) => [payload.new as Notificacao, ...prev]);
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Deep-linking: /notificacoes?focus=<id> — rola até o card, destaca, marca como lido
  // e expande a thread se o item estiver dentro de uma.
  useEffect(() => {
    const focusId = searchParams.get('focus');
    if (!focusId || loading || notificacoes.length === 0) return;

    const alvo = notificacoes.find((n) => n.id === focusId);
    if (!alvo) return;

    // Expande a thread que contém o item, se houver
    if (agruparSimilares) {
      const label = groupLabel(new Date(alvo.created_at));
      const key = `${label}::${alvo.titulo.trim().toLowerCase()}`;
      const irmaos = notificacoes.filter(
        (n) =>
          groupLabel(new Date(n.created_at)) === label &&
          n.titulo.trim().toLowerCase() === alvo.titulo.trim().toLowerCase(),
      );
      if (irmaos.length >= 3) {
        setThreadsExpandidas((prev) => {
          if (prev.has(key)) return prev;
          const next = new Set(prev);
          next.add(key);
          return next;
        });
      }
    }

    // Espera o DOM refletir a expansão antes de rolar
    const t = window.setTimeout(() => {
      const el = document.querySelector<HTMLElement>(`[data-notif-id="${focusId}"]`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedId(focusId);
        if (!alvo.lida) marcarComoLida(focusId);
        window.setTimeout(() => setHighlightedId(null), 2600);
      }
      // limpa o parâmetro para não repetir o efeito
      const next = new URLSearchParams(searchParams);
      next.delete('focus');
      setSearchParams(next, { replace: true });
    }, 120);

    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, notificacoes, loading, agruparSimilares]);

  const marcarComoLida = async (id: string) => {
    try {
      const { error } = await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
      if (error) throw error;
      setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)));
    } catch (error) {
      console.error('Erro ao marcar como lida:', error);
    }
  };

  const marcarTodasComoLidas = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('user_id', user.id)
        .eq('lida', false);
      if (error) throw error;
      setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })));
      toast.success('Todas as notificações foram marcadas como lidas');
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast.error('Erro ao atualizar notificações');
    }
  };

  const excluirNotificacao = async (id: string) => {
    try {
      const { error } = await supabase.from('notificacoes').delete().eq('id', id);
      if (error) throw error;
      setNotificacoes((prev) => prev.filter((n) => n.id !== id));
      setSelecionadas((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success('Notificação removida');
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
      toast.error('Erro ao excluir notificação');
    }
  };

  const adiarNotificacoes = async (ids: string[], minutos: number) => {
    if (ids.length === 0) return;
    const ate = new Date(Date.now() + minutos * 60_000).toISOString();
    try {
      const { error } = await supabase.rpc('fn_adiar_notificacoes', {
        _ids: ids,
        _ate: ate,
      });
      if (error) throw error;
      setNotificacoes((prev) => prev.filter((n) => !ids.includes(n.id)));
      setSelecionadas((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      const label =
        minutos < 60
          ? `${minutos} min`
          : minutos < 1440
            ? `${Math.round(minutos / 60)}h`
            : `${Math.round(minutos / 1440)}d`;
      toast.success(`Adiada${ids.length > 1 ? 's' : ''} por ${label}`);
    } catch (error) {
      console.error('Erro ao adiar notificação:', error);
      toast.error('Não foi possível adiar');
    }
  };

  const acaoEmMassa = async (acao: 'ler' | 'excluir') => {
    const ids = Array.from(selecionadas);
    if (ids.length === 0) return;
    try {
      if (acao === 'ler') {
        const { error } = await supabase.from('notificacoes').update({ lida: true }).in('id', ids);
        if (error) throw error;
        setNotificacoes((prev) => prev.map((n) => (selecionadas.has(n.id) ? { ...n, lida: true } : n)));
        toast.success(`${ids.length} marcada(s) como lida(s)`);
      } else {
        const { error } = await supabase.from('notificacoes').delete().in('id', ids);
        if (error) throw error;
        setNotificacoes((prev) => prev.filter((n) => !selecionadas.has(n.id)));
        toast.success(`${ids.length} removida(s)`);
      }
      setSelecionadas(new Set());
    } catch (error) {
      console.error('Erro na ação em massa:', error);
      toast.error('Não foi possível concluir a ação');
    }
  };

  const toggleSelecao = (id: string) => {
    setSelecionadas((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const getIcon = (tipo: string) => {
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
  };

  const handleAction = (n: Notificacao) => {
    if (!n.lida) marcarComoLida(n.id);
    if (n.link) {
      if (n.link.startsWith('/')) navigate(n.link);
      else window.open(n.link, '_blank');
    }
  };

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return notificacoes.filter((n) => {
      if (filtro === 'nao_lidas' && n.lida) return false;
      if (['sucesso', 'erro', 'alerta', 'info'].includes(filtro) && n.tipo !== filtro) return false;
      if (termo && !`${n.titulo} ${n.mensagem}`.toLowerCase().includes(termo)) return false;
      return true;
    });
  }, [notificacoes, filtro, busca]);

  const grupos = useMemo(() => {
    const map = new Map<string, Notificacao[]>();
    for (const n of filtradas) {
      const label = groupLabel(new Date(n.created_at));
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(n);
    }
    return Array.from(map.entries());
  }, [filtradas]);

  // Threading: agrupa notificações com título idêntico dentro do mesmo grupo (≥3)
  type ThreadItem =
    | { kind: 'single'; notif: Notificacao }
    | { kind: 'thread'; key: string; titulo: string; tipo: Notificacao['tipo']; items: Notificacao[] };

  const buildThreads = useCallback(
    (label: string, itens: Notificacao[]): ThreadItem[] => {
      if (!agruparSimilares) return itens.map((n) => ({ kind: 'single' as const, notif: n }));
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
    },
    [agruparSimilares],
  );

  const naoLidas = notificacoes.filter((n) => !n.lida).length;
  const todasSelecionadasVisiveis =
    filtradas.length > 0 && filtradas.every((n) => selecionadas.has(n.id));

  return (
    <PullToRefresh onRefresh={fetchNotificacoes}>
      <div className="w-full max-w-4xl mx-auto p-4 space-y-6 pb-24">
        <ModuleHeader
          title="Notificações"
          description="Fique por dentro das novidades e atualizações"
          icon={Bell}
          actions={
            <div className="flex gap-2">
              <Button
                variant={agruparSimilares ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAgruparSimilares((v) => !v)}
                title={agruparSimilares ? 'Desagrupar similares' : 'Agrupar similares'}
                aria-pressed={agruparSimilares}
              >
                <Layers className="w-4 h-4 mr-1" />
                {agruparSimilares ? 'Agrupadas' : 'Individuais'}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/notificacoes/historico')}>
                Histórico
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/notificacoes/preferencias')}
              >
                Preferências
              </Button>
            </div>
          }
        />

        {/* Barra de busca + filtros */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por título ou mensagem..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
            <TabsList className="w-full flex-wrap h-auto">
              <TabsTrigger value="todas" className="flex-1 min-w-[80px]">
                Todas <Badge variant="secondary" className="ml-2">{notificacoes.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="nao_lidas" className="flex-1 min-w-[80px]">
                Não lidas <Badge variant="secondary" className="ml-2">{naoLidas}</Badge>
              </TabsTrigger>
              <TabsTrigger value="erro" className="flex-1 min-w-[80px]">Erros</TabsTrigger>
              <TabsTrigger value="alerta" className="flex-1 min-w-[80px]">Alertas</TabsTrigger>
              <TabsTrigger value="sucesso" className="flex-1 min-w-[80px]">Sucessos</TabsTrigger>
              <TabsTrigger value="info" className="flex-1 min-w-[80px]">Info</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Barra de ações em massa */}
        {(naoLidas > 0 || selecionadas.size > 0) && (
          <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-muted/40 border border-border/50">
            {filtradas.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={todasSelecionadasVisiveis}
                  onCheckedChange={(checked) => {
                    if (checked) setSelecionadas(new Set(filtradas.map((n) => n.id)));
                    else setSelecionadas(new Set());
                  }}
                />
                <span className="text-xs text-muted-foreground">
                  {selecionadas.size > 0
                    ? `${selecionadas.size} selecionada(s)`
                    : 'Selecionar visíveis'}
                </span>
              </div>
            )}
            <div className="flex gap-2 ml-auto">
              {selecionadas.size > 0 ? (
                <>
                  <Button size="sm" variant="ghost" onClick={() => acaoEmMassa('ler')}>
                    <CheckCheck className="w-4 h-4 mr-1" /> Marcar lidas
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="ghost">
                        <Clock className="w-4 h-4 mr-1" /> Adiar
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Adiar seleção por…</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => adiarNotificacoes(Array.from(selecionadas), 30)}>
                        30 minutos
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => adiarNotificacoes(Array.from(selecionadas), 60)}>
                        1 hora
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => adiarNotificacoes(Array.from(selecionadas), 60 * 4)}>
                        4 horas
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => adiarNotificacoes(Array.from(selecionadas), 60 * 24)}>
                        Amanhã
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => adiarNotificacoes(Array.from(selecionadas), 60 * 24 * 7)}>
                        Próxima semana
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => acaoEmMassa('excluir')}
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Excluir
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setSelecionadas(new Set())}>
                    <X className="w-4 h-4" />
                  </Button>
                </>

              ) : (
                naoLidas > 0 && (
                  <Button size="sm" variant="ghost" onClick={marcarTodasComoLidas}>
                    <CheckCheck className="w-4 h-4 mr-1" /> Marcar todas como lidas
                  </Button>
                )
              )}
            </div>
          </div>
        )}

        {/* Lista agrupada */}
        <div className="space-y-6">
          {loading ? (
            Array(4)
              .fill(0)
              .map((_, i) => <Card key={i} className="animate-pulse h-24 border-border/50" />)
          ) : filtradas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <Bell className="w-8 h-8 text-muted-foreground opacity-20" />
              </div>
              <div className="space-y-1">
                <p className="text-lg font-medium text-foreground">
                  {busca || filtro !== 'todas' ? 'Nenhum resultado' : 'Tudo em dia!'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {busca || filtro !== 'todas'
                    ? 'Tente ajustar a busca ou os filtros.'
                    : 'Você não tem novas notificações no momento.'}
                </p>
              </div>
            </div>
          ) : (
            grupos.map(([label, itens]) => {
              const threads = buildThreads(label, itens);
              const renderCard = (n: Notificacao, opts?: { inThread?: boolean }) => {
                const selecionada = selecionadas.has(n.id);
                return (
                  <Card
                    key={n.id}
                    className={`group border-border/50 transition-all hover:shadow-md ${
                      !n.lida ? 'bg-primary/5 border-primary/20' : 'bg-card'
                    } ${selecionada ? 'ring-2 ring-primary/40' : ''} ${
                      opts?.inThread ? 'ml-6 border-l-2 border-l-primary/30' : ''
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex gap-3">
                        <div className="pt-1">
                          <Checkbox
                            checked={selecionada}
                            onCheckedChange={() => toggleSelecao(n.id)}
                            aria-label="Selecionar notificação"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAction(n)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <div className="flex gap-3">
                            <div className="shrink-0 mt-1">{getIcon(n.tipo)}</div>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <h3
                                  className={`text-sm font-semibold truncate ${
                                    !n.lida ? 'text-primary' : 'text-foreground'
                                  }`}
                                >
                                  {n.titulo}
                                </h3>
                                <span className="text-[10px] text-muted-foreground whitespace-nowrap mt-0.5 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(n.created_at), 'dd MMM, HH:mm', { locale: ptBR })}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {n.mensagem}
                              </p>
                              {n.link && (
                                <span className="text-[10px] font-medium text-primary flex items-center gap-1 pt-1">
                                  Acessar <ExternalLink className="w-2.5 h-2.5" />
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
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
                              <DropdownMenuItem onClick={() => adiarNotificacoes([n.id], 30)}>30 minutos</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => adiarNotificacoes([n.id], 60)}>1 hora</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => adiarNotificacoes([n.id], 60 * 4)}>4 horas</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => adiarNotificacoes([n.id], 60 * 24)}>Amanhã</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => adiarNotificacoes([n.id], 60 * 24 * 7)}>Próxima semana</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              excluirNotificacao(n.id);
                            }}
                            aria-label="Excluir notificação"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              };
              return (
                <div key={label} className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                    {label} · {itens.length}
                  </h4>
                  <div className="space-y-2">
                    {threads.map((t) => {
                      if (t.kind === 'single') return renderCard(t.notif);
                      const expandida = threadsExpandidas.has(t.key);
                      const naoLidasThread = t.items.filter((n) => !n.lida).length;
                      const ids = t.items.map((n) => n.id);
                      const todasSelThread = ids.every((id) => selecionadas.has(id));
                      return (
                        <div key={t.key} className="space-y-1">
                          <Card
                            className={`border-border/50 transition-all hover:shadow-md cursor-pointer ${
                              naoLidasThread > 0 ? 'bg-primary/5 border-primary/20' : 'bg-card'
                            }`}
                            onClick={() => toggleThread(t.key)}
                          >
                            <CardContent className="p-3">
                              <div className="flex items-center gap-3">
                                <div onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={todasSelThread}
                                    onCheckedChange={(checked) => {
                                      setSelecionadas((prev) => {
                                        const next = new Set(prev);
                                        if (checked) ids.forEach((id) => next.add(id));
                                        else ids.forEach((id) => next.delete(id));
                                        return next;
                                      });
                                    }}
                                    aria-label="Selecionar thread"
                                  />
                                </div>
                                <div className="shrink-0">{getIcon(t.tipo)}</div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h3 className={`text-sm font-semibold truncate ${
                                      naoLidasThread > 0 ? 'text-primary' : 'text-foreground'
                                    }`}>
                                      {t.titulo}
                                    </h3>
                                    <Badge variant="secondary" className="text-[10px] shrink-0">
                                      {t.items.length}
                                    </Badge>
                                    {naoLidasThread > 0 && (
                                      <Badge className="text-[10px] shrink-0 bg-primary/20 text-primary hover:bg-primary/20">
                                        {naoLidasThread} nova(s)
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-muted-foreground truncate">
                                    Última: {format(new Date(t.items[0].created_at), 'dd MMM, HH:mm', { locale: ptBR })}
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
                          {expandida && (
                            <div className="space-y-2">
                              {t.items.map((n) => renderCard(n, { inThread: true }))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </PullToRefresh>
  );
}
