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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { DoorOpen, Loader2, Save, Send, Star } from 'lucide-react';

type Motivo = 'nova_oportunidade'|'remuneracao'|'lideranca'|'ambiente'|'crescimento'|'pessoal'|'mudanca'|'saude'|'aposentadoria'|'outros';
type Status = 'rascunho'|'enviada'|'arquivada';

const MOTIVOS: Record<Motivo,string> = {
  nova_oportunidade: '🚀 Nova oportunidade',
  remuneracao: '💰 Remuneração',
  lideranca: '👥 Liderança',
  ambiente: '🏢 Ambiente de trabalho',
  crescimento: '📈 Falta de crescimento',
  pessoal: '🏠 Motivos pessoais',
  mudanca: '📦 Mudança de cidade',
  saude: '❤️ Saúde',
  aposentadoria: '🌴 Aposentadoria',
  outros: '📌 Outros',
};

const NOTAS: Array<{ key: 'nota_lideranca'|'nota_ambiente'|'nota_remuneracao'|'nota_crescimento'|'nota_ferramentas'; label: string }> = [
  { key: 'nota_lideranca', label: 'Liderança direta' },
  { key: 'nota_ambiente', label: 'Ambiente e cultura' },
  { key: 'nota_remuneracao', label: 'Remuneração e benefícios' },
  { key: 'nota_crescimento', label: 'Oportunidades de crescimento' },
  { key: 'nota_ferramentas', label: 'Ferramentas e recursos' },
];

interface ExitInterview {
  id: string;
  user_id: string;
  motivo_principal: Motivo;
  data_desligamento: string | null;
  nota_lideranca: number | null;
  nota_ambiente: number | null;
  nota_remuneracao: number | null;
  nota_crescimento: number | null;
  nota_ferramentas: number | null;
  recomendaria: number | null;
  o_que_gostou: string | null;
  o_que_melhoraria: string | null;
  comentario_final: string | null;
  status: Status;
  enviada_em: string | null;
}

