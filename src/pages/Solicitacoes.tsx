import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Clock, CheckCircle2, XCircle, Loader2, Paperclip, X, Filter, CalendarIcon, Inbox } from 'lucide-react';
import { AttachmentPreview } from '@/components/portal/AttachmentPreview';
import { PullToRefresh } from '@/components/portal/PullToRefresh';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

type TipoSolicitacao = 'declaracao_vinculo' | 'alteracao_dados' | 'adiantamento_salarial' | 'carta_recomendacao' | 'outros';
type StatusSolicitacao = 'pendente' | 'em_analise' | 'aprovada' | 'recusada' | 'cancelada';
type Prioridade = 'baixa' | 'normal' | 'alta';

interface Solicitacao {
  id: string;
  tipo: TipoSolicitacao;
  descricao: string;
  status: StatusSolicitacao;
  prioridade: Prioridade;
  resposta: string | null;
  anexo_url: string | null;
  created_at: string;
}

const tipoLabels: Record<TipoSolicitacao, string> = {
  declaracao_vinculo: 'Declaração de Vínculo',
  alteracao_dados: 'Alteração de Dados',
  adiantamento_salarial: 'Adiantamento Salarial',
  carta_recomendacao: 'Carta de Recomendação',
  outros: 'Outros',
};

const statusColors: Record<StatusSolicitacao, string> = {
  pendente: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  em_analise: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  aprovada: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  recusada: 'bg-red-500/20 text-red-400 border-red-500/30',
  cancelada: 'bg-muted text-muted-foreground border-border',
};

const statusLabels: Record<StatusSolicitacao, string> = {
  pendente: 'Pendente',
  em_analise: 'Em Análise',
  aprovada: 'Aprovada',
  recusada: 'Recusada',
  cancelada: 'Cancelada',
};

const prioridadeLabels: Record<Prioridade, string> = {
  baixa: 'Baixa',
  normal: 'Normal',
  alta: 'Alta',
};

