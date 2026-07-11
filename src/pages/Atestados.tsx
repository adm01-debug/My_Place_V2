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
import { HeartPulse, Plus, Loader2, Paperclip, Trash2, CheckCircle2, XCircle, Clock, CalendarDays } from 'lucide-react';

type Tipo = 'medico' | 'odontologico' | 'acompanhamento' | 'maternidade' | 'paternidade' | 'luto' | 'casamento' | 'outros';
type Status = 'pendente' | 'validado' | 'recusado' | 'cancelado';

interface Atestado {
  id: string;
  user_id: string;
  tipo: Tipo;
  data_inicial: string;
  dias_afastamento: number;
  cid: string | null;
  medico_nome: string | null;
  medico_crm: string | null;
  anexo_url: string | null;
  observacao: string | null;
  status: Status;
  observacao_rh: string | null;
  created_at: string;
}

const TIPOS: Record<Tipo, string> = {
  medico: '🩺 Médico',
  odontologico: '🦷 Odontológico',
  acompanhamento: '👨‍👩‍👧 Acompanhamento Familiar',
  maternidade: '🤱 Licença Maternidade',
  paternidade: '👶 Licença Paternidade',
  luto: '🕊️ Luto',
  casamento: '💍 Casamento',
  outros: '📌 Outros',
};

const STATUS_META: Record<Status, { label: string; className: string; icon: typeof Clock }> = {
  pendente: { label: 'Pendente', className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: Clock },
  validado: { label: 'Validado', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle2 },
  recusado: { label: 'Recusado', className: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle },
  cancelado: { label: 'Cancelado', className: 'bg-muted text-muted-foreground border-border', icon: XCircle },
};

