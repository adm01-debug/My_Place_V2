import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { LifeBuoy, Plus, Clock, CheckCircle2, AlertTriangle, MessageSquare, Send } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Categoria = 'rh' | 'ti' | 'facilities' | 'financeiro' | 'outros';
type Prioridade = 'baixa' | 'media' | 'alta' | 'urgente';
type Status = 'aberto' | 'em_andamento' | 'aguardando_solicitante' | 'resolvido' | 'fechado';

interface Chamado {
  id: string;
  numero: number;
  user_id: string;
  categoria: Categoria;
  prioridade: Prioridade;
  assunto: string;
  descricao: string;
  status: Status;
  atendente_id: string | null;
  sla_prazo: string | null;
  resolvido_em: string | null;
  created_at: string;
}

interface Mensagem {
  id: string;
  autor_id: string;
  mensagem: string;
  interna: boolean;
  created_at: string;
}

const CAT_LABEL: Record<Categoria, string> = { rh: 'RH', ti: 'TI', facilities: 'Facilities', financeiro: 'Financeiro', outros: 'Outros' };
const PRIO_COLOR: Record<Prioridade, string> = {
  baixa: 'bg-slate-500', media: 'bg-blue-500', alta: 'bg-orange-500', urgente: 'bg-red-600',
};
const STATUS_COLOR: Record<Status, string> = {
  aberto: 'bg-blue-500', em_andamento: 'bg-amber-500', aguardando_solicitante: 'bg-purple-500',
  resolvido: 'bg-emerald-500', fechado: 'bg-slate-500',
};
const STATUS_LABEL: Record<Status, string> = {
  aberto: 'Aberto', em_andamento: 'Em andamento', aguardando_solicitante: 'Aguardando você',
  resolvido: 'Resolvido', fechado: 'Fechado',
};

