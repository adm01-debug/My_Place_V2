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
import { useNotificacaoDeepLink } from '@/hooks/useNotificacaoDeepLink';
import { useNotificacoesExport } from '@/hooks/useNotificacoesExport';
import { useNotificacoesShare } from '@/hooks/useNotificacoesShare';
import { useNotificacoesData } from '@/hooks/useNotificacoesData';




export default function Notificacoes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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
  const {
    notificacoes,
    setNotificacoes,
    loading,
    fetchNotificacoes,
    visibleCount,
    loadMore,
    setTotalFiltradas,
    sentinelRef,
  } = useNotificacoesData({
    user,
    resetKeys: [filtro, busca, dataInicio, dataFim, agruparSimilares, ordenarPorRelevancia, modoFoco],
  });
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [threadsExpandidas, setThreadsExpandidas] = useState<Set<string>>(new Set());
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
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



  const { copiarNotificacao, compartilharNotificacao } = useNotificacoesShare();


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


  // Informa o teto da paginação (scroll infinito é gerido em useNotificacoesData)
  useEffect(() => {
    setTotalFiltradas(filtradas.length);
  }, [filtradas.length, setTotalFiltradas]);




  // Exportação (CSV / PDF via print)
  const { exportarCSV, exportarPDF } = useNotificacoesExport({ filtradas, filtro, busca });



  // Threading e navegação por teclado (ordem real de renderização).
  const { threadsExpandidas, setThreadsExpandidas, toggleThread, visibleIds } =
    useNotificacoesThreads({ grupos, agruparSimilares });

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
              onLoadMore={loadMore}
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