export default function Atestados() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    tipo: 'medico' as Tipo,
    data_inicial: new Date().toISOString().slice(0, 10),
    dias_afastamento: 1,
    cid: '',
    medico_nome: '',
    medico_crm: '',
    observacao: '',
  });

  const { data: atestados = [], isLoading } = useQuery({
    queryKey: ['atestados', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('atestados')
        .select('*')
        .eq('user_id', user!.id)
        .order('data_inicial', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Atestado[];
    },
  });

  const metrics = useMemo(() => {
    const totalDias = atestados.filter((a) => a.status === 'validado').reduce((s, a) => s + a.dias_afastamento, 0);
    const pendentes = atestados.filter((a) => a.status === 'pendente').length;
    const validados = atestados.filter((a) => a.status === 'validado').length;
    return { totalDias, pendentes, validados, total: atestados.length };
  }, [atestados]);

  const criarMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Sem sessão');
      if (form.dias_afastamento < 1) throw new Error('Informe ao menos 1 dia.');

      let anexo_url: string | null = null;
      if (file) {
        if (file.size > 5 * 1024 * 1024) throw new Error('Anexo maior que 5MB.');
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from('atestados').upload(path, file, { upsert: false });
        if (upErr) throw upErr;
        anexo_url = path;
      }

      const { error } = await supabase.from('atestados').insert({
        user_id: user.id,
        tipo: form.tipo,
        data_inicial: form.data_inicial,
        dias_afastamento: form.dias_afastamento,
        cid: form.cid || null,
        medico_nome: form.medico_nome || null,
        medico_crm: form.medico_crm || null,
        observacao: form.observacao || null,
        anexo_url,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Atestado enviado', description: 'O RH foi notificado e fará a validação.' });
      qc.invalidateQueries({ queryKey: ['atestados'] });
      setOpen(false);
      setFile(null);
      setForm({
        tipo: 'medico',
        data_inicial: new Date().toISOString().slice(0, 10),
        dias_afastamento: 1,
        cid: '',
        medico_nome: '',
        medico_crm: '',
        observacao: '',
      });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Erro', description: e.message }),
  });

  const cancelarMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('atestados').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Atestado cancelado' });
      qc.invalidateQueries({ queryKey: ['atestados'] });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Erro', description: e.message }),
  });

  const verAnexo = async (path: string) => {
    const { data, error } = await supabase.storage.from('atestados').createSignedUrl(path, 60);
    if (error || !data) return toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível abrir o anexo.' });
    window.open(data.signedUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={HeartPulse}
        title="Atestados & Afastamentos"
        description="Envie e acompanhe seus atestados médicos e licenças."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Novo Atestado
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Enviar Atestado</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label>Tipo</Label>
                    <Select value={form.tipo} onValueChange={(v: Tipo) => setForm({ ...form, tipo: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {(Object.keys(TIPOS) as Tipo[]).map((k) => (
                          <SelectItem key={k} value={k}>{TIPOS[k]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Data inicial</Label>
                      <Input type="date" value={form.data_inicial} onChange={(e) => setForm({ ...form, data_inicial: e.target.value })} />
                    </div>
                    <div>
                      <Label>Dias de afastamento</Label>
                      <Input type="number" min={1} max={365} value={form.dias_afastamento} onChange={(e) => setForm({ ...form, dias_afastamento: Number(e.target.value) })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>CID (opcional)</Label>
                      <Input maxLength={10} placeholder="Ex.: J00" value={form.cid} onChange={(e) => setForm({ ...form, cid: e.target.value.toUpperCase() })} />
                    </div>
                    <div>
                      <Label>CRM do médico</Label>
                      <Input placeholder="Ex.: 12345/SP" value={form.medico_crm} onChange={(e) => setForm({ ...form, medico_crm: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <Label>Nome do médico</Label>
                    <Input value={form.medico_nome} onChange={(e) => setForm({ ...form, medico_nome: e.target.value })} />
                  </div>
                  <div>
                    <Label>Observação</Label>
                    <Textarea rows={2} value={form.observacao} onChange={(e) => setForm({ ...form, observacao: e.target.value })} />
                  </div>
                  <div>
                    <Label>Anexo (PDF/imagem, máx 5MB)</Label>
                    <Input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                  </div>
                </div>
                <Button className="w-full" onClick={() => criarMutation.mutate()} disabled={criarMutation.isPending}>
                  {criarMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar Atestado'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Total enviados</div>
          <div className="text-2xl font-bold">{metrics.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Validados</div>
          <div className="text-2xl font-bold text-emerald-600">{metrics.validados}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Pendentes</div>
          <div className="text-2xl font-bold text-yellow-600">{metrics.pendentes}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-muted-foreground">Dias afastados (validados)</div>
          <div className="text-2xl font-bold">{metrics.totalDias}</div>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : atestados.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">
          <HeartPulse className="h-10 w-10 mx-auto mb-3 opacity-40" />
          Você ainda não enviou nenhum atestado.
        </Card>
      ) : (
        <div className="space-y-3">
          {atestados.map((a) => {
            const meta = STATUS_META[a.status];
            const Icon = meta.icon;
            return (
              <Card key={a.id} className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{TIPOS[a.tipo]}</span>
                      <Badge variant="outline" className={meta.className}>
                        <Icon className="h-3 w-3 mr-1" />{meta.label}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-3 flex-wrap">
                      <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{new Date(a.data_inicial).toLocaleDateString('pt-BR')}</span>
                      <span>• {a.dias_afastamento} dia(s)</span>
                      {a.cid && <span>• CID {a.cid}</span>}
                      {a.medico_crm && <span>• CRM {a.medico_crm}</span>}
                    </div>
                    {a.observacao && <p className="text-sm text-muted-foreground">"{a.observacao}"</p>}
                    {a.observacao_rh && (
                      <p className="text-sm mt-1 rounded-md bg-muted px-2 py-1"><strong>RH:</strong> {a.observacao_rh}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {a.anexo_url && (
                      <Button size="sm" variant="outline" onClick={() => verAnexo(a.anexo_url!)}>
                        <Paperclip className="h-4 w-4 mr-1" /> Anexo
                      </Button>
                    )}
                    {a.status === 'pendente' && (
                      <Button size="sm" variant="ghost" onClick={() => cancelarMutation.mutate(a.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
