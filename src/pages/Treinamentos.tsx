import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { GraduationCap, AlertTriangle, CheckCircle2, Clock, Award, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface StatusRow {
  matricula_id: string;
  user_id: string;
  treinamento_id: string;
  codigo: string;
  titulo: string;
  categoria: string;
  carga_horaria_minutos: number;
  validade_meses: number | null;
  obrigatorio_para_todos: boolean;
  status: string;
  data_matricula: string;
  data_inicio: string | null;
  data_conclusao: string | null;
  data_vencimento: string | null;
  nota: number | null;
  certificado_url: string | null;
  situacao: string;
  dias_ate_vencimento: number | null;
}

const CAT_LABEL: Record<string, string> = {
  nr: 'NR', iso: 'ISO', lgpd: 'LGPD', seguranca: 'Segurança',
  compliance: 'Compliance', tecnico: 'Técnico', comportamental: 'Comportamental', outros: 'Outros',
};

const SIT_STYLE: Record<string, { label: string; class: string; icon: typeof CheckCircle2 }> = {
  vigente:    { label: 'Vigente',    class: 'bg-emerald-500 text-white',           icon: CheckCircle2 },
  vencendo:   { label: 'Vence em breve', class: 'bg-amber-500 text-white',         icon: AlertTriangle },
  vencido:    { label: 'Vencido',    class: 'bg-red-500 text-white',               icon: AlertTriangle },
  pendente:   { label: 'Pendente',   class: 'bg-blue-500 text-white',              icon: Clock },
  dispensado: { label: 'Dispensado', class: 'bg-muted text-muted-foreground',      icon: CheckCircle2 },
  indefinido: { label: '—',          class: 'bg-muted text-muted-foreground',      icon: Clock },
};

export default function Treinamentos() {
  const { user } = useAuth();
  const { isAdmin, isGestor } = useUserRoles();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<StatusRow | null>(null);
  const [conclusao, setConclusao] = useState('');
  const [nota, setNota] = useState('');
  const [certUrl, setCertUrl] = useState('');
  const [obs, setObs] = useState('');

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['treinamentos-status', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_treinamentos_status' as never)
        .select('*')
        .eq('user_id', user!.id)
        .order('data_vencimento', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as unknown as StatusRow[];
    },
  });

  const openConclude = (r: StatusRow) => {
    setSelected(r);
    setConclusao(new Date().toISOString().slice(0, 10));
    setNota(r.nota?.toString() ?? '');
    setCertUrl(r.certificado_url ?? '');
    setObs('');
  };

  const iniciar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('treinamentos_matriculas')
        .update({ status: 'em_andamento', data_inicio: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success('Treinamento iniciado!'); qc.invalidateQueries({ queryKey: ['treinamentos-status'] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const concluir = useMutation({
    mutationFn: async () => {
      if (!selected) return;
      const { error } = await supabase
        .from('treinamentos_matriculas')
        .update({
          status: 'concluido',
          data_conclusao: new Date(conclusao).toISOString(),
          nota: nota ? Number(nota) : null,
          certificado_url: certUrl || null,
          observacoes: obs || null,
        })
        .eq('id', selected.matricula_id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Conclusão registrada!');
      qc.invalidateQueries({ queryKey: ['treinamentos-status'] });
      setSelected(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const totais = {
    vigentes: rows.filter(r => r.situacao === 'vigente').length,
    vencendo: rows.filter(r => r.situacao === 'vencendo').length,
    vencidos: rows.filter(r => r.situacao === 'vencido').length,
    pendentes: rows.filter(r => r.situacao === 'pendente').length,
  };

  const alerta = rows.filter(r => r.situacao === 'vencendo' || r.situacao === 'vencido');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Treinamentos & Certificações</h1>
          <p className="text-sm text-muted-foreground">Acompanhe seus treinamentos obrigatórios e a validade de suas certificações.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><CheckCircle2 className="w-8 h-8 text-emerald-500" /><div><p className="text-xs text-muted-foreground">Vigentes</p><p className="text-2xl font-bold">{totais.vigentes}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><AlertTriangle className="w-8 h-8 text-amber-500" /><div><p className="text-xs text-muted-foreground">Vencendo</p><p className="text-2xl font-bold">{totais.vencendo}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><AlertTriangle className="w-8 h-8 text-red-500" /><div><p className="text-xs text-muted-foreground">Vencidos</p><p className="text-2xl font-bold">{totais.vencidos}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><Clock className="w-8 h-8 text-blue-500" /><div><p className="text-xs text-muted-foreground">Pendentes</p><p className="text-2xl font-bold">{totais.pendentes}</p></div></CardContent></Card>
      </div>

      {alerta.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader><CardTitle className="text-base text-amber-700 dark:text-amber-400">Ação necessária</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {alerta.map(r => (
              <div key={r.matricula_id} className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-background flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{r.titulo}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.situacao === 'vencido'
                      ? `Vencido em ${r.data_vencimento ? format(new Date(r.data_vencimento), 'dd/MM/yyyy') : ''}`
                      : `Vence em ${r.dias_ate_vencimento} dias`}
                  </p>
                </div>
                <Badge className={SIT_STYLE[r.situacao].class}>{SIT_STYLE[r.situacao].label}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Meus treinamentos</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground text-center py-6">Carregando…</p>}
          {!isLoading && rows.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Você ainda não foi matriculado em nenhum treinamento.</p>}
          {rows.map(r => {
            const S = SIT_STYLE[r.situacao];
            const Icon = S.icon;
            return (
              <div key={r.matricula_id} className="p-3 rounded-lg border hover:bg-accent/40 transition-colors">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{r.titulo}</p>
                      <Badge variant="outline">{CAT_LABEL[r.categoria] ?? r.categoria}</Badge>
                      <Badge variant="secondary">{r.codigo}</Badge>
                      {r.obrigatorio_para_todos && <Badge className="bg-blue-500 text-white">Obrigatório</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                      <span>Carga: {Math.round(r.carga_horaria_minutos / 60)}h</span>
                      {r.validade_meses && <span>Validade: {r.validade_meses} meses</span>}
                      {r.data_conclusao && <span>Concluído: {format(new Date(r.data_conclusao), 'dd/MM/yyyy')}</span>}
                      {r.data_vencimento && <span>Vence: {format(new Date(r.data_vencimento), 'dd/MM/yyyy')}</span>}
                      {r.nota != null && <span>Nota: {r.nota}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={`${S.class} gap-1`}><Icon className="w-3 h-3" /> {S.label}</Badge>
                    <div className="flex gap-2">
                      {r.certificado_url && (
                        <Button size="sm" variant="outline" asChild>
                          <a href={r.certificado_url} target="_blank" rel="noreferrer"><Award className="w-3 h-3 mr-1" />Certificado</a>
                        </Button>
                      )}
                      {r.status === 'pendente' && (
                        <Button size="sm" variant="outline" onClick={() => iniciar.mutate(r.matricula_id)}>Iniciar</Button>
                      )}
                      {(r.status === 'em_andamento' || r.situacao === 'vencido' || r.situacao === 'vencendo') && (
                        <Button size="sm" onClick={() => openConclude(r)}>
                          {r.situacao === 'vencido' || r.situacao === 'vencendo' ? 'Renovar' : 'Concluir'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar conclusão</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{selected.titulo}</p>
              <div>
                <Label>Data de conclusão</Label>
                <Input type="date" value={conclusao} onChange={(e) => setConclusao(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Nota (0-100)</Label>
                  <Input type="number" min={0} max={100} step={0.01} value={nota} onChange={(e) => setNota(e.target.value)} />
                </div>
                <div>
                  <Label>URL do certificado</Label>
                  <Input placeholder="https://…" value={certUrl} onChange={(e) => setCertUrl(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} />
              </div>
              {selected.validade_meses && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  Novo vencimento será calculado automaticamente ({selected.validade_meses} meses após a conclusão).
                </p>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancelar</Button>
            <Button onClick={() => concluir.mutate()} disabled={!conclusao || concluir.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {(isAdmin || isGestor) && (
        <p className="text-xs text-muted-foreground text-center">
          💡 Matrículas em massa e gestão do catálogo: painel administrativo dedicado em breve.
        </p>
      )}
    </div>
  );
}
