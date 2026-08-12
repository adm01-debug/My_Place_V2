import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRoles } from '@/hooks/useUserRoles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { HardHat, AlertTriangle, CheckCircle2, Clock, PenLine } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface EpiRow {
  entrega_id: string;
  user_id: string;
  epi_id: string;
  codigo: string;
  nome: string;
  categoria: string;
  foto_url: string | null;
  quantidade: number;
  numero_ca_entrega: string | null;
  data_entrega: string;
  previsao_troca: string | null;
  motivo: string;
  status: string;
  assinatura_em: string | null;
  situacao: string;
  dias_ate_troca: number | null;
}

const CAT_LABEL: Record<string, string> = {
  cabeca: 'Cabeça', olhos: 'Olhos', ouvidos: 'Ouvidos', respiratoria: 'Respiratória',
  maos: 'Mãos', pes: 'Pés', corpo: 'Corpo', queda: 'Contra queda', outros: 'Outros',
};

const SIT_STYLE: Record<string, { label: string; class: string; icon: typeof CheckCircle2 }> = {
  vigente:         { label: 'Vigente',         class: 'bg-emerald-500 text-white',   icon: CheckCircle2 },
  trocar_em_breve: { label: 'Trocar em breve', class: 'bg-amber-500 text-white',     icon: AlertTriangle },
  vencido:         { label: 'Vencido',         class: 'bg-red-500 text-white',       icon: AlertTriangle },
  devolvido:       { label: 'Devolvido',       class: 'bg-muted text-muted-foreground', icon: CheckCircle2 },
};

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function Epis() {
  const { user } = useAuth();
  const { isAdmin, isGestor } = useUserRoles();
  const qc = useQueryClient();
  const [assinar, setAssinar] = useState<EpiRow | null>(null);
  const [confirmado, setConfirmado] = useState(false);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['epis-status', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_epis_ativos' as never)
        .select('*')
        .eq('user_id', user!.id)
        .order('data_entrega', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as EpiRow[];
    },
  });

  const assinarMut = useMutation({
    mutationFn: async () => {
      if (!assinar || !user) return;
      const hash = await sha256(`${user.id}|${assinar.entrega_id}|${assinar.epi_id}|${assinar.data_entrega}`);
      const { error } = await supabase
        .from('epis_entregas')
        .update({
          assinatura_hash: hash,
          assinatura_ip: null,
          assinatura_em: new Date().toISOString(),
        })
        .eq('id', assinar.entrega_id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Recebimento assinado eletronicamente.');
      qc.invalidateQueries({ queryKey: ['epis-status'] });
      setAssinar(null);
      setConfirmado(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ativos = rows.filter(r => r.situacao !== 'devolvido');
  const totais = {
    vigentes: rows.filter(r => r.situacao === 'vigente').length,
    trocar: rows.filter(r => r.situacao === 'trocar_em_breve').length,
    vencidos: rows.filter(r => r.situacao === 'vencido').length,
    pendentesAssinatura: ativos.filter(r => !r.assinatura_em).length,
  };
  const alerta = rows.filter(r => r.situacao === 'trocar_em_breve' || r.situacao === 'vencido');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <HardHat className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">EPIs — Equipamentos de Proteção Individual</h1>
          <p className="text-sm text-muted-foreground">Ficha de entrega, CA e prazos de troca conforme NR-06.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><CheckCircle2 className="w-8 h-8 text-emerald-500" /><div><p className="text-xs text-muted-foreground">Vigentes</p><p className="text-2xl font-bold">{totais.vigentes}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><AlertTriangle className="w-8 h-8 text-amber-500" /><div><p className="text-xs text-muted-foreground">Trocar em breve</p><p className="text-2xl font-bold">{totais.trocar}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><AlertTriangle className="w-8 h-8 text-red-500" /><div><p className="text-xs text-muted-foreground">Vencidos</p><p className="text-2xl font-bold">{totais.vencidos}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><PenLine className="w-8 h-8 text-blue-500" /><div><p className="text-xs text-muted-foreground">Aguardando assinatura</p><p className="text-2xl font-bold">{totais.pendentesAssinatura}</p></div></CardContent></Card>
      </div>

      {alerta.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader><CardTitle className="text-base text-amber-700 dark:text-amber-400">EPIs para troca</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {alerta.map(r => (
              <div key={r.entrega_id} className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-background flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{r.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.situacao === 'vencido'
                      ? `Vencido em ${r.previsao_troca ? format(new Date(r.previsao_troca), 'dd/MM/yyyy') : ''}`
                      : `Trocar em ${r.dias_ate_troca} dias`}
                  </p>
                </div>
                <Badge className={SIT_STYLE[r.situacao].class}>{SIT_STYLE[r.situacao].label}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Minhas fichas de EPI</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground text-center py-6">Carregando…</p>}
          {!isLoading && rows.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nenhum EPI entregue a você até o momento.</p>}
          {rows.map(r => {
            const S = SIT_STYLE[r.situacao] ?? SIT_STYLE.vigente;
            const Icon = S.icon;
            const semAssinatura = !r.assinatura_em && r.situacao !== 'devolvido';
            return (
              <div key={r.entrega_id} className="p-3 rounded-lg border hover:bg-accent/40 transition-colors">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{r.nome}</p>
                      <Badge variant="outline">{CAT_LABEL[r.categoria] ?? r.categoria}</Badge>
                      <Badge variant="secondary">{r.codigo}</Badge>
                      {r.numero_ca_entrega && <Badge variant="outline">CA {r.numero_ca_entrega}</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                      <span>Qtd: {r.quantidade}</span>
                      <span>Entregue em {format(new Date(r.data_entrega), "dd/MM/yyyy", { locale: ptBR })}</span>
                      {r.previsao_troca && <span>Trocar até {format(new Date(r.previsao_troca), 'dd/MM/yyyy')}</span>}
                      <span>Motivo: {r.motivo}</span>
                      {r.assinatura_em && <span className="text-emerald-600">✓ Assinado em {format(new Date(r.assinatura_em), 'dd/MM/yyyy')}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={`${S.class} gap-1`}><Icon className="w-3 h-3" /> {S.label}</Badge>
                    {semAssinatura && (
                      <Button size="sm" onClick={() => setAssinar(r)}>
                        <PenLine className="w-3 h-3 mr-1" />Assinar recebimento
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={!!assinar} onOpenChange={(o) => { if (!o) { setAssinar(null); setConfirmado(false); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assinar recebimento do EPI</DialogTitle>
          </DialogHeader>
          {assinar && (
            <div className="space-y-3 text-sm">
              <p className="font-medium">{assinar.nome}</p>
              <p className="text-muted-foreground">CA {assinar.numero_ca_entrega ?? '—'} · Qtd {assinar.quantidade} · Entregue em {format(new Date(assinar.data_entrega), 'dd/MM/yyyy')}</p>
              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox checked={confirmado} onCheckedChange={(v) => setConfirmado(!!v)} className="mt-0.5" />
                <span>Declaro que recebi o EPI acima em perfeitas condições, fui treinado quanto ao uso correto, guarda e conservação, e me comprometo a usá-lo durante toda a jornada e a devolvê-lo em caso de desligamento ou substituição, conforme NR-06.</span>
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssinar(null)}>Cancelar</Button>
            <Button onClick={() => assinarMut.mutate()} disabled={!confirmado || assinarMut.isPending}>Assinar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {(isAdmin || isGestor) && (
        <p className="text-xs text-muted-foreground text-center">
          💡 Entregas em massa, devoluções e gestão do catálogo: painel administrativo dedicado em breve.
        </p>
      )}
    </div>
  );
}
