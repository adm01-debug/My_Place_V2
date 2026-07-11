import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { Receipt, Plus, Loader2, Paperclip, Trash2, CheckCircle2, XCircle, Clock, DollarSign } from 'lucide-react';

type Categoria = 'viagem' | 'alimentacao' | 'transporte' | 'hospedagem' | 'material' | 'outros';
type Status = 'pendente' | 'em_analise' | 'aprovado' | 'pago' | 'recusado' | 'cancelado';

interface Reembolso {
  id: string;
  user_id: string;
  categoria: Categoria;
  descricao: string;
  valor: number;
  data_despesa: string;
  anexo_url: string | null;
  status: Status;
  observacao_gestor: string | null;
  created_at: string;
}

const CATEGORIAS: Record<Categoria, string> = {
  viagem: '✈️ Viagem',
  alimentacao: '🍽️ Alimentação',
  transporte: '🚗 Transporte',
  hospedagem: '🏨 Hospedagem',
  material: '📦 Material',
  outros: '📌 Outros',
};

const STATUS_META: Record<Status, { label: string; className: string }> = {
  pendente: { label: 'Pendente', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
  em_analise: { label: 'Em Análise', className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  aprovado: { label: 'Aprovado', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
  pago: { label: 'Pago', className: 'bg-emerald-600/10 text-emerald-700 border-emerald-600/30' },
  recusado: { label: 'Recusado', className: 'bg-red-500/10 text-red-600 border-red-500/20' },
  cancelado: { label: 'Cancelado', className: 'bg-muted text-muted-foreground border-border' },
};

export default function Reembolsos() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [categoria, setCategoria] = useState<Categoria>('viagem');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState('');
  const [dataDespesa, setDataDespesa] = useState(new Date().toISOString().split('T')[0]);
  const [anexo, setAnexo] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: reembolsos = [], isLoading } = useQuery({
    queryKey: ['reembolsos', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reembolsos')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Reembolso[];
    },
    enabled: !!user,
  });

  const metrics = useMemo(() => {
    const total = reembolsos.reduce((s, r) => s + Number(r.valor), 0);
    const aprovados = reembolsos.filter(r => r.status === 'aprovado' || r.status === 'pago').reduce((s, r) => s + Number(r.valor), 0);
    const pendentes = reembolsos.filter(r => r.status === 'pendente' || r.status === 'em_analise').length;
    return { total, aprovados, pendentes, count: reembolsos.length };
  }, [reembolsos]);

  const criar = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Não autenticado');
      const valorNum = parseFloat(valor.replace(',', '.'));
      if (!valorNum || valorNum <= 0) throw new Error('Valor inválido');
      if (descricao.trim().length < 3) throw new Error('Descrição muito curta');

      let anexoUrl: string | null = null;
      if (anexo) {
        if (anexo.size > 5 * 1024 * 1024) throw new Error('Anexo maior que 5MB');
        const ext = anexo.name.split('.').pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('anexos').upload(path, anexo);
        if (upErr) throw upErr;
        const { data: signed } = await supabase.storage.from('anexos').createSignedUrl(path, 60 * 60 * 24 * 365);
        anexoUrl = signed?.signedUrl ?? path;
      }

      const { error } = await supabase.from('reembolsos').insert({
        user_id: user.id,
        categoria,
        descricao: descricao.trim(),
        valor: valorNum,
        data_despesa: dataDespesa,
        anexo_url: anexoUrl,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Reembolso enviado!', description: 'Aguarde a análise do gestor.' });
      qc.invalidateQueries({ queryKey: ['reembolsos'] });
      setOpen(false);
      setDescricao(''); setValor(''); setAnexo(null);
    },
    onError: (e: Error) => toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
  });

  const cancelar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reembolsos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Reembolso removido' });
      qc.invalidateQueries({ queryKey: ['reembolsos'] });
    },
  });

  const handleSubmit = async () => {
    setSaving(true);
    await criar.mutateAsync().catch(() => {});
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        title="Reembolsos"
        description="Solicite reembolso de despesas corporativas e acompanhe o status."
        icon={Receipt}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Receipt className="w-3.5 h-3.5" />Total</div>
          <div className="text-2xl font-bold">{metrics.count}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><Clock className="w-3.5 h-3.5" />Pendentes</div>
          <div className="text-2xl font-bold text-yellow-600">{metrics.pendentes}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><CheckCircle2 className="w-3.5 h-3.5" />Aprovado</div>
          <div className="text-lg font-bold text-emerald-600">R$ {metrics.aprovados.toFixed(2)}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1"><DollarSign className="w-3.5 h-3.5" />Solicitado</div>
          <div className="text-lg font-bold">R$ {metrics.total.toFixed(2)}</div>
        </Card>
      </div>

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" />Novo Reembolso</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Solicitar Reembolso</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Categoria</Label>
                <Select value={categoria} onValueChange={(v) => setCategoria(v as Categoria)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CATEGORIAS) as Categoria[]).map(k => (
                      <SelectItem key={k} value={k}>{CATEGORIAS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Valor (R$)</Label>
                  <Input type="number" step="0.01" min="0.01" value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" />
                </div>
                <div>
                  <Label>Data da despesa</Label>
                  <Input type="date" value={dataDespesa} max={new Date().toISOString().split('T')[0]} onChange={e => setDataDespesa(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Detalhe a despesa..." rows={3} maxLength={500} />
              </div>
              <div>
                <Label className="flex items-center gap-2"><Paperclip className="w-3.5 h-3.5" />Comprovante (opcional, máx 5MB)</Label>
                <Input type="file" accept="image/*,application/pdf" onChange={e => setAnexo(e.target.files?.[0] ?? null)} />
              </div>
              <Button onClick={handleSubmit} disabled={saving} className="w-full gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Enviar solicitação
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : reembolsos.length === 0 ? (
          <Card className="p-8 text-center">
            <Receipt className="w-10 h-10 mx-auto mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Nenhum reembolso solicitado ainda.</p>
          </Card>
        ) : (
          reembolsos.map(r => {
            const meta = STATUS_META[r.status];
            return (
              <Card key={r.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold">{CATEGORIAS[r.categoria]}</span>
                      <Badge variant="outline" className={meta.className}>{meta.label}</Badge>
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">{r.descricao}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2">
                      <span>Despesa: {new Date(r.data_despesa + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                      {r.anexo_url && <a href={r.anexo_url} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1"><Paperclip className="w-3 h-3" />Comprovante</a>}
                    </div>
                    {r.observacao_gestor && (
                      <div className="mt-2 p-2 rounded bg-muted/50 text-xs text-muted-foreground">
                        <strong>Gestor:</strong> {r.observacao_gestor}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-primary">R$ {Number(r.valor).toFixed(2)}</div>
                    {r.status === 'pendente' && (
                      <Button variant="ghost" size="sm" className="text-red-600 h-7 px-2 mt-1" onClick={() => cancelar.mutate(r.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
