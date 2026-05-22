import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShieldCheck, Palmtree, FileText, Loader2, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { toast } from 'sonner';
import { AprovacaoFeriasCard, type FeriasRequest, type ProfileInfo } from '@/components/admin/AprovacaoFeriasCard';
import { AprovacaoSolicitacaoCard, type SolicitacaoRequest } from '@/components/admin/AprovacaoSolicitacaoCard';
import { PullToRefresh } from '@/components/portal/PullToRefresh';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
function SkeletonCards() {
  return (
    <div className="space-y-3">
      {[1, 2].map(i => (
        <div key={i} className="p-4 rounded-lg border border-border/50 animate-pulse space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-muted/60" />
            <div className="space-y-1 flex-1">
              <div className="h-4 w-28 rounded bg-muted/60" />
              <div className="h-3 w-40 rounded bg-muted/40" />
            </div>
            <div className="h-5 w-16 rounded-full bg-muted/60" />
          </div>
          <div className="h-3 w-full rounded bg-muted/40" />
          <div className="h-3 w-2/3 rounded bg-muted/40" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center py-8 text-muted-foreground">
      <Clock className="w-8 h-8 mb-2 opacity-40" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

function StatusFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 w-36 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="todos">Todos</SelectItem>
        <SelectItem value="pendente">Pendentes</SelectItem>
        <SelectItem value="aprovada">Aprovadas</SelectItem>
        <SelectItem value="recusada">Recusadas</SelectItem>
      </SelectContent>
    </Select>
  );
}

export default function AdminAprovacoes() {
  const { user } = useAuth();
  const { isAdmin, isGestor } = useUserRoles();
  const hasAccess = isAdmin || isGestor;

  const [ferias, setFerias] = useState<FeriasRequest[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionDialog, setActionDialog] = useState<{ type: 'ferias' | 'solicitacao'; id: string; action: 'aprovar' | 'recusar' } | null>(null);
  const [resposta, setResposta] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feriasStatusFilter, setFeriasStatusFilter] = useState<string>('pendente');
  const [solicitacoesStatusFilter, setSolicitacoesStatusFilter] = useState<string>('pendente');

  const fetchData = useCallback(async () => {
    if (!user || !hasAccess) return;
    setLoading(true);

    const [fRes, sRes] = await Promise.all([
      supabase
        .from('solicitacoes_ferias')
        .select('id, user_id, data_inicio, data_fim, dias, tipo, status, observacao, created_at')
        .in('status', ['pendente', 'aprovada', 'recusada'])
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('solicitacoes')
        .select('id, user_id, tipo, descricao, status, prioridade, valor, anexo_url, created_at')
        .in('status', ['pendente', 'em_analise', 'aprovada', 'recusada'])
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    const allUserIds = [
      ...(fRes.data || []).map(r => r.user_id),
      ...(sRes.data || []).map(r => r.user_id),
    ].filter((v, i, a) => a.indexOf(v) === i);

    const profileMap: Record<string, ProfileInfo> = {};
    if (allUserIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome, cargo, departamento')
        .in('id', allUserIds);
      if (profiles) {
        profiles.forEach(p => { profileMap[p.id] = { nome: p.nome, cargo: p.cargo, departamento: p.departamento }; });
      }
    }

    if (fRes.data) setFerias(fRes.data.map(r => ({ ...r, profile: profileMap[r.user_id] } as FeriasRequest)));
    if (sRes.data) setSolicitacoes(sRes.data.map(r => ({ ...r, profile: profileMap[r.user_id] } as SolicitacaoRequest)));
    setLoading(false);
  }, [user, hasAccess]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const feriasPendentes = ferias.filter(f => f.status === 'pendente');
  const solicitacoesPendentes = solicitacoes.filter(s => s.status === 'pendente' || s.status === 'em_analise');
  const totalPendentes = feriasPendentes.length + solicitacoesPendentes.length;

  const filteredFerias = useMemo(() =>
    feriasStatusFilter === 'todos' ? ferias : ferias.filter(f => f.status === feriasStatusFilter),
    [ferias, feriasStatusFilter]
  );

  const filteredSolicitacoes = useMemo(() =>
    solicitacoesStatusFilter === 'todos' ? solicitacoes : solicitacoes.filter(s => s.status === solicitacoesStatusFilter),
    [solicitacoes, solicitacoesStatusFilter]
  );

  const handleAction = async () => {
    if (!actionDialog || !user) return;
    setSubmitting(true);

    const isAprovar = actionDialog.action === 'aprovar';
    const table = actionDialog.type === 'ferias' ? 'solicitacoes_ferias' : 'solicitacoes';
    const newStatus = isAprovar ? 'aprovada' : 'recusada';

    const updateData: Record<string, unknown> = {
      status: newStatus,
      aprovado_por: user.id,
      aprovado_em: new Date().toISOString(),
    };

    if (actionDialog.type === 'solicitacao' && resposta.trim()) {
      updateData.resposta = resposta.trim();
    }

    const { error } = await supabase
      .from(table)
      .update(updateData)
      .eq('id', actionDialog.id);

    if (error) {
      toast.error('Erro: ' + error.message);
    } else {
      // Criar notificação para o usuário
      const requestData = actionDialog.type === 'ferias' 
        ? ferias.find(f => f.id === actionDialog.id)
        : solicitacoes.find(s => s.id === actionDialog.id);
      
      if (requestData) {
        await supabase.from('notificacoes').insert({
          user_id: requestData.user_id,
          titulo: `Sua solicitação foi ${isAprovar ? 'aprovada' : 'recusada'}`,
          mensagem: `Sua solicitação de ${actionDialog.type === 'ferias' ? 'férias' : 'RH'} foi processada pelo RH.`,
          tipo: isAprovar ? 'sucesso' : 'alerta',
          link: actionDialog.type === 'ferias' ? '/ferias' : '/solicitacoes'
        });
      }

      toast.success(`Solicitação ${isAprovar ? 'aprovada' : 'recusada'} com sucesso!`);
      setActionDialog(null);
      setResposta('');
      fetchData();
    }
    setSubmitting(false);
  };

  if (!hasAccess) {
    return (
      <div className="w-full max-w-lg mx-auto p-4 pt-20 text-center">
        <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold text-foreground">Acesso Restrito</h2>
        <p className="text-sm text-muted-foreground mt-1">Este painel é exclusivo para administradores e gestores.</p>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={async () => { await fetchData(); }}>
      <div className="w-full max-w-5xl mx-auto p-4 pt-6 pb-20 space-y-6">
        <ModuleHeader 
          title="Painel de Aprovações" 
          description={totalPendentes > 0
            ? `${totalPendentes} solicitação(ões) pendente(s) aguardando análise`
            : 'Nenhuma solicitação pendente'}
          icon={ShieldCheck}
          actions={
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => fetchData()}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          }
        />

        <Tabs defaultValue="ferias" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="ferias" className="gap-1.5">
              <Palmtree className="w-4 h-4" />
              Férias
              {feriasPendentes.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">{feriasPendentes.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="solicitacoes" className="gap-1.5">
              <FileText className="w-4 h-4" />
              Solicitações
              {solicitacoesPendentes.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">{solicitacoesPendentes.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ferias" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{filteredFerias.length} resultado(s)</p>
              <StatusFilter value={feriasStatusFilter} onChange={setFeriasStatusFilter} />
            </div>
            {loading ? <SkeletonCards /> : filteredFerias.length === 0 ? (
              <EmptyState text="Nenhuma solicitação de férias encontrada." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFerias.map(f => (
                  <AprovacaoFeriasCard key={f.id} ferias={f} onAction={setActionDialog} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="solicitacoes" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{filteredSolicitacoes.length} resultado(s)</p>
              <StatusFilter value={solicitacoesStatusFilter} onChange={setSolicitacoesStatusFilter} />
            </div>
            {loading ? <SkeletonCards /> : filteredSolicitacoes.length === 0 ? (
              <EmptyState text="Nenhuma solicitação geral encontrada." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSolicitacoes.map(s => (
                  <AprovacaoSolicitacaoCard key={s.id} solicitacao={s} onAction={setActionDialog} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Dialog open={!!actionDialog} onOpenChange={(open) => { if (!open) { setActionDialog(null); setResposta(''); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {actionDialog?.action === 'aprovar' ? '✅ Confirmar Aprovação' : '❌ Confirmar Recusa'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {actionDialog?.action === 'aprovar'
                  ? 'Tem certeza que deseja aprovar esta solicitação?'
                  : 'Tem certeza que deseja recusar esta solicitação?'}
              </p>
              {actionDialog?.type === 'solicitacao' && (
                <div className="space-y-1.5">
                  <Label>Resposta (opcional)</Label>
                  <Textarea
                    placeholder="Adicione uma resposta ou motivo..."
                    value={resposta}
                    onChange={(e) => setResposta(e.target.value)}
                    rows={2}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setActionDialog(null); setResposta(''); }}>Cancelar</Button>
              <Button
                variant={actionDialog?.action === 'recusar' ? 'destructive' : 'default'}
                onClick={handleAction}
                disabled={submitting}
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                {actionDialog?.action === 'aprovar' ? 'Aprovar' : 'Recusar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PullToRefresh>
  );
}
