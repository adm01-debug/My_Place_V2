import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Palmtree, CalendarDays, Plus, Clock, Loader2, XCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SaldoFerias {
  dias_direito: number;
  dias_usados: number;
  dias_pendentes: number;
  dias_disponiveis: number;
  periodo_aquisitivo_inicio: string;
  periodo_aquisitivo_fim: string;
  proximo_vencimento: string;
}

interface SolicitacaoFerias {
  id: string;
  data_inicio: string;
  data_fim: string;
  dias: number;
  tipo: string;
  status: string;
  observacao: string | null;
  created_at: string;
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: typeof CheckCircle2 }> = {
  pendente: { label: 'Pendente', variant: 'outline', icon: Clock },
  aprovada: { label: 'Aprovada', variant: 'default', icon: CheckCircle2 },
  recusada: { label: 'Recusada', variant: 'destructive', icon: XCircle },
  cancelada: { label: 'Cancelada', variant: 'secondary', icon: XCircle },
};

const tipoLabels: Record<string, string> = {
  regular: 'Regular',
  abono_pecuniario: 'Abono Pecuniário',
  fracionada: 'Fracionada',
};

const formatDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

export default function Ferias() {
  const { user } = useAuth();
  const [saldo, setSaldo] = useState<SaldoFerias | null>(null);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoFerias[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ data_inicio: '', data_fim: '', tipo: 'regular', observacao: '' });

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [saldoRes, solRes] = await Promise.all([
        supabase.rpc('fn_calcular_saldo_ferias', { p_user_id: user.id }),
        supabase
          .from('solicitacoes_ferias')
          .select('id, data_inicio, data_fim, dias, tipo, status, observacao, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (saldoRes.data && saldoRes.data.length > 0) {
        setSaldo(saldoRes.data[0] as unknown as SaldoFerias);
      }
      if (!solRes.error) {
        setSolicitacoes((solRes.data as SolicitacaoFerias[]) || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const calcDias = () => {
    if (!form.data_inicio || !form.data_fim) return 0;
    const start = new Date(form.data_inicio + 'T00:00:00');
    const end = new Date(form.data_fim + 'T00:00:00');
    const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 0;
  };

  const handleSubmit = async () => {
    const dias = calcDias();
    if (!form.data_inicio || !form.data_fim) { toast.error('Informe as datas.'); return; }
    if (dias < 5) { toast.error('Mínimo de 5 dias para férias.'); return; }
    if (dias > 30) { toast.error('Máximo de 30 dias por solicitação.'); return; }
    if (saldo && dias > saldo.dias_disponiveis) {
      toast.error(`Saldo insuficiente. Disponível: ${saldo.dias_disponiveis} dias.`);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase.from('solicitacoes_ferias').insert({
        user_id: user!.id,
        data_inicio: form.data_inicio,
        data_fim: form.data_fim,
        dias,
        tipo: form.tipo as 'regular' | 'abono_pecuniario' | 'fracionada',
        observacao: form.observacao || null,
      });
      if (error) throw error;
      toast.success('Solicitação de férias enviada!');
      setDialogOpen(false);
      setForm({ data_inicio: '', data_fim: '', tipo: 'regular', observacao: '' });
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao enviar solicitação.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      const { error } = await supabase
        .from('solicitacoes_ferias')
        .update({ status: 'cancelada' as const })
        .eq('id', id);
      if (error) throw error;
      toast.success('Solicitação cancelada.');
      await fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao cancelar.');
    }
  };

  const dias = calcDias();

  return (
    <div className="w-full max-w-lg mx-auto p-4 pt-6 pb-20 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Férias</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas férias e folgas</p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4" />
          Solicitar
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-3">
            <Card className="border-border/50 shadow-md">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-emerald-500/10">
                  <Palmtree className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo Disponível</p>
                  <p className="text-lg font-semibold text-foreground">
                    {saldo ? `${saldo.dias_disponiveis} dias` : '—'}
                  </p>
                </div>
                {saldo && saldo.dias_pendentes > 0 && (
                  <Badge variant="outline" className="ml-auto text-xs">
                    {saldo.dias_pendentes}d pendentes
                  </Badge>
                )}
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-md">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-500/10">
                  <CalendarDays className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Período Aquisitivo</p>
                  <p className="text-lg font-semibold text-foreground">
                    {saldo ? `${formatDate(saldo.periodo_aquisitivo_inicio)} — ${formatDate(saldo.periodo_aquisitivo_fim)}` : '—'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-md">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-amber-500/10">
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Próximo Vencimento</p>
                  <p className="text-lg font-semibold text-foreground">
                    {saldo ? formatDate(saldo.proximo_vencimento) : '—'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {saldo && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-accent/20 rounded-lg p-2.5">
                  <p className="text-xs text-muted-foreground">Direito</p>
                  <p className="text-sm font-bold text-foreground">{saldo.dias_direito}d</p>
                </div>
                <div className="bg-accent/20 rounded-lg p-2.5">
                  <p className="text-xs text-muted-foreground">Usados</p>
                  <p className="text-sm font-bold text-foreground">{saldo.dias_usados}d</p>
                </div>
                <div className="bg-accent/20 rounded-lg p-2.5">
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                  <p className="text-sm font-bold text-foreground">{saldo.dias_pendentes}d</p>
                </div>
              </div>
            )}
          </div>

          {/* Requests History */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Histórico de Solicitações ({solicitacoes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {solicitacoes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma solicitação de férias registrada.
                </p>
              ) : (
                solicitacoes.map((sol) => {
                  const cfg = statusConfig[sol.status] || statusConfig.pendente;
                  const StatusIcon = cfg.icon;
                  return (
                    <div key={sol.id} className="border-b border-border/30 last:border-0 pb-3 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="w-4 h-4" />
                          <span className="text-sm font-medium text-foreground">
                            {formatDate(sol.data_inicio)} — {formatDate(sol.data_fim)}
                          </span>
                        </div>
                        <Badge variant={cfg.variant} className="text-[10px]">
                          {cfg.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{sol.dias} dias</span>
                        <span>•</span>
                        <span>{tipoLabels[sol.tipo] || sol.tipo}</span>
                      </div>
                      {sol.observacao && (
                        <p className="text-xs text-muted-foreground mt-1 italic">"{sol.observacao}"</p>
                      )}
                      {sol.status === 'pendente' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-1 h-7 text-xs text-destructive hover:text-destructive"
                          onClick={() => handleCancel(sol.id)}
                        >
                          Cancelar Solicitação
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* New Request Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Solicitar Férias</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {saldo && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-accent/20">
                <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-xs text-muted-foreground">
                  Saldo disponível: <strong className="text-foreground">{saldo.dias_disponiveis} dias</strong>
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="dt_inicio">Data Início</Label>
                <Input
                  id="dt_inicio"
                  type="date"
                  value={form.data_inicio}
                  onChange={(e) => setForm((f) => ({ ...f, data_inicio: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="dt_fim">Data Fim</Label>
                <Input
                  id="dt_fim"
                  type="date"
                  value={form.data_fim}
                  min={form.data_inicio}
                  onChange={(e) => setForm((f) => ({ ...f, data_fim: e.target.value }))}
                />
              </div>
            </div>
            {dias > 0 && (
              <p className="text-sm text-center font-medium text-primary">{dias} dias selecionados</p>
            )}
            <div>
              <Label>Tipo</Label>
              <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular (30 dias)</SelectItem>
                  <SelectItem value="fracionada">Fracionada</SelectItem>
                  <SelectItem value="abono_pecuniario">Abono Pecuniário (venda)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="obs">Observação (opcional)</Label>
              <Textarea
                id="obs"
                value={form.observacao}
                onChange={(e) => setForm((f) => ({ ...f, observacao: e.target.value }))}
                placeholder="Informações adicionais..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={saving} className="gap-1.5">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Enviar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
