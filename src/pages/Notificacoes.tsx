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
  Flame,
  ArrowDownWideNarrow,
  Keyboard,
  Download,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { PullToRefresh } from '@/components/portal/PullToRefresh';
import { toast } from 'sonner';
import { AnexoPreview } from '@/components/notificacoes/AnexoPreview';
import { SwipeableRow } from '@/components/notificacoes/SwipeableRow';

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

/**
 * Score de relevância (0–200+):
 * - Tipo: erro 100, alerta 70, info 30, sucesso 20
 * - Não lida: +40
 * - Palavras-chave de urgência no título: +25
 * - Recência: até +30, decaindo linearmente ao longo de 72h
 */
const URGENCY_RX = /(urgente|vencido|vencendo|pendente|expirad|atrasa|crític|obrigat[óo]ri)/i;
const relevanceScore = (n: Notificacao): number => {
  const tipoScore =
    n.tipo === 'erro' ? 100 : n.tipo === 'alerta' ? 70 : n.tipo === 'info' ? 30 : 20;
  const unreadScore = n.lida ? 0 : 40;
  const urgencyScore = URGENCY_RX.test(`${n.titulo} ${n.mensagem}`) ? 25 : 0;
  const ageHours =
    (Date.now() - new Date(n.created_at).getTime()) / (1000 * 60 * 60);
  const recencyScore = Math.max(0, 30 - (ageHours / 72) * 30);
  return tipoScore + unreadScore + urgencyScore + recencyScore;
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
  const [ordenarPorRelevancia, setOrdenarPorRelevancia] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('notif_ordenar_relevancia') === '1';
  });
  const [threadsExpandidas, setThreadsExpandidas] = useState<Set<string>>(new Set());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [visibleCount, setVisibleCount] = useState<number>(50);
  const [modoFoco, setModoFoco] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('notif_modo_foco') === '1';
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('notif_agrupar_similares', agruparSimilares ? '1' : '0');
  }, [agruparSimilares]);

  useEffect(() => {
    localStorage.setItem('notif_ordenar_relevancia', ordenarPorRelevancia ? '1' : '0');
  }, [ordenarPorRelevancia]);

  useEffect(() => {
    localStorage.setItem('notif_modo_foco', modoFoco ? '1' : '0');
  }, [modoFoco]);



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
          setNotificacoes((prev) => (prev.some((n) => n.id === nova.id) ? prev : [nova, ...prev]));
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
    const map = new Map<string, Notificacao[]>();
    for (const n of filtradasVisiveis) {
      const label = groupLabel(new Date(n.created_at));
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(n);
    }
    if (ordenarPorRelevancia) {
      for (const [, itens] of map) {
        itens.sort((a, b) => relevanceScore(b) - relevanceScore(a));
      }
    }
    return Array.from(map.entries());
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

  // Atalhos de teclado: navegação (j/k), abrir (Enter), selecionar (x),
  // marcar lido (e), excluir (#), marcar todas (Shift+A), buscar (/), ajuda (?).
  useEffect(() => {
    const isTypingTarget = (el: EventTarget | null): boolean => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      return (
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        el.isContentEditable
      );
    };

    const handler = (e: KeyboardEvent) => {
      // '/' foca a busca mesmo se nada estiver focado
      if (e.key === '/' && !isTypingTarget(e.target)) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (e.key === '?' && !isTypingTarget(e.target)) {
        e.preventDefault();
        setHelpOpen((v) => !v);
        return;
      }
      if (e.key === 'Escape') {
        if (helpOpen) return; // Dialog trata
        if (selecionadas.size > 0) {
          setSelecionadas(new Set());
          return;
        }
        if (focusedId) {
          setFocusedId(null);
          return;
        }
      }
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'j' || e.key === 'k') {
        e.preventDefault();
        if (visibleIds.length === 0) return;
        const idx = focusedId ? visibleIds.indexOf(focusedId) : -1;
        const nextIdx =
          e.key === 'j'
            ? Math.min(visibleIds.length - 1, idx + 1)
            : Math.max(0, idx <= 0 ? 0 : idx - 1);
        const nextId = visibleIds[nextIdx];
        setFocusedId(nextId);
        window.requestAnimationFrame(() => {
          const el = document.querySelector<HTMLElement>(`[data-notif-id="${nextId}"]`);
          el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });
        return;
      }

      if (!focusedId) return;
      const alvo = notificacoes.find((n) => n.id === focusedId);
      if (!alvo) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        handleAction(alvo);
      } else if (e.key === 'x') {
        e.preventDefault();
        toggleSelecao(focusedId);
      } else if (e.key === 'e') {
        e.preventDefault();
        if (!alvo.lida) marcarComoLida(focusedId);
      } else if (e.key === '#') {
        e.preventDefault();
        excluirNotificacao(focusedId);
      } else if (e.key === 'A' && e.shiftKey) {
        e.preventDefault();
        marcarTodasComoLidas();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleIds, focusedId, notificacoes, selecionadas, helpOpen]);


  const naoLidas = notificacoes.filter((n) => !n.lida).length;
  const contadoresPorTipo = useMemo(() => {
    const acc = { erro: 0, alerta: 0, sucesso: 0, info: 0 } as Record<Notificacao['tipo'], number>;
    for (const n of notificacoes) {
      if (!n.lida && acc[n.tipo] !== undefined) acc[n.tipo]++;
    }
    return acc;
  }, [notificacoes]);
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
              <Button
                variant={ordenarPorRelevancia ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOrdenarPorRelevancia((v) => !v)}
                title={
                  ordenarPorRelevancia
                    ? 'Ordenar cronologicamente'
                    : 'Ordenar por relevância (urgência + não lidas + recência)'
                }
                aria-pressed={ordenarPorRelevancia}
              >
                {ordenarPorRelevancia ? (
                  <Flame className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownWideNarrow className="w-4 h-4 mr-1" />
                )}
                {ordenarPorRelevancia ? 'Relevância' : 'Recente'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHelpOpen(true)}
                title="Atalhos de teclado (?)"
                aria-label="Atalhos de teclado"
              >
                <Keyboard className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/notificacoes/historico')}>
                Histórico
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    title="Exportar notificações filtradas"
                    disabled={filtradas.length === 0}
                  >
                    <Download className="w-4 h-4 mr-1" /> Exportar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Exportar {filtradas.length} registro(s)</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={exportarCSV}>
                    <FileSpreadsheet className="w-4 h-4 mr-2" /> CSV (Excel)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={exportarPDF}>
                    <FileText className="w-4 h-4 mr-2" /> PDF (imprimir)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
              ref={searchInputRef}
              placeholder="Buscar por título ou mensagem... ( / )"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col">
              <label htmlFor="notif-data-inicio" className="text-xs text-muted-foreground mb-1">De</label>
              <Input
                id="notif-data-inicio"
                type="date"
                value={dataInicio}
                max={dataFim || undefined}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="notif-data-fim" className="text-xs text-muted-foreground mb-1">Até</label>
              <Input
                id="notif-data-fim"
                type="date"
                value={dataFim}
                min={dataInicio || undefined}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-[160px]"
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {[
                { label: 'Hoje', dias: 0 },
                { label: '7 dias', dias: 6 },
                { label: '30 dias', dias: 29 },
                { label: '90 dias', dias: 89 },
              ].map((p) => (
                <Button
                  key={p.label}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const hoje = new Date();
                    const ini = new Date();
                    ini.setDate(hoje.getDate() - p.dias);
                    setDataInicio(format(ini, 'yyyy-MM-dd'));
                    setDataFim(format(hoje, 'yyyy-MM-dd'));
                  }}
                >
                  {p.label}
                </Button>
              ))}
              {(dataInicio || dataFim) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setDataInicio(''); setDataFim(''); }}
                  title="Limpar intervalo de datas"
                >
                  Limpar
                </Button>
              )}
            </div>
          </div>

          <Tabs value={filtro} onValueChange={(v) => setFiltro(v as Filtro)}>
            <TabsList className="w-full flex-wrap h-auto">
              <TabsTrigger value="todas" className="flex-1 min-w-[80px]">
                Todas <Badge variant="secondary" className="ml-2">{notificacoes.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="nao_lidas" className="flex-1 min-w-[80px]">
                Não lidas <Badge variant="secondary" className="ml-2">{naoLidas}</Badge>
              </TabsTrigger>
              <TabsTrigger value="erro" className="flex-1 min-w-[80px]">
                Erros {contadoresPorTipo.erro > 0 && <Badge variant="destructive" className="ml-2">{contadoresPorTipo.erro}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="alerta" className="flex-1 min-w-[80px]">
                Alertas {contadoresPorTipo.alerta > 0 && <Badge variant="secondary" className="ml-2">{contadoresPorTipo.alerta}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="sucesso" className="flex-1 min-w-[80px]">
                Sucessos {contadoresPorTipo.sucesso > 0 && <Badge variant="secondary" className="ml-2">{contadoresPorTipo.sucesso}</Badge>}
              </TabsTrigger>
              <TabsTrigger value="info" className="flex-1 min-w-[80px]">
                Info {contadoresPorTipo.info > 0 && <Badge variant="secondary" className="ml-2">{contadoresPorTipo.info}</Badge>}
              </TabsTrigger>
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
                  <SwipeableRow
                    key={n.id}
                    onSwipeRight={n.lida ? undefined : () => marcarComoLida(n.id)}
                    onSwipeLeft={() => excluirNotificacao(n.id)}
                    rightLabel={n.lida ? 'Já lida' : 'Marcar lida'}
                  >
                  <Card
                    data-notif-id={n.id}
                    className={`group border-border/50 transition-all hover:shadow-md ${
                      !n.lida ? 'bg-primary/5 border-primary/20' : 'bg-card'
                    } ${selecionada ? 'ring-2 ring-primary/40' : ''} ${
                      opts?.inThread ? 'ml-6 border-l-2 border-l-primary/30' : ''
                    } ${highlightedId === n.id ? 'ring-2 ring-primary shadow-lg animate-pulse' : ''} ${
                      focusedId === n.id ? 'ring-2 ring-primary/60' : ''
                    }`}
                    onMouseEnter={() => setFocusedId(n.id)}
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
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <h3
                                    className={`text-sm font-semibold truncate ${
                                      !n.lida ? 'text-primary' : 'text-foreground'
                                    }`}
                                  >
                                    {n.titulo}
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
                        {n.link && (n.link.startsWith('http') || n.link.startsWith('/storage/') || n.link.includes('/object/public/')) && (
                          <div className="pl-11 -mt-1">
                            <AnexoPreview url={n.link} titulo={n.titulo} />
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
                  </SwipeableRow>
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

          {!loading && filtradas.length > 0 && (
            <div className="pt-2">
              {visibleCount < filtradas.length ? (
                <div
                  ref={sentinelRef}
                  className="flex flex-col items-center justify-center gap-2 py-6"
                >
                  <div className="text-xs text-muted-foreground">
                    Mostrando <strong className="text-foreground">{filtradasVisiveis.length}</strong> de{' '}
                    <strong className="text-foreground">{filtradas.length}</strong>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setVisibleCount((c) => Math.min(c + 50, filtradas.length))}
                  >
                    Carregar mais 50
                  </Button>
                </div>
              ) : (
                filtradas.length > 50 && (
                  <div className="text-center text-xs text-muted-foreground py-4">
                    Todas as {filtradas.length} notificações foram carregadas.
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>


      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Keyboard className="w-5 h-5" /> Atalhos de teclado
            </DialogTitle>
            <DialogDescription>
              Navegue e gerencie suas notificações sem tirar as mãos do teclado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            {[
              ['/', 'Focar campo de busca'],
              ['j', 'Ir para a próxima notificação'],
              ['k', 'Ir para a notificação anterior'],
              ['Enter', 'Abrir a notificação em foco'],
              ['x', 'Selecionar/desselecionar em foco'],
              ['e', 'Marcar em foco como lida'],
              ['#', 'Excluir a em foco'],
              ['Shift + A', 'Marcar todas como lidas'],
              ['Esc', 'Limpar seleção / foco'],
              ['?', 'Mostrar esta ajuda'],
            ].map(([k, desc]) => (
              <div
                key={k}
                className="flex items-center justify-between gap-4 px-3 py-2 rounded-md bg-muted/40"
              >
                <span className="text-muted-foreground">{desc}</span>
                <kbd className="px-2 py-0.5 rounded border border-border bg-background text-xs font-mono">
                  {k}
                </kbd>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </PullToRefresh>
  );
}
