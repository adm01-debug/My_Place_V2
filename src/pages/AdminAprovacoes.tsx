import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ShieldCheck, Palmtree, FileText, CheckCircle2, XCircle, Loader2, Clock, User, Paperclip, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { toast } from 'sonner';

interface ProfileInfo {
  nome: string;
  cargo: string | null;
  departamento: string | null;
}

interface FeriasRequest {
  id: string;
  user_id: string;
  data_inicio: string;
  data_fim: string;
  dias: number;
  tipo: string;
  status: string;
  observacao: string | null;
  created_at: string;
  profile?: ProfileInfo;
}

interface SolicitacaoRequest {
  id: string;
  user_id: string;
  tipo: string;
  descricao: string;
  status: string;
  prioridade: string;
  anexo_url: string | null;
  created_at: string;
  profile?: ProfileInfo;
}

const tipoFeriasLabels: Record<string, string> = {
  regular: 'Regular',
  abono_pecuniario: 'Abono Pecuniário',
  fracionada: 'Fracionada',
};

const tipoSolicitacaoLabels: Record<string, string> = {
  declaracao_vinculo: 'Declaração de Vínculo',
  alteracao_dados: 'Alteração de Dados',
  adiantamento_salarial: 'Adiantamento Salarial',
  carta_recomendacao: 'Carta de Recomendação',
  outros: 'Outros',
};

const prioridadeColors: Record<string, string> = {
  baixa: 'bg-muted text-muted-foreground',
  normal: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  alta: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const formatDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('pt-BR');

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
        .select('id, user_id, tipo, descricao, status, prioridade, anexo_url, created_at')
        .in('status', ['pendente', 'em_analise', 'aprovada', 'recusada'])
        .order('created_at', { ascending: false })
        .limit(50),
    ]);

    // Collect unique user_ids and fetch profiles
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

  const handleAction = async () => {
    if (!actionDialog || !user) return;
    setSubmitting(true);

    const isAprovar = actionDialog.action === 'aprovar';
    const table = actionDialog.type === 'ferias' ? 'solicitacoes_ferias' : 'solicitacoes';
    const newStatus = isAprovar
      ? 'aprovada'
      : 'recusada';

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

  const feriasPendentes = ferias.filter(f => f.status === 'pendente');
  const solicitacoesPendentes = solicitacoes.filter(s => s.status === 'pendente' || s.status === 'em_analise');
  const totalPendentes = feriasPendentes.length + solicitacoesPendentes.length;

  return (
    <div className="w-full max-w-3xl mx-auto p-4 pt-6 pb-20 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Painel de Aprovações</h1>
        <p className="text-sm text-muted-foreground">
          {totalPendentes > 0
            ? `${totalPendentes} solicitação(ões) pendente(s) aguardando análise`
            : 'Nenhuma solicitação pendente'}
        </p>
      </div>

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

        {/* Férias Tab */}
        <TabsContent value="ferias" className="space-y-3 mt-4">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : ferias.length === 0 ? (
            <EmptyState text="Nenhuma solicitação de férias encontrada." />
          ) : (
            ferias.map((f) => (
              <Card key={f.id} className={`border-border/50 shadow-md ${f.status === 'pendente' ? 'ring-1 ring-amber-500/30' : ''}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{f.profile?.nome || 'Colaborador'}</p>
                        <p className="text-xs text-muted-foreground">{f.profile?.cargo} · {f.profile?.departamento}</p>
                      </div>
                    </div>
                    <StatusBadge status={f.status} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Início</p>
                      <p className="text-sm font-semibold text-foreground">{formatDate(f.data_inicio)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Fim</p>
                      <p className="text-sm font-semibold text-foreground">{formatDate(f.data_fim)}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-muted/30">
                      <p className="text-xs text-muted-foreground">Dias</p>
                      <p className="text-sm font-semibold text-foreground">{f.dias}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{tipoFeriasLabels[f.tipo] || f.tipo}</span>
                    {f.status === 'pendente' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1 text-red-400 hover:text-red-300 border-red-500/30"
                          onClick={() => setActionDialog({ type: 'ferias', id: f.id, action: 'recusar' })}>
                          <XCircle className="w-3.5 h-3.5" /> Recusar
                        </Button>
                        <Button size="sm" className="h-8 text-xs gap-1"
                          onClick={() => setActionDialog({ type: 'ferias', id: f.id, action: 'aprovar' })}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Solicitações Tab */}
        <TabsContent value="solicitacoes" className="space-y-3 mt-4">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : solicitacoes.length === 0 ? (
            <EmptyState text="Nenhuma solicitação geral encontrada." />
          ) : (
            solicitacoes.map((s) => (
              <Card key={s.id} className={`border-border/50 shadow-md ${s.status === 'pendente' ? 'ring-1 ring-amber-500/30' : ''}`}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                        <User className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{s.profile?.nome || 'Colaborador'}</p>
                        <p className="text-xs text-muted-foreground">{s.profile?.cargo} · {s.profile?.departamento}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={prioridadeColors[s.prioridade] || ''}>
                        {s.prioridade}
                      </Badge>
                      <StatusBadge status={s.status} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">{tipoSolicitacaoLabels[s.tipo] || s.tipo}</p>
                    <p className="text-sm text-foreground line-clamp-2">{s.descricao}</p>
                    {s.anexo_url && (
                      <a href={s.anexo_url} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                        <Paperclip className="w-3 h-3" /> Anexo <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString('pt-BR')}</span>
                    {(s.status === 'pendente' || s.status === 'em_analise') && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-8 text-xs gap-1 text-red-400 hover:text-red-300 border-red-500/30"
                          onClick={() => setActionDialog({ type: 'solicitacao', id: s.id, action: 'recusar' })}>
                          <XCircle className="w-3.5 h-3.5" /> Recusar
                        </Button>
                        <Button size="sm" className="h-8 text-xs gap-1"
                          onClick={() => setActionDialog({ type: 'solicitacao', id: s.id, action: 'aprovar' })}>
                          <CheckCircle2 className="w-3.5 h-3.5" /> Aprovar
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de confirmação */}
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
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    pendente: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    em_analise: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    aprovada: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    recusada: 'bg-red-500/20 text-red-400 border-red-500/30',
    cancelada: 'bg-muted text-muted-foreground border-border',
  };
  const labels: Record<string, string> = {
    pendente: 'Pendente', em_analise: 'Em Análise', aprovada: 'Aprovada', recusada: 'Recusada', cancelada: 'Cancelada',
  };
  return <Badge variant="outline" className={colors[status] || ''}>{labels[status] || status}</Badge>;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center py-8 text-muted-foreground">
      <Clock className="w-8 h-8 mb-2 opacity-40" />
      <p className="text-sm">{text}</p>
    </div>
  );
}