function StarRow({ value, onChange, disabled }: { value: number | null; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <button key={n} type="button" disabled={disabled} onClick={() => onChange(n)} aria-label={`Nota ${n}`}>
          <Star className={`h-6 w-6 ${value && n <= value ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
        </button>
      ))}
    </div>
  );
}

export default function ExitInterview() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: existing, isLoading } = useQuery({
    queryKey: ['exit-interview', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exit_interviews')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as ExitInterview | null;
    },
  });

  const [form, setForm] = useState<Partial<ExitInterview>>({});
  const current = useMemo<Partial<ExitInterview>>(() => ({ ...(existing ?? {}), ...form }), [existing, form]);
  const readonly = existing?.status === 'enviada' || existing?.status === 'arquivada';

  const upsert = useMutation({
    mutationFn: async (novoStatus: Status) => {
      if (!user) throw new Error('Sem sessão');
      if (!current.motivo_principal) throw new Error('Selecione o motivo principal.');
      const payload = {
        user_id: user.id,
        motivo_principal: current.motivo_principal as Motivo,
        data_desligamento: current.data_desligamento ?? null,
        nota_lideranca: current.nota_lideranca ?? null,
        nota_ambiente: current.nota_ambiente ?? null,
        nota_remuneracao: current.nota_remuneracao ?? null,
        nota_crescimento: current.nota_crescimento ?? null,
        nota_ferramentas: current.nota_ferramentas ?? null,
        recomendaria: current.recomendaria ?? null,
        o_que_gostou: current.o_que_gostou ?? null,
        o_que_melhoraria: current.o_que_melhoraria ?? null,
        comentario_final: current.comentario_final ?? null,
        status: novoStatus,
      };
      if (existing?.id) {
        const { error } = await supabase.from('exit_interviews').update(payload).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('exit_interviews').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: (_d, status) => {
      toast({ title: status === 'enviada' ? 'Pesquisa enviada' : 'Rascunho salvo', description: status === 'enviada' ? 'Obrigado pelo seu feedback!' : 'Você pode retomar depois.' });
      qc.invalidateQueries({ queryKey: ['exit-interview'] });
      setForm({});
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Erro', description: e.message }),
  });

  const set = <K extends keyof ExitInterview>(k: K, v: ExitInterview[K]) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={DoorOpen}
        title="Pesquisa de Desligamento"
        description="Sua opinião é confidencial e nos ajuda a melhorar continuamente."
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <>
          {existing?.status === 'enviada' && (
            <Card className="p-4 bg-emerald-500/5 border-emerald-500/20">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <div className="font-semibold text-emerald-600">Pesquisa enviada ✅</div>
                  <div className="text-sm text-muted-foreground">Enviada em {existing.enviada_em ? new Date(existing.enviada_em).toLocaleString('pt-BR') : '-'}</div>
                </div>
                <Badge variant="outline">Somente leitura</Badge>
              </div>
            </Card>
          )}

          <Card className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Motivo principal *</Label>
                <Select
                  value={(current.motivo_principal as Motivo | undefined) ?? ''}
                  onValueChange={(v: Motivo) => set('motivo_principal', v)}
                  disabled={readonly}
                >
                  <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(MOTIVOS) as Motivo[]).map(k => (
                      <SelectItem key={k} value={k}>{MOTIVOS[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data prevista de desligamento</Label>
                <Input
                  type="date"
                  value={current.data_desligamento ?? ''}
                  onChange={(e) => set('data_desligamento', e.target.value)}
                  disabled={readonly}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Avalie de 1 a 5 estrelas</h3>
              {NOTAS.map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between flex-wrap gap-3 border-b pb-3 last:border-0">
                  <span className="text-sm">{label}</span>
                  <StarRow
                    value={current[key] as number | null ?? null}
                    onChange={(v) => set(key, v)}
                    disabled={readonly}
                  />
                </div>
              ))}
            </div>

            <div>
              <Label>Quanto você recomendaria a empresa para outros profissionais? (0 a 10)</Label>
              <div className="flex gap-1 mt-2 flex-wrap">
                {Array.from({ length: 11 }, (_, i) => i).map(n => {
                  const selected = current.recomendaria === n;
                  const color = n <= 6 ? 'bg-red-500/10 text-red-600 border-red-500/30'
                             : n <= 8 ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30'
                             : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
                  return (
                    <button
                      key={n}
                      type="button"
                      disabled={readonly}
                      onClick={() => set('recomendaria', n)}
                      className={`w-10 h-10 rounded-md border text-sm font-semibold transition ${color} ${selected ? 'ring-2 ring-primary scale-110' : 'opacity-70 hover:opacity-100'}`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <Label>O que você mais gostou?</Label>
                <Textarea rows={3} value={current.o_que_gostou ?? ''} onChange={(e) => set('o_que_gostou', e.target.value)} disabled={readonly} />
              </div>
              <div>
                <Label>O que poderia melhorar?</Label>
                <Textarea rows={3} value={current.o_que_melhoraria ?? ''} onChange={(e) => set('o_que_melhoraria', e.target.value)} disabled={readonly} />
              </div>
              <div>
                <Label>Comentário final</Label>
                <Textarea rows={3} value={current.comentario_final ?? ''} onChange={(e) => set('comentario_final', e.target.value)} disabled={readonly} />
              </div>
            </div>

            {!readonly && (
              <div className="flex gap-3 justify-end">
                <Button variant="outline" onClick={() => upsert.mutate('rascunho')} disabled={upsert.isPending}>
                  {upsert.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-1" /> Salvar rascunho</>}
                </Button>
                <Button onClick={() => upsert.mutate('enviada')} disabled={upsert.isPending}>
                  <Send className="h-4 w-4 mr-1" /> Enviar pesquisa
                </Button>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
