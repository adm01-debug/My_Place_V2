import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Palmtree, CalendarDays, Plus, Clock, Loader2 } from 'lucide-react';
import { PullToRefresh } from '@/components/portal/PullToRefresh';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { Enums } from '@/integrations/supabase/types';

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
  tipo: Enums<'tipo_ferias'>;
  status: Enums<'status_ferias'>;
  observacao: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pendente: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  aprovada: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  recusada: 'bg-red-500/20 text-red-400 border-red-500/30',
  cancelada: 'bg-muted text-muted-foreground border-border',
};

const statusLabels: Record<string, string> = {
  pendente: 'Pendente',
  aprovada: 'Aprovada',
  recusada: 'Recusada',
  cancelada: 'Cancelada',
};

const tipoLabels: Record<string, string> = {
  regular: 'Regular',
  abono_pecuniario: 'Abono Pecuniário',
  fracionada: 'Fracionada',
};

function calcDays(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
}

export default function Ferias() {
  const { user } = useAuth();
  const [saldo, setSaldo] = useState<SaldoFerias | null>(null);
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoFerias[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [tipo, setTipo] = useState<Enums<'tipo_ferias'>>('regular');
  const [observacao, setObservacao] = useState('');

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
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
        setSaldo(saldoRes.data[0] as SaldoFerias);
      }
      if (solRes.data) {
        setSolicitacoes(solRes.data as SolicitacaoFerias[]);
      }
    } catch (err) {
      console.error('Erro ao carregar férias:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async () => {
    if (!user || !dataInicio || !dataFim) {
      toast.error('Preencha as datas de início e fim.');
      return;
    }

    const dias = calcDays(dataInicio, dataFim);
    if (dias < 5) {
      toast.error('O período mínimo de férias é de 5 dias.');
      return;
    }
    
    // Check if start date is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(dataInicio) < today) {
      toast.error('A data de início não pode ser anterior a hoje.');
      return;
    }

    if (saldo && dias > saldo.dias_disponiveis) {
      toast.error(`Saldo insuficiente. Disponível: ${saldo.dias_disponiveis} dias.`);
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('solicitacoes_ferias').insert({
      user_id: user.id,
      data_inicio: dataInicio,
      data_fim: dataFim,
      dias,
      tipo,
      observacao: observacao || null,
    });

    if (error) {
      toast.error('Erro ao enviar solicitação: ' + error.message);
    } else {
      toast.success('Solicitação de férias enviada com sucesso!');
      setDialogOpen(false);
      setDataInicio('');
      setDataFim('');
      setTipo('regular');
      setObservacao('');
      fetchData();
    }
    setSubmitting(false);
  };

  const handleCancel = async (id: string) => {
    const { error } = await supabase
      .from('solicitacoes_ferias')
      .update({ status: 'cancelada' as Enums<'status_ferias'> })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao cancelar: ' + error.message);
    } else {
      toast.success('Solicitação cancelada.');
      fetchData();
    }
  };

  const diasForm = dataInicio && dataFim ? calcDays(dataInicio, dataFim) : 0;

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  const periodoLabel = saldo
    ? `${new Date(saldo.periodo_aquisitivo_inicio + 'T00:00:00').getFullYear()}/${new Date(saldo.periodo_aquisitivo_fim + 'T00:00:00').getFullYear()}`
    : '—';

  const stats = [
    {
      label: 'Saldo Disponível',
      value: saldo ? `${saldo.dias_disponiveis} dias` : '—',
      icon: Palmtree,
      color: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      label: 'Período Aquisitivo',
      value: periodoLabel,
      icon: CalendarDays,
      color: 'text-blue-500 bg-blue-500/10',
    },
    {
      label: 'Próximo Vencimento',
      value: saldo ? formatDate(saldo.proximo_vencimento) : '—',
      icon: Clock,
      color: 'text-amber-500 bg-amber-500/10',
    },
  ];

  const usagePercent = saldo && saldo.dias_direito > 0
    ? Math.round(((saldo.dias_usados + saldo.dias_pendentes) / saldo.dias_direito) * 100)
    : 0;

  return (
    <PullToRefresh onRefresh={async () => { await fetchData(); }}>
    <div className="w-full max-w-4xl mx-auto p-4 pt-6 pb-20 space-y-6">
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

      {/* Balance Card */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4 rounded-lg border border-border/50 animate-pulse flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-muted/60" />
              <div className="space-y-1 flex-1">
                <div className="h-3 w-24 rounded bg-muted/40" />
                <div className="h-5 w-16 rounded bg-muted/60" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {stats.map(({ label, value, icon: Icon, color }) => {
              const [iconColor, bgColor] = color.split(' ');
              return (
                <Card key={label} className="border-border/50 shadow-md">
                  <CardContent className="flex items-center gap-4 py-4">
                    <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${bgColor}`}>
                      <Icon className={`w-5 h-5 ${iconColor}`} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-lg font-semibold text-foreground">{value}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {saldo && saldo.dias_direito > 0 && (
            <Card className="border-border/50 shadow-md">
              <CardContent className="py-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Utilização do período</span>
                  <span className="font-medium text-foreground">{usagePercent}%</span>
                </div>
                <Progress value={usagePercent} className="h-2" />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{saldo.dias_usados} usados + {saldo.dias_pendentes} pendentes</span>
                  <span>{saldo.dias_disponiveis} disponíveis</span>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-border/50 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Histórico de Solicitações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(i => (
                <div key={i} className="p-3 rounded-lg bg-muted/30 border border-border/40 animate-pulse flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="h-4 w-36 rounded bg-muted/60" />
                    <div className="h-3 w-24 rounded bg-muted/40" />
                  </div>
                  <div className="h-5 w-16 rounded-full bg-muted/60" />
                </div>
              ))}
            </div>
          ) : solicitacoes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma solicitação de férias registrada.
            </p>
          ) : (
            solicitacoes.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/40">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(s.data_inicio)} — {formatDate(s.data_fim)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {s.dias} dias · {tipoLabels[s.tipo] || s.tipo}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={statusColors[s.status] || ''}>
                    {statusLabels[s.status] || s.status}
                  </Badge>
                  {s.status === 'pendente' && (
                    <Button variant="ghost" size="sm" className="text-xs text-red-400 hover:text-red-300" onClick={() => handleCancel(s.id)}>
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>

      {/* Dialog de nova solicitação */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Solicitação de Férias</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="data_inicio">Data Início</Label>
                <Input id="data_inicio" type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="data_fim">Data Fim</Label>
                <Input id="data_fim" type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
              </div>
            </div>
            {diasForm > 0 && (
              <p className="text-sm text-muted-foreground">
                Período: <span className="font-semibold text-foreground">{diasForm} dias</span>
                {saldo && <span> (disponível: {saldo.dias_disponiveis})</span>}
              </p>
            )}
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as Enums<'tipo_ferias'>)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="abono_pecuniario">Abono Pecuniário</SelectItem>
                  <SelectItem value="fracionada">Fracionada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="observacao">Observação (opcional)</Label>
              <Textarea id="observacao" placeholder="Motivo ou detalhes..." value={observacao} onChange={(e) => setObservacao(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enviar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </PullToRefresh>
  );
}