export default function Chamados() {
  const { user } = useAuth();
  const { isAdmin } = useUserRoles();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Chamado | null>(null);
  const [form, setForm] = useState({ categoria: 'rh' as Categoria, prioridade: 'media' as Prioridade, assunto: '', descricao: '' });
  const [novaMsg, setNovaMsg] = useState('');

  const { data: chamados = [], isLoading } = useQuery({
    queryKey: ['chamados'],
    queryFn: async () => {
      const { data, error } = await supabase.from('chamados').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data as Chamado[];
    },
  });

  const { data: mensagens = [] } = useQuery({
    queryKey: ['chamado-msg', selected?.id],
    enabled: !!selected,
    queryFn: async () => {
      const { data, error } = await supabase.from('chamados_mensagens').select('*').eq('chamado_id', selected!.id).order('created_at');
      if (error) throw error;
      return data as Mensagem[];
    },
  });

  const criar = useMutation({
    mutationFn: async () => {
      if (!form.assunto.trim() || !form.descricao.trim()) throw new Error('Preencha assunto e descrição.');
      const { error } = await supabase.from('chamados').insert({ ...form, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Chamado aberto!');
      setOpen(false);
      setForm({ categoria: 'rh', prioridade: 'media', assunto: '', descricao: '' });
      qc.invalidateQueries({ queryKey: ['chamados'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const responder = useMutation({
    mutationFn: async () => {
      if (!novaMsg.trim() || !selected) return;
      const { error } = await supabase.from('chamados_mensagens').insert({
        chamado_id: selected.id, autor_id: user!.id, mensagem: novaMsg.trim(), interna: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNovaMsg('');
      qc.invalidateQueries({ queryKey: ['chamado-msg', selected?.id] });
      qc.invalidateQueries({ queryKey: ['chamados'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const alterarStatus = useMutation({
    mutationFn: async (status: Status) => {
      if (!selected) return;
      const { error } = await supabase.from('chamados').update({ status }).eq('id', selected.id);
      if (error) throw error;
    },
    onSuccess: (_d, status) => {
      toast.success(`Status atualizado: ${STATUS_LABEL[status]}`);
      qc.invalidateQueries({ queryKey: ['chamados'] });
      setSelected((s) => s ? { ...s, status } : s);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const abertos = chamados.filter(c => !['resolvido', 'fechado'].includes(c.status)).length;
  const resolvidos = chamados.filter(c => c.status === 'resolvido').length;
  const urgentes = chamados.filter(c => c.prioridade === 'urgente' && !['resolvido','fechado'].includes(c.status)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <LifeBuoy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Central de Chamados</h1>
            <p className="text-sm text-muted-foreground">Abra e acompanhe solicitações para RH, TI, Facilities e mais.</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Novo chamado</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Abrir novo chamado</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Categoria</Label>
                  <Select value={form.categoria} onValueChange={(v) => setForm(f => ({ ...f, categoria: v as Categoria }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(CAT_LABEL) as Categoria[]).map(k => <SelectItem key={k} value={k}>{CAT_LABEL[k]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Prioridade</Label>
                  <Select value={form.prioridade} onValueChange={(v) => setForm(f => ({ ...f, prioridade: v as Prioridade }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa (7 dias)</SelectItem>
                      <SelectItem value="media">Média (3 dias)</SelectItem>
                      <SelectItem value="alta">Alta (1 dia)</SelectItem>
                      <SelectItem value="urgente">Urgente (4 horas)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Assunto</Label>
                <Input value={form.assunto} onChange={e => setForm(f => ({ ...f, assunto: e.target.value }))} placeholder="Resumo do problema" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea rows={5} value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Detalhe o que aconteceu, quando, e o que já tentou." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={() => criar.mutate()} disabled={criar.isPending}>Abrir chamado</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><Clock className="w-8 h-8 text-blue-500" /><div><p className="text-xs text-muted-foreground">Em andamento</p><p className="text-2xl font-bold">{abertos}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><CheckCircle2 className="w-8 h-8 text-emerald-500" /><div><p className="text-xs text-muted-foreground">Resolvidos</p><p className="text-2xl font-bold">{resolvidos}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><AlertTriangle className="w-8 h-8 text-red-500" /><div><p className="text-xs text-muted-foreground">Urgentes abertos</p><p className="text-2xl font-bold">{urgentes}</p></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Meus chamados</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {!isLoading && chamados.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum chamado ainda. Abra o primeiro!</p>
          )}
          {chamados.map(c => (
            <button key={c.id} onClick={() => setSelected(c)} className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-muted-foreground">#{c.numero}</span>
                    <Badge className={`${PRIO_COLOR[c.prioridade]} text-white`}>{c.prioridade}</Badge>
                    <Badge className={`${STATUS_COLOR[c.status]} text-white`}>{STATUS_LABEL[c.status]}</Badge>
                    <Badge variant="outline">{CAT_LABEL[c.categoria]}</Badge>
                  </div>
                  <p className="font-medium mt-1 truncate">{c.assunto}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR })}
                    {c.sla_prazo && !c.resolvido_em && (
                      <> · SLA: {format(new Date(c.sla_prazo), "dd/MM 'às' HH:mm", { locale: ptBR })}</>
                    )}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm text-muted-foreground">#{selected.numero}</span>
                  {selected.assunto}
                </DialogTitle>
                <div className="flex items-center gap-2 flex-wrap pt-2">
                  <Badge className={`${PRIO_COLOR[selected.prioridade]} text-white`}>{selected.prioridade}</Badge>
                  <Badge className={`${STATUS_COLOR[selected.status]} text-white`}>{STATUS_LABEL[selected.status]}</Badge>
                  <Badge variant="outline">{CAT_LABEL[selected.categoria]}</Badge>
                </div>
              </DialogHeader>

              <div className="p-3 rounded-lg bg-muted/50 text-sm whitespace-pre-wrap">{selected.descricao}</div>

              <div className="space-y-2 max-h-64 overflow-y-auto">
                {mensagens.map(m => {
                  const meu = m.autor_id === user?.id;
                  return (
                    <div key={m.id} className={`flex ${meu ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-2.5 rounded-lg text-sm ${meu ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                        <p className="whitespace-pre-wrap">{m.mensagem}</p>
                        <p className={`text-[10px] mt-1 opacity-70`}>{formatDistanceToNow(new Date(m.created_at), { addSuffix: true, locale: ptBR })}</p>
                      </div>
                    </div>
                  );
                })}
                {mensagens.length === 0 && <p className="text-xs text-center text-muted-foreground py-4">Nenhuma mensagem ainda.</p>}
              </div>

              {!['fechado'].includes(selected.status) && (
                <div className="flex gap-2">
                  <Input value={novaMsg} onChange={e => setNovaMsg(e.target.value)} placeholder="Escreva uma resposta…" onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), responder.mutate())} />
                  <Button onClick={() => responder.mutate()} disabled={responder.isPending || !novaMsg.trim()} size="icon"><Send className="w-4 h-4" /></Button>
                </div>
              )}

              <DialogFooter className="flex-wrap gap-2">
                {selected.user_id === user?.id && selected.status === 'resolvido' && (
                  <Button variant="outline" onClick={() => alterarStatus.mutate('fechado')}>Fechar chamado</Button>
                )}
                {(isAdmin || selected.atendente_id === user?.id) && selected.status !== 'resolvido' && selected.status !== 'fechado' && (
                  <>
                    <Button variant="outline" onClick={() => alterarStatus.mutate('aguardando_solicitante')}>Aguardar solicitante</Button>
                    <Button onClick={() => alterarStatus.mutate('resolvido')}>Marcar como resolvido</Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
