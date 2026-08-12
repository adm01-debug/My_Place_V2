import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { Rocket, Loader2, CheckCircle2, ExternalLink, PlayCircle } from 'lucide-react';

interface Tarefa {
  id: string;
  template_id: string;
  ordem: number;
  area: string;
  titulo: string;
  descricao: string | null;
  dias_apos_admissao: number;
  obrigatoria: boolean;
  link: string | null;
}

interface OnbCol {
  id: string;
  user_id: string;
  template_id: string;
  data_inicio: string;
  concluido: boolean;
  concluido_em: string | null;
}

interface Progresso {
  id: string;
  onboarding_id: string;
  tarefa_id: string;
  concluida: boolean;
  concluida_em: string | null;
}

const AREA_COLORS: Record<string, string> = {
  RH: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  TI: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  Gestor: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
};

export default function Onboarding() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: onboarding, isLoading: loadingOnb } = useQuery({
    queryKey: ['onboarding', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_colaborador')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as OnbCol | null;
    },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['onboarding-templates'],
    enabled: !!user && !onboarding,
    queryFn: async () => {
      const { data, error } = await supabase.from('onboarding_templates').select('*').eq('ativo', true);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: tarefas = [] } = useQuery({
    queryKey: ['onboarding-tarefas', onboarding?.template_id],
    enabled: !!onboarding,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_tarefas')
        .select('*')
        .eq('template_id', onboarding!.template_id)
        .order('dias_apos_admissao', { ascending: true })
        .order('ordem', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Tarefa[];
    },
  });

  const { data: progresso = [] } = useQuery({
    queryKey: ['onboarding-progresso', onboarding?.id],
    enabled: !!onboarding,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('onboarding_progresso')
        .select('*')
        .eq('onboarding_id', onboarding!.id);
      if (error) throw error;
      return (data ?? []) as Progresso[];
    },
  });

  const feitasSet = useMemo(() => new Set(progresso.filter(p => p.concluida).map(p => p.tarefa_id)), [progresso]);
  const totalObrig = useMemo(() => tarefas.filter(t => t.obrigatoria).length, [tarefas]);
  const feitasObrig = useMemo(() => tarefas.filter(t => t.obrigatoria && feitasSet.has(t.id)).length, [tarefas, feitasSet]);
  const pct = totalObrig === 0 ? 0 : Math.round((feitasObrig / totalObrig) * 100);

  const iniciar = useMutation({
    mutationFn: async (templateId: string) => {
      if (!user) throw new Error('Sem sessão');
      const { error } = await supabase.from('onboarding_colaborador').insert({
        user_id: user.id,
        template_id: templateId,
        data_inicio: new Date().toISOString().slice(0, 10),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Onboarding iniciado', description: 'Seu checklist está pronto.' });
      qc.invalidateQueries({ queryKey: ['onboarding'] });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Erro', description: e.message }),
  });

  const toggle = useMutation({
    mutationFn: async ({ tarefa, concluida }: { tarefa: Tarefa; concluida: boolean }) => {
      if (!onboarding) throw new Error('Sem onboarding');
      const existing = progresso.find(p => p.tarefa_id === tarefa.id);
      if (existing) {
        const { error } = await supabase.from('onboarding_progresso')
          .update({ concluida, concluida_em: concluida ? new Date().toISOString() : null })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('onboarding_progresso').insert({
          onboarding_id: onboarding.id,
          tarefa_id: tarefa.id,
          concluida,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding-progresso'] });
      qc.invalidateQueries({ queryKey: ['onboarding'] });
    },
    onError: (e: Error) => toast({ variant: 'destructive', title: 'Erro', description: e.message }),
  });

  if (loadingOnb) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!onboarding) {
    return (
      <div className="space-y-6">
        <ModuleHeader icon={Rocket} title="Onboarding" description="Bem-vindo(a) à empresa! Escolha um plano de integração para começar." />
        {templates.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">Nenhum plano de onboarding disponível.</Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {templates.map((t) => (
              <Card key={t.id} className="p-5 space-y-3">
                <div>
                  <div className="font-semibold text-lg">{t.nome}</div>
                  {t.area && <Badge variant="outline" className="mt-1">{t.area}</Badge>}
                </div>
                {t.descricao && <p className="text-sm text-muted-foreground">{t.descricao}</p>}
                <Button onClick={() => iniciar.mutate(t.id)} disabled={iniciar.isPending} className="w-full gap-2">
                  <PlayCircle className="h-4 w-4" /> Iniciar Onboarding
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  const tarefasPorDia = tarefas.reduce<Record<number, Tarefa[]>>((acc, t) => {
    (acc[t.dias_apos_admissao] ||= []).push(t);
    return acc;
  }, {});
  const dias = Object.keys(tarefasPorDia).map(Number).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      <ModuleHeader icon={Rocket} title="Meu Onboarding" description="Acompanhe seu plano de integração passo a passo." />

      <Card className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <div className="text-sm text-muted-foreground">Progresso geral</div>
            <div className="text-3xl font-bold">{pct}%</div>
            <div className="text-xs text-muted-foreground mt-1">
              {feitasObrig} de {totalObrig} tarefas obrigatórias concluídas
            </div>
          </div>
          {onboarding.concluido && (
            <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1" variant="outline">
              <CheckCircle2 className="h-4 w-4" /> Onboarding concluído
            </Badge>
          )}
        </div>
        <Progress value={pct} className="h-2" />
      </Card>

      <div className="space-y-6">
        {dias.map((d) => (
          <div key={d}>
            <h3 className="text-sm font-semibold text-muted-foreground mb-2">
              {d === 0 ? '📅 Primeiro dia' : `📅 ${d}º dia após admissão`}
            </h3>
            <div className="space-y-2">
              {tarefasPorDia[d].map((t) => {
                const feita = feitasSet.has(t.id);
                return (
                  <Card key={t.id} className={`p-4 transition ${feita ? 'bg-emerald-500/5 border-emerald-500/20' : ''}`}>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={feita}
                        onCheckedChange={(v) => toggle.mutate({ tarefa: t, concluida: !!v })}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-medium ${feita ? 'line-through text-muted-foreground' : ''}`}>{t.titulo}</span>
                          <Badge variant="outline" className={AREA_COLORS[t.area] ?? ''}>{t.area}</Badge>
                          {!t.obrigatoria && <Badge variant="outline">Opcional</Badge>}
                        </div>
                        {t.descricao && <p className="text-sm text-muted-foreground mt-1">{t.descricao}</p>}
                        {t.link && (
                          <a href={t.link} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 mt-1 hover:underline">
                            <ExternalLink className="h-3 w-3" /> Abrir link
                          </a>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
