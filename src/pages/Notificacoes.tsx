import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
  Focus,
  Mail,
  MailOpen,
  Pin,
  PinOff,
  Wand2,
  Rows2,
  Rows3,
  Share2,
  Copy,
} from 'lucide-react';
import { useNotificationAlert } from '@/hooks/useNotificationAlert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { PullToRefresh } from '@/components/portal/PullToRefresh';
import { toast } from 'sonner';
import { AnexoPreview } from '@/components/notificacoes/AnexoPreview';
import { LinkPreview } from '@/components/notificacoes/LinkPreview';
import { SwipeableRow } from '@/components/notificacoes/SwipeableRow';
import { HighlightText } from '@/components/notificacoes/HighlightText';
import { AutoRulesDialog } from '@/components/notificacoes/AutoRulesDialog';
import { NotificacaoShortcutsDialog } from '@/components/notificacoes/NotificacaoShortcutsDialog';
import { NotificacaoFocoBanner } from '@/components/notificacoes/NotificacaoFocoBanner';
import { NotificacaoEmptyState } from '@/components/notificacoes/NotificacaoEmptyState';
import { useFaviconBadge } from '@/hooks/useFaviconBadge';
import { useNotificacaoStats } from '@/hooks/useNotificacaoStats';
import { NotificacaoSummaryStats } from '@/components/notificacoes/NotificacaoSummaryStats';
import { useAutoRules } from '@/hooks/useAutoRules';
import { useNotificacoesPreferences } from '@/hooks/useNotificacoesPreferences';
import type { Notificacao, Filtro } from '@/components/notificacoes/types';
import { NotificacaoFiltros } from '@/components/notificacoes/NotificacaoFiltros';
import { NotificacaoBulkActionsBar } from '@/components/notificacoes/NotificacaoBulkActionsBar';
import { NotificacaoHeaderActions } from '@/components/notificacoes/NotificacaoHeaderActions';
import { NotificacaoListItem, getNotificacaoIcon } from '@/components/notificacoes/NotificacaoListItem';
import { NotificacaoGroupList } from '@/components/notificacoes/NotificacaoGroupList';
import { groupLabel, URGENCY_RX, relevanceScore } from '@/components/notificacoes/relevance';
import {
  buildThreads as buildThreadsPure,
  NotificacaoThreadGroup,
} from '@/components/notificacoes/NotificacaoThreadGroup';
import { NotificacaoLoadMore } from '@/components/notificacoes/NotificacaoLoadMore';

