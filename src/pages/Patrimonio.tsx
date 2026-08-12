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
import { Laptop, PenLine, CheckCircle2, PackageCheck, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';

interface AtivoEmUso {
  ativo_id: string;
  codigo: string;
  tipo: string;
  descricao: string;
  marca: string | null;
  modelo: string | null;
  numero_serie: string | null;
  patrimonio_num: string | null;
  status: string;
  estado_conservacao: string;
  user_id: string;
  entregue_em: string;
  estado_na_entrega: string;
  assinatura_em: string | null;
  movimentacao_id: string;
}

const TIPO_LABEL: Record<string, string> = {
  notebook: 'Notebook', desktop: 'Desktop', monitor: 'Monitor', celular: 'Celular',
  tablet: 'Tablet', chip_sim: 'Chip SIM', cracha: 'Crachá', veiculo: 'Veículo',
  ferramenta: 'Ferramenta', mobiliario: 'Mobiliário', outros: 'Outros',
};
const EST_LABEL: Record<string, string> = { novo: 'Novo', otimo: 'Ótimo', bom: 'Bom', regular: 'Regular', ruim: 'Ruim', inservivel: 'Inservível' };

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default function Patrimonio() {
  const { user } = useAuth();
  const { isAdmin, isGestor } = useUserRoles();
  const qc = useQueryClient();
  const [assinar, setAssinar] = useState<AtivoEmUso | null>(null);
  const [confirmado, setConfirmado] = useState(false);

  const { data: ativos = [], isLoading } = useQuery({
    queryKey: ['patrimonio-em-uso', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_patrimonio_em_uso' as never)
        .select('*')
        .eq('user_id', user!.id)
        .order('entregue_em', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AtivoEmUso[];
    },
  });

  const assinarMut = useMutation({
    mutationFn: async () => {
      if (!assinar || !user) return;
      const hash = await sha256(`${user.id}|${assinar.movimentacao_id}|${assinar.ativo_id}|${assinar.entregue_em}`);
      const { error } = await supabase
        .from('patrimonio_movimentacoes')
        .update({
          assinatura_hash: hash,
          assinatura_user_agent: navigator.userAgent,
          assinatura_em: new Date().toISOString(),
        })
        .eq('id', assinar.movimentacao_id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Termo de responsabilidade assinado eletronicamente.');
      qc.invalidateQueries({ queryKey: ['patrimonio-em-uso'] });
      setAssinar(null); setConfirmado(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pendentes = ativos.filter(a => !a.assinatura_em).length;
  const assinados = ativos.filter(a => a.assinatura_em).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Laptop className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Meu Patrimônio</h1>
          <p className="text-sm text-muted-foreground">Ativos corporativos sob minha responsabilidade.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><PackageCheck className="w-8 h-8 text-primary" /><div><p className="text-xs text-muted-foreground">Ativos em uso</p><p className="text-2xl font-bold">{ativos.length}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><PenLine className="w-8 h-8 text-amber-500" /><div><p className="text-xs text-muted-foreground">Aguardando assinatura</p><p className="text-2xl font-bold">{pendentes}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><ShieldCheck className="w-8 h-8 text-emerald-500" /><div><p className="text-xs text-muted-foreground">Termos assinados</p><p className="text-2xl font-bold">{assinados}</p></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Ativos sob minha guarda</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground text-center py-6">Carregando…</p>}
          {!isLoading && ativos.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Nenhum ativo entregue a você no momento.</p>}
          {ativos.map(a => (
            <div key={a.movimentacao_id} className="p-3 rounded-lg border hover:bg-accent/40 transition-colors">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium">{a.descricao}</p>
                    <Badge variant="outline">{TIPO_LABEL[a.tipo] ?? a.tipo}</Badge>
                    <Badge variant="secondary">{a.codigo}</Badge>
                    {a.patrimonio_num && <Badge variant="outline">Patrim. {a.patrimonio_num}</Badge>}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                    {a.marca && <span>{a.marca} {a.modelo}</span>}
                    {a.numero_serie && <span>S/N: {a.numero_serie}</span>}
                    <span>Estado: {EST_LABEL[a.estado_na_entrega] ?? a.estado_na_entrega}</span>
                    <span>Entregue em {format(new Date(a.entregue_em), 'dd/MM/yyyy')}</span>
                    {a.assinatura_em && <span className="text-emerald-600">✓ Termo assinado em {format(new Date(a.assinatura_em), 'dd/MM/yyyy')}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {a.assinatura_em
                    ? <Badge className="bg-emerald-500 text-white gap-1"><CheckCircle2 className="w-3 h-3" /> Assinado</Badge>
                    : <Button size="sm" onClick={() => setAssinar(a)}><PenLine className="w-3 h-3 mr-1" />Assinar termo</Button>}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!assinar} onOpenChange={(o) => { if (!o) { setAssinar(null); setConfirmado(false); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Termo de Responsabilidade</DialogTitle></DialogHeader>
          {assinar && (
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium">{assinar.descricao} <span className="text-muted-foreground font-normal">({assinar.codigo})</span></p>
                <p className="text-xs text-muted-foreground mt-1">
                  {[assinar.marca, assinar.modelo].filter(Boolean).join(' ')}
                  {assinar.numero_serie && ` · S/N ${assinar.numero_serie}`}
                  {' · '} Entregue em {format(new Date(assinar.entregue_em), 'dd/MM/yyyy')} no estado {EST_LABEL[assinar.estado_na_entrega]}
                </p>
              </div>
              <label className="flex items-start gap-2 cursor-pointer">
                <Checkbox checked={confirmado} onCheckedChange={(v) => setConfirmado(!!v)} className="mt-0.5" />
                <span>
                  Declaro que recebi o ativo acima em perfeitas condições de uso, comprometendo-me a zelar por sua conservação,
                  utilizá-lo exclusivamente para fins profissionais e devolvê-lo em caso de desligamento, substituição ou
                  solicitação da empresa. Assumo total responsabilidade por danos causados por mau uso, negligência ou perda,
                  autorizando o desconto do valor de reposição em minha rescisão ou remuneração, conforme legislação vigente.
                </span>
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssinar(null)}>Cancelar</Button>
            <Button onClick={() => assinarMut.mutate()} disabled={!confirmado || assinarMut.isPending}>Assinar termo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {(isAdmin || isGestor) && (
        <p className="text-xs text-muted-foreground text-center">
          💡 Cadastro de ativos, entregas em massa e devoluções: painel administrativo dedicado em breve.
        </p>
      )}
    </div>
  );
}