export default function Solicitacoes() {
  const { user } = useAuth();
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [anexo, setAnexo] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);

  // Form state
  const [tipo, setTipo] = useState<TipoSolicitacao>('declaracao_vinculo');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState<Prioridade>('normal');

  // Filter state
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [filterTipo, setFilterTipo] = useState<string>('todos');
  const [filterDateFrom, setFilterDateFrom] = useState<Date | undefined>();
  const [filterDateTo, setFilterDateTo] = useState<Date | undefined>();

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('solicitacoes')
      .select('id, tipo, descricao, status, prioridade, resposta, anexo_url, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setSolicitacoes(data as Solicitacao[]);
    if (error) console.error(error);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredSolicitacoes = useMemo(() => {
    return solicitacoes.filter((s) => {
      if (filterStatus !== 'todos' && s.status !== filterStatus) return false;
      if (filterTipo !== 'todos' && s.tipo !== filterTipo) return false;
      if (filterDateFrom) {
        const created = new Date(s.created_at);
        if (created < filterDateFrom) return false;
      }
      if (filterDateTo) {
        const created = new Date(s.created_at);
        const endOfDay = new Date(filterDateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (created > endOfDay) return false;
      }
      return true;
    });
  }, [solicitacoes, filterStatus, filterTipo, filterDateFrom, filterDateTo]);

  const hasActiveFilters = filterStatus !== 'todos' || filterTipo !== 'todos' || !!filterDateFrom || !!filterDateTo;

  const clearFilters = () => {
    setFilterStatus('todos');
    setFilterTipo('todos');
    setFilterDateFrom(undefined);
    setFilterDateTo(undefined);
  };

  const counts = {
    pendente: solicitacoes.filter(s => s.status === 'pendente' || s.status === 'em_analise').length,
    aprovada: solicitacoes.filter(s => s.status === 'aprovada').length,
    recusada: solicitacoes.filter(s => s.status === 'recusada').length,
  };

  const handleSubmit = async () => {
    if (!user || !descricao.trim()) {
      toast.error('Descreva o motivo da solicitação.');
      return;
    }
    setSubmitting(true);

    let anexoUrl: string | null = null;

    if (anexo) {
      const ext = anexo.name.split('.').pop() || 'bin';
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from('anexos')
        .upload(filePath, anexo, { upsert: false });

      if (uploadError) {
        toast.error('Erro ao enviar anexo: ' + uploadError.message);
        setSubmitting(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('anexos')
        .getPublicUrl(filePath);
      anexoUrl = urlData.publicUrl;
    }

    const { error } = await supabase.from('solicitacoes').insert({
      user_id: user.id,
      tipo,
      descricao: descricao.trim(),
      prioridade,
      anexo_url: anexoUrl,
    });

    if (error) {
      toast.error('Erro ao criar solicitação: ' + error.message);
    } else {
      toast.success('Solicitação criada com sucesso!');
      setDialogOpen(false);
      setDescricao('');
      setTipo('declaracao_vinculo');
      setPrioridade('normal');
      setAnexo(null);
      fetchData();
    }
    setSubmitting(false);
  };

  const handleCancel = async () => {
    if (!cancelId) return;
    const { error } = await supabase
      .from('solicitacoes')
      .update({ status: 'cancelada' as StatusSolicitacao })
      .eq('id', cancelId);

    if (error) {
      toast.error('Erro ao cancelar: ' + error.message);
    } else {
      toast.success('Solicitação cancelada.');
      fetchData();
    }
    setCancelId(null);
  };

  const openNewWithType = (t: TipoSolicitacao) => {
    setTipo(t);
    setDescricao('');
    setPrioridade('normal');
    setAnexo(null);
    setDialogOpen(true);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

  return (
    <PullToRefresh onRefresh={async () => { await fetchData(); }}>
    <div className="w-full max-w-5xl mx-auto space-y-6">
      <ModuleHeader 
        title="Minhas Solicitações" 
        description="Abra e acompanhe seus pedidos e requerimentos ao RH"
        icon={FileText}
        actions={
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={showFilters ? 'default' : 'outline'}
              className="gap-1.5 relative shadow-sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filtros</span>
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary" />
              )}
            </Button>
            <Button size="sm" className="gap-1.5 shadow-sm" onClick={() => openNewWithType('declaracao_vinculo')}>
              <Plus className="w-4 h-4" />
              Nova
            </Button>
          </div>
        }
      />

      {/* Contadores */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-border/50 shadow-md cursor-pointer transition-all hover:ring-1 hover:ring-primary/30"
          onClick={() => { setFilterStatus(filterStatus === 'pendente' ? 'todos' : 'pendente'); setShowFilters(true); }}>
          <CardContent className="flex flex-col items-center py-3 gap-1">
            <Clock className="w-5 h-5 text-amber-500" />
            <p className="text-2xl font-bold text-foreground">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : counts.pendente}
            </p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-md cursor-pointer transition-all hover:ring-1 hover:ring-primary/30"
          onClick={() => { setFilterStatus(filterStatus === 'aprovada' ? 'todos' : 'aprovada'); setShowFilters(true); }}>
          <CardContent className="flex flex-col items-center py-3 gap-1">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <p className="text-2xl font-bold text-foreground">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : counts.aprovada}
            </p>
            <p className="text-xs text-muted-foreground">Aprovadas</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-md cursor-pointer transition-all hover:ring-1 hover:ring-primary/30"
          onClick={() => { setFilterStatus(filterStatus === 'recusada' ? 'todos' : 'recusada'); setShowFilters(true); }}>
          <CardContent className="flex flex-col items-center py-3 gap-1">
            <XCircle className="w-5 h-5 text-red-500" />
            <p className="text-2xl font-bold text-foreground">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : counts.recusada}
            </p>
            <p className="text-xs text-muted-foreground">Recusadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros avançados */}
      {showFilters && (
        <Card className="border-border/50 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Filtros</p>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" className="text-xs h-7 text-muted-foreground" onClick={clearFilters}>
                  Limpar filtros
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {(Object.entries(statusLabels) as [StatusSolicitacao, string][]).map(([k, l]) => (
                      <SelectItem key={k} value={k}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo</Label>
                <Select value={filterTipo} onValueChange={setFilterTipo}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {(Object.entries(tipoLabels) as [TipoSolicitacao, string][]).map(([k, l]) => (
                      <SelectItem key={k} value={k}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Data início</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("h-9 w-full justify-start text-xs font-normal", !filterDateFrom && "text-muted-foreground")}>
                      <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                      {filterDateFrom ? format(filterDateFrom, 'dd/MM/yyyy') : 'De'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={filterDateFrom} onSelect={setFilterDateFrom} locale={ptBR} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Data fim</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("h-9 w-full justify-start text-xs font-normal", !filterDateTo && "text-muted-foreground")}>
                      <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                      {filterDateTo ? format(filterDateTo, 'dd/MM/yyyy') : 'Até'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={filterDateTo} onSelect={setFilterDateTo} locale={ptBR} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {hasActiveFilters && (
              <p className="text-xs text-muted-foreground">
                {filteredSolicitacoes.length} de {solicitacoes.length} solicitação(ões)
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="border-border/50 shadow-lg lg:sticky lg:top-20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Tipos de Solicitação
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(Object.entries(tipoLabels) as [TipoSolicitacao, string][]).map(([key, label]) => (
            <Button
              key={key}
              variant="ghost"
              className="w-full justify-start gap-3 h-12"
              onClick={() => openNewWithType(key)}
            >
              <FileText className="w-4 h-4 text-primary" />
              {label}
            </Button>
          ))}
        </CardContent>
      </Card>

        {/* Lista de solicitações */}
        <Card className="border-border/50 shadow-lg col-span-1 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Minhas Solicitações
              {hasActiveFilters && (
                <Badge variant="outline" className="ml-2 text-[10px] font-normal">
                  {filteredSolicitacoes.length} resultado(s)
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/40 space-y-2 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-32 rounded bg-muted/60" />
                      <div className="h-5 w-16 rounded-full bg-muted/60" />
                    </div>
                    <div className="h-3 w-full rounded bg-muted/40" />
                    <div className="h-3 w-2/3 rounded bg-muted/40" />
                    <div className="flex items-center justify-between">
                      <div className="h-3 w-24 rounded bg-muted/40" />
                      <div className="h-6 w-16 rounded bg-muted/40" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredSolicitacoes.length === 0 ? (
              <div className="py-6">
                <EmptyState 
                  icon={Inbox}
                  title="Nenhuma solicitação encontrada" 
                  description={hasActiveFilters ? 'Não encontramos registros com os filtros aplicados.' : 'Você ainda não possui solicitações registradas.'}
                >
                  {hasActiveFilters && (
                    <Button variant="outline" size="sm" className="mt-2" onClick={clearFilters}>
                      Limpar filtros
                    </Button>
                  )}
                </EmptyState>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredSolicitacoes.map((s) => (
                  <div key={s.id} className="p-3 rounded-lg bg-muted/30 border border-border/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{tipoLabels[s.tipo]}</p>
                      <Badge variant="outline" className={statusColors[s.status]}>
                        {statusLabels[s.status]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{s.descricao}</p>
                    {s.anexo_url && <AttachmentPreview url={s.anexo_url} />}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">{formatDate(s.created_at)} · {prioridadeLabels[s.prioridade]}</span>
                      {s.status === 'pendente' && (
                        <Button variant="ghost" size="sm" className="text-xs text-red-400 hover:text-red-300 h-7" onClick={() => setCancelId(s.id)}>
                          Cancelar
                        </Button>
                      )}
                    </div>
                    {s.resposta && (
                      <div className="p-2 rounded bg-muted/50 border border-border/30">
                        <p className="text-xs text-muted-foreground"><span className="font-medium">Resposta:</span> {s.resposta}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog nova solicitação */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Solicitação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoSolicitacao)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.entries(tipoLabels) as [TipoSolicitacao, string][]).map(([k, l]) => (
                    <SelectItem key={k} value={k}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <Select value={prioridade} onValueChange={(v) => setPrioridade(v as Prioridade)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                placeholder="Descreva o motivo e detalhes da solicitação..."
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Anexo (opcional)</Label>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file && file.size > 5 * 1024 * 1024) {
                    toast.error('O arquivo excede o limite de 5MB. Escolha um arquivo menor.');
                    e.target.value = '';
                    return;
                  }
                  setAnexo(file);
                }}
              />
              {anexo ? (
                <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/40">
                  <Paperclip className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs text-foreground truncate flex-1">{anexo.name}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {anexo.size < 1024 ? `${anexo.size} B` : anexo.size < 1048576 ? `${(anexo.size / 1024).toFixed(1)} KB` : `${(anexo.size / 1048576).toFixed(1)} MB`}
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setAnexo(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <Button variant="outline" size="sm" className="gap-1.5 w-full" onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="w-4 h-4" />
                  Anexar arquivo
                </Button>
              )}
              <p className="text-[10px] text-muted-foreground">PDF, imagens ou documentos (máx. 5MB)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmação de cancelamento */}
      <Dialog open={!!cancelId} onOpenChange={(open) => { if (!open) setCancelId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cancelar Solicitação</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja cancelar esta solicitação? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelId(null)}>Voltar</Button>
            <Button variant="destructive" onClick={handleCancel}>Confirmar Cancelamento</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </PullToRefresh>
  );
}