export default function Notificacoes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const {
    prefs,
    setFiltro,
    setAgruparSimilares,
    setOrdenarPorRelevancia,
    setModoFoco,
    setDensidade,
    setDataInicio,
    setDataFim,
  } = useNotificacoesPreferences();
  const {
    filtro,
    agruparSimilares,
    ordenarPorRelevancia,
    modoFoco,
    densidade,
    dataInicio,
    dataFim,
  } = prefs;
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [threadsExpandidas, setThreadsExpandidas] = useState<Set<string>>(new Set());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(50);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { alertasAtivos, toggleAlertas, playAlert } = useNotificationAlert();
  const { rules, addRule, removeRule, toggleRule, matchRule } = useAutoRules();
  const [rulesDialogOpen, setRulesDialogOpen] = useState(false);

  const resetarFiltros = useCallback(() => {
    setBusca('');
    setFiltro('todas');
    setDataInicio('');
    setDataFim('');
    setModoFoco(false);
    toast.success('Filtros restaurados');
  }, []);



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
          const nova = payload.new as Notificacao;
          setNotificacoes((prev) => {
            if (prev.some((n) => n.id === nova.id)) return prev;
            const prioridade =
              nova.tipo === 'erro' ? 'alta' : nova.tipo === 'alerta' ? 'media' : 'baixa';
            playAlert(prioridade);
            return [nova, ...prev];
          });

          // Aplica regras automáticas (defer para o próximo tick para
          // garantir que a linha já esteja no estado antes de mutá-la).
          const match = matchRule(nova);
          if (match) {
            setTimeout(async () => {
              try {
                if (match.acao === 'marcar_lida') {
                  await supabase.from('notificacoes').update({ lida: true }).eq('id', nova.id);
                  setNotificacoes((prev) =>
                    prev.map((n) => (n.id === nova.id ? { ...n, lida: true } : n))
                  );
                } else if (match.acao === 'excluir') {
                  await supabase.from('notificacoes').delete().eq('id', nova.id);
                  setNotificacoes((prev) => prev.filter((n) => n.id !== nova.id));
                } else if (match.acao === 'fixar') {
                  const fixada_em = new Date().toISOString();
                  await supabase.from('notificacoes').update({ fixada_em }).eq('id', nova.id);
                  setNotificacoes((prev) =>
                    prev.map((n) => (n.id === nova.id ? { ...n, fixada_em } : n))
                  );
                }
                toast.info(`Regra automática aplicada: ${match.acao.replace('_', ' ')}`);
              } catch {
                /* falha silenciosa — a linha permanece intocada */
              }
            }, 0);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, playAlert, matchRule]);

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

  const marcarComoNaoLida = async (id: string) => {
    try {
      const { error } = await supabase.from('notificacoes').update({ lida: false }).eq('id', id);
      if (error) throw error;
      setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: false } : n)));
    } catch (error) {
      console.error('Erro ao marcar como não lida:', error);
      toast.error('Não foi possível marcar como não lida');
    }
  };

  const togglePin = async (n: Notificacao) => {
    const proximoValor = n.fixada_em ? null : new Date().toISOString();
    // Optimistic
    setNotificacoes((prev) =>
      prev.map((x) => (x.id === n.id ? { ...x, fixada_em: proximoValor } : x)),
    );
    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ fixada_em: proximoValor })
        .eq('id', n.id);
      if (error) throw error;
      toast.success(proximoValor ? 'Notificação fixada' : 'Notificação desafixada');
    } catch (error) {
      console.error('Erro ao alternar fixar:', error);
      // Rollback
      setNotificacoes((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, fixada_em: n.fixada_em } : x)),
      );
      toast.error('Não foi possível fixar a notificação');
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

  const buildShareText = (n: Notificacao) => {
    const linkAbs =
      n.link && n.link.startsWith('http')
        ? n.link
        : n.link
          ? `${window.location.origin}${n.link.startsWith('/') ? '' : '/'}${n.link}`
          : '';
    return `${n.titulo}\n\n${n.mensagem}${linkAbs ? `\n\n${linkAbs}` : ''}`;
  };

  const copiarNotificacao = async (n: Notificacao) => {
    const texto = buildShareText(n);
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(texto);
      } else {
        const ta = document.createElement('textarea');
        ta.value = texto;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      toast.success('Notificação copiada para a área de transferência');
    } catch (error) {
      console.error('Erro ao copiar:', error);
      toast.error('Não foi possível copiar');
    }
  };

  const compartilharNotificacao = async (n: Notificacao) => {
    const texto = buildShareText(n);
    const linkAbs =
      n.link && n.link.startsWith('http')
        ? n.link
        : n.link
          ? `${window.location.origin}${n.link.startsWith('/') ? '' : '/'}${n.link}`
          : undefined;
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({
          title: n.titulo,
          text: n.mensagem,
          ...(linkAbs ? { url: linkAbs } : {}),
        });
      } else {
        await copiarNotificacao(n);
      }
    } catch (error: unknown) {
      // AbortError = usuário cancelou o share nativo, não é falha
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('Erro ao compartilhar:', error);
      // Fallback silencioso: copia para a área de transferência
      await copiarNotificacao(n);
    }
  };



  // Restaura notificações excluídas via botão "Desfazer" do toast.
  const restaurarNotificacoes = async (snapshot: Notificacao[]) => {
    if (!user || snapshot.length === 0) return;
    try {
      const rows = snapshot.map((n) => ({
        id: n.id,
        user_id: user.id,
        titulo: n.titulo,
        mensagem: n.mensagem,
        tipo: n.tipo,
        lida: n.lida,
        link: n.link,
        created_at: n.created_at,
      }));
      const { error } = await supabase.from('notificacoes').insert(rows);
      if (error) throw error;
      setNotificacoes((prev) => {
        const existentes = new Set(prev.map((n) => n.id));
        const novos = snapshot.filter((n) => !existentes.has(n.id));
        return [...novos, ...prev].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      });
      toast.success(`${snapshot.length} restaurada(s)`);
    } catch (error) {
      console.error('Erro ao restaurar notificação:', error);
      toast.error('Não foi possível desfazer a exclusão');
    }
  };

  // Reverte um adiamento (limpa adiada_ate) e devolve os itens à lista.
  const reverterAdiamento = async (snapshot: Notificacao[]) => {
    if (snapshot.length === 0) return;
    const ids = snapshot.map((n) => n.id);
    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ adiada_ate: null })
        .in('id', ids);
      if (error) throw error;
      setNotificacoes((prev) => {
        const existentes = new Set(prev.map((n) => n.id));
        const novos = snapshot.filter((n) => !existentes.has(n.id));
        return [...novos, ...prev].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
      });
      toast.success('Adiamento cancelado');
    } catch (error) {
      console.error('Erro ao reverter adiamento:', error);
      toast.error('Não foi possível desfazer');
    }
  };

  const excluirNotificacao = async (id: string) => {
    const snapshot = notificacoes.find((n) => n.id === id);
    try {
      const { error } = await supabase.from('notificacoes').delete().eq('id', id);
      if (error) throw error;
      setNotificacoes((prev) => prev.filter((n) => n.id !== id));
      setSelecionadas((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast.success('Notificação removida', {
        duration: 6000,
        action: snapshot
          ? { label: 'Desfazer', onClick: () => restaurarNotificacoes([snapshot]) }
          : undefined,
      });
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
      toast.error('Erro ao excluir notificação');
    }
  };

  const adiarNotificacoes = async (ids: string[], minutos: number) => {
    if (ids.length === 0) return;
    const snapshot = notificacoes.filter((n) => ids.includes(n.id));
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
      toast.success(`Adiada${ids.length > 1 ? 's' : ''} por ${label}`, {
        duration: 6000,
        action:
          snapshot.length > 0
            ? { label: 'Desfazer', onClick: () => reverterAdiamento(snapshot) }
            : undefined,
      });
    } catch (error) {
      console.error('Erro ao adiar notificação:', error);
      toast.error('Não foi possível adiar');
    }
  };

  const acaoEmMassa = async (acao: 'ler' | 'excluir') => {
    const ids = Array.from(selecionadas);
    if (ids.length === 0) return;
    const snapshot = notificacoes.filter((n) => selecionadas.has(n.id));
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
        toast.success(`${ids.length} removida(s)`, {
          duration: 8000,
          action: { label: 'Desfazer', onClick: () => restaurarNotificacoes(snapshot) },
        });
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

  const getIcon = getNotificacaoIcon;

  const handleAction = (n: Notificacao) => {
    if (!n.lida) marcarComoLida(n.id);
    if (n.link) {
      if (n.link.startsWith('/')) navigate(n.link);
      else window.open(n.link, '_blank');
    }
  };

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const ini = dataInicio ? new Date(`${dataInicio}T00:00:00`).getTime() : null;
    const fim = dataFim ? new Date(`${dataFim}T23:59:59.999`).getTime() : null;
    return notificacoes.filter((n) => {
      if (filtro === 'nao_lidas' && n.lida) return false;
      if (['sucesso', 'erro', 'alerta', 'info'].includes(filtro) && n.tipo !== filtro) return false;
      if (termo && !`${n.titulo} ${n.mensagem}`.toLowerCase().includes(termo)) return false;
      if (ini || fim) {
        const t = new Date(n.created_at).getTime();
        if (ini && t < ini) return false;
        if (fim && t > fim) return false;
      }
      // Modo Foco: apenas não-lidas prioritárias (erro/alerta OU score ≥ 130)
      if (modoFoco) {
        if (n.lida) return false;
        const prioritaria = n.tipo === 'erro' || n.tipo === 'alerta' || relevanceScore(n) >= 130;
        if (!prioritaria) return false;
      }
      return true;
    });
  }, [notificacoes, filtro, busca, dataInicio, dataFim, modoFoco]);


  const filtradasVisiveis = useMemo(
    () => filtradas.slice(0, visibleCount),
    [filtradas, visibleCount]
  );

  const grupos = useMemo(() => {
    const fixadas: Notificacao[] = [];
    const map = new Map<string, Notificacao[]>();
    for (const n of filtradasVisiveis) {
      if (n.fixada_em) {
        fixadas.push(n);
        continue;
      }
      const label = groupLabel(new Date(n.created_at));
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(n);
    }
    if (ordenarPorRelevancia) {
      for (const [, itens] of map) {
        itens.sort((a, b) => relevanceScore(b) - relevanceScore(a));
      }
      fixadas.sort((a, b) => relevanceScore(b) - relevanceScore(a));
    } else {
      // Mais recentemente fixadas primeiro
      fixadas.sort(
        (a, b) => new Date(b.fixada_em ?? 0).getTime() - new Date(a.fixada_em ?? 0).getTime(),
      );
    }
    const result: Array<[string, Notificacao[]]> = [];
    if (fixadas.length > 0) result.push(['📌 Fixadas', fixadas]);
    for (const entry of map.entries()) result.push(entry);
    return result;
  }, [filtradasVisiveis, ordenarPorRelevancia]);

  // Reset paginação quando filtros mudam
  useEffect(() => {
    setVisibleCount(50);
  }, [filtro, busca, dataInicio, dataFim, agruparSimilares, ordenarPorRelevancia, modoFoco]);


  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (visibleCount >= filtradas.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((c) => Math.min(c + 50, filtradas.length));
        }
      },
      { rootMargin: '400px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visibleCount, filtradas.length]);


  // ------------------- Exportação (CSV / PDF via print) -------------------
  const exportarCSV = useCallback(() => {
    if (filtradas.length === 0) {
      toast.info('Nada para exportar no filtro atual');
      return;
    }
    const esc = (v: string) => `"${(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
    const header = ['Data', 'Tipo', 'Status', 'Título', 'Mensagem', 'Link'];
    const linhas = filtradas.map((n) => [
      format(new Date(n.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      n.tipo,
      n.lida ? 'lida' : 'não lida',
      n.titulo,
      n.mensagem,
      n.link ?? '',
    ]);
    const csv = '\ufeff' + [header, ...linhas].map((r) => r.map(esc).join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `notificacoes_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${filtradas.length} notificações exportadas em CSV`);
  }, [filtradas]);

  const exportarPDF = useCallback(() => {
    const escapeHtml = (s: string) =>
      (s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
    if (filtradas.length === 0) {
      toast.info('Nada para exportar no filtro atual');
      return;
    }
    const w = window.open('', '_blank', 'width=900,height=700');
    if (!w) {
      toast.error('Bloqueado pelo navegador. Permita pop-ups para exportar em PDF.');
      return;
    }
    const tipoBadge: Record<Notificacao['tipo'], string> = {
      erro: '#dc2626', alerta: '#d97706', sucesso: '#16a34a', info: '#2563eb',
    };
    const rows = filtradas.map((n) => `
      <tr class="${n.lida ? 'lida' : 'nao-lida'}">
        <td>${format(new Date(n.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</td>
        <td><span class="tipo" style="background:${tipoBadge[n.tipo]}20;color:${tipoBadge[n.tipo]}">${n.tipo}</span></td>
        <td>${n.lida ? '✓ lida' : '● não lida'}</td>
        <td><strong>${escapeHtml(n.titulo)}</strong><br/><span class="msg">${escapeHtml(n.mensagem)}</span></td>
      </tr>`).join('');
    w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/>
      <title>Notificações — ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</title>
      <style>
        *{box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:24px;color:#111}
        h1{font-size:20px;margin:0 0 4px}.sub{color:#666;font-size:12px;margin-bottom:16px}
        table{width:100%;border-collapse:collapse;font-size:11px}
        th,td{padding:8px;border-bottom:1px solid #e5e7eb;text-align:left;vertical-align:top}
        th{background:#f9fafb;text-transform:uppercase;font-size:10px;letter-spacing:.05em;color:#6b7280}
        .tipo{padding:2px 8px;border-radius:9999px;font-size:10px;font-weight:600;text-transform:capitalize}
        .msg{color:#4b5563;font-size:10px}.nao-lida td{background:#fef9c320}
        @media print{@page{size:A4;margin:15mm}body{margin:0}}
      </style></head><body>
      <h1>Central de Notificações</h1>
      <div class="sub">Exportado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} — ${filtradas.length} registro(s) — filtro: ${filtro}${busca ? ` — busca: "${escapeHtml(busca)}"` : ''}</div>
      <table><thead><tr><th>Data</th><th>Tipo</th><th>Status</th><th>Conteúdo</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <script>window.onload=()=>{setTimeout(()=>window.print(),300)}</script>
      </body></html>`);
    w.document.close();
    toast.success('Abrindo diálogo de impressão — selecione "Salvar como PDF"');
  }, [filtradas, filtro, busca]);


  // Threading: agrupa notificações com título idêntico dentro do mesmo grupo (≥3)
  const buildThreads = useCallback(
    (label: string, itens: Notificacao[]) => buildThreadsPure(label, itens, agruparSimilares),
    [agruparSimilares],
  );

  // IDs visíveis em ordem de renderização (respeitando threads colapsadas) — usados na navegação por teclado.
  const visibleIds = useMemo(() => {
    const ids: string[] = [];
    for (const [label, itens] of grupos) {
      const threads = buildThreads(label, itens);
      for (const t of threads) {
        if (t.kind === 'single') ids.push(t.notif.id);
        else if (threadsExpandidas.has(t.key)) t.items.forEach((n) => ids.push(n.id));
      }
    }
    return ids;
  }, [grupos, buildThreads, threadsExpandidas]);

  useNotificacaoKeyboardShortcuts({
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
  });




  const stats = useNotificacaoStats(notificacoes);
  const { naoLidas, porTipoNaoLidas: contadoresPorTipo } = stats;
  useFaviconBadge(naoLidas, 'Notificações');
  const todasSelecionadasVisiveis =
    filtradas.length > 0 && filtradas.every((n) => selecionadas.has(n.id));

  return (
    <>
    <PullToRefresh onRefresh={fetchNotificacoes}>
      <div className="w-full max-w-4xl mx-auto p-4 space-y-6 pb-24">
        <ModuleHeader
          title="Notificações"
          description="Fique por dentro das novidades e atualizações"
          icon={Bell}
          actions={
            <NotificacaoHeaderActions
              modoFoco={modoFoco}
              onToggleFoco={() => setModoFoco(!modoFoco)}
              densidade={densidade}
              onToggleDensidade={() => setDensidade(densidade === 'compact' ? 'comfortable' : 'compact')}
              rulesAtivas={rules.filter((r) => r.ativa).length}
              onOpenRules={() => setRulesDialogOpen(true)}
              alertasAtivos={alertasAtivos}
              onToggleAlertas={toggleAlertas}
              agruparSimilares={agruparSimilares}
              onToggleAgrupar={() => setAgruparSimilares(!agruparSimilares)}
              ordenarPorRelevancia={ordenarPorRelevancia}
              onToggleOrdenacao={() => setOrdenarPorRelevancia(!ordenarPorRelevancia)}
              onOpenHelp={() => setHelpOpen(true)}
              totalFiltradas={filtradas.length}
              onExportarCSV={exportarCSV}
              onExportarPDF={exportarPDF}
            />
          }
        />

        {/* Resumo agregado */}
        <NotificacaoSummaryStats stats={stats} densidade={densidade} />

        {/* Barra de busca + filtros */}
        <NotificacaoFiltros
          searchInputRef={searchInputRef}
          busca={busca}
          onBuscaChange={setBusca}
          dataInicio={dataInicio}
          dataFim={dataFim}
          onDataInicioChange={setDataInicio}
          onDataFimChange={setDataFim}
          filtro={filtro}
          onFiltroChange={setFiltro}
          modoFoco={modoFoco}
          onResetar={resetarFiltros}
          totais={{
            todas: notificacoes.length,
            naoLidas,
            erro: contadoresPorTipo.erro,
            alerta: contadoresPorTipo.alerta,
            sucesso: contadoresPorTipo.sucesso,
            info: contadoresPorTipo.info,
          }}
        />

        {/* Barra de ações em massa */}
        <NotificacaoBulkActionsBar
          totalVisiveis={filtradas.length}
          totalSelecionadas={selecionadas.size}
          totalNaoLidas={naoLidas}
          todasSelecionadasVisiveis={todasSelecionadasVisiveis}
          onToggleSelecionarVisiveis={(checked) => {
            if (checked) setSelecionadas(new Set(filtradas.map((n) => n.id)));
            else setSelecionadas(new Set());
          }}
          onLimparSelecao={() => setSelecionadas(new Set())}
          onMarcarSelecionadasLidas={() => acaoEmMassa('ler')}
          onExcluirSelecionadas={() => acaoEmMassa('excluir')}
          onAdiarSelecionadas={(min) => adiarNotificacoes(Array.from(selecionadas), min)}
          onMarcarTodasLidas={marcarTodasComoLidas}
        />


        {modoFoco && <NotificacaoFocoBanner onSair={() => setModoFoco(false)} />}

        {/* Lista agrupada */}
        <div className="space-y-6">

          {loading ? (
            Array(4)
              .fill(0)
              .map((_, i) => <Card key={i} className="animate-pulse h-24 border-border/50" />)
          ) : filtradas.length === 0 ? (
            <NotificacaoEmptyState filtered={!!busca || filtro !== 'todas'} />

          ) : (
            <NotificacaoGroupList
              grupos={grupos}
              agruparSimilares={agruparSimilares}
              threadsExpandidas={threadsExpandidas}
              selecionadas={selecionadas}
              densidade={densidade}
              busca={busca}
              highlightedId={highlightedId}
              focusedId={focusedId}
              onToggleThread={toggleThread}
              onSetSelecionadas={setSelecionadas}
              onFocus={setFocusedId}
              onToggleSelecao={toggleSelecao}
              onAction={handleAction}
              onMarcarLida={marcarComoLida}
              onMarcarNaoLida={marcarComoNaoLida}
              onExcluir={excluirNotificacao}
              onAdiar={adiarNotificacoes}
              onTogglePin={togglePin}
              onCopiar={copiarNotificacao}
              onCompartilhar={compartilharNotificacao}
            />
          )}

          {!loading && filtradas.length > 0 && (
            <NotificacaoLoadMore
              ref={sentinelRef}
              visibleCount={visibleCount}
              totalCount={filtradas.length}
              visibleFilteredCount={filtradasVisiveis.length}
              onLoadMore={() => setVisibleCount((c) => Math.min(c + 50, filtradas.length))}
            />
          )}
        </div>
      </div>


      <NotificacaoShortcutsDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </PullToRefresh>
    <AutoRulesDialog
      open={rulesDialogOpen}
      onOpenChange={setRulesDialogOpen}
      rules={rules}
      addRule={addRule}
      removeRule={removeRule}
      toggleRule={toggleRule}
    />
    </>
  );
}
