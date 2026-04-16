import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Clock, CheckCircle2, XCircle, Loader2, AlertCircle, Search, Paperclip, X, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

  const [tipo, setTipo] = useState<TipoSolicitacao>('declaracao_vinculo');
  const [descricao, setDescricao] = useState('');
  const [prioridade, setPrioridade] = useState<Prioridade>('normal');

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('solicitacoes')
      .select('id, tipo, descricao, status, prioridade, resposta, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setSolicitacoes(data as Solicitacao[]);
    if (error) console.error(error);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

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
    const { error } = await supabase.from('solicitacoes').insert({
      user_id: user.id,
      tipo,
      descricao: descricao.trim(),
      prioridade,
    });

    if (error) {
      toast.error('Erro ao criar solicitação: ' + error.message);
    } else {
      toast.success('Solicitação criada com sucesso!');
      setDialogOpen(false);
      setDescricao('');
      setTipo('declaracao_vinculo');
      setPrioridade('normal');
      fetchData();
    }
    setSubmitting(false);
  };

  const handleCancel = async (id: string) => {
    const { error } = await supabase
      .from('solicitacoes')
      .update({ status: 'cancelada' as StatusSolicitacao })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao cancelar: ' + error.message);
    } else {
      toast.success('Solicitação cancelada.');
      fetchData();
    }
  };

  const openNewWithType = (t: TipoSolicitacao) => {
    setTipo(t);
    setDescricao('');
    setPrioridade('normal');
    setDialogOpen(true);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

  return (
    <div className="w-full max-w-lg mx-auto p-4 pt-6 pb-20 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Solicitações</h1>
          <p className="text-sm text-muted-foreground">Abra e acompanhe seus pedidos</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => openNewWithType('declaracao_vinculo')}>
          <Plus className="w-4 h-4" />
          Nova
        </Button>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-border/50 shadow-md">
          <CardContent className="flex flex-col items-center py-3 gap-1">
            <Clock className="w-5 h-5 text-amber-500" />
            <p className="text-2xl font-bold text-foreground">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : counts.pendente}
            </p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-md">
          <CardContent className="flex flex-col items-center py-3 gap-1">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <p className="text-2xl font-bold text-foreground">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : counts.aprovada}
            </p>
            <p className="text-xs text-muted-foreground">Aprovadas</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-md">
          <CardContent className="flex flex-col items-center py-3 gap-1">
            <XCircle className="w-5 h-5 text-red-500" />
            <p className="text-2xl font-bold text-foreground">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : counts.recusada}
            </p>
            <p className="text-xs text-muted-foreground">Recusadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Tipos de solicitação */}
      <Card className="border-border/50 shadow-lg">
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
      <Card className="border-border/50 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Minhas Solicitações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : solicitacoes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma solicitação registrada.
            </p>
          ) : (
            solicitacoes.map((s) => (
              <div key={s.id} className="p-3 rounded-lg bg-muted/30 border border-border/40 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{tipoLabels[s.tipo]}</p>
                  <Badge variant="outline" className={statusColors[s.status]}>
                    {statusLabels[s.status]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{s.descricao}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{formatDate(s.created_at)} · {prioridadeLabels[s.prioridade]}</span>
                  {s.status === 'pendente' && (
                    <Button variant="ghost" size="sm" className="text-xs text-red-400 hover:text-red-300 h-7" onClick={() => handleCancel(s.id)}>
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
            ))
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}
