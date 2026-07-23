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
import { useNotificacaoKeyboardShortcuts } from '@/hooks/useNotificacaoKeyboardShortcuts';
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
import { useNotificacoesRealtime } from '@/hooks/useNotificacoesRealtime';
import { useNotificacoesActions } from '@/hooks/useNotificacoesActions';
import { useNotificacoesFiltradas } from '@/hooks/useNotificacoesFiltradas';


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

  const {
    marcarComoLida,
    marcarComoNaoLida,
    togglePin,
    marcarTodasComoLidas,
    excluirNotificacao,
    adiarNotificacoes,
    acaoEmMassa,
    toggleSelecao,
  } = useNotificacoesActions({
    user,
    notificacoes,
    setNotificacoes,
    selecionadas,
    setSelecionadas,
  });

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
  useNotificacoesRealtime({ user, setNotificacoes, playAlert, matchRule });

  // Deep-linking: /notificacoes?focus=<id>
  useNotificacaoDeepLink({
    notificacoes,
    loading,
    agruparSimilares,
    setThreadsExpandidas,
    setHighlightedId,
    marcarComoLida,
  });



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


  const getIcon = getNotificacaoIcon;

  const handleAction = (n: Notificacao) => {
    if (!n.lida) marcarComoLida(n.id);
    if (n.link) {
      if (n.link.startsWith('/')) navigate(n.link);
      else window.open(n.link, '_blank');
    }
  };

  const { filtradas, filtradasVisiveis, grupos } = useNotificacoesFiltradas({
    notificacoes,
    filtro,
    busca,
    dataInicio,
    dataFim,
    modoFoco,
    ordenarPorRelevancia,
    visibleCount,
  });


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
