import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { toast } from "sonner";
import { Loader2, Users, Target, CheckCircle2, MessageSquare } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from "recharts";

type Ciclo = { id: string; titulo: string; descricao: string | null; data_inicio: string; data_fim: string; competencias: string[]; status: string };
type Tarefa = { id: string; ciclo_id: string; avaliado_id: string; relacao: string; concluido: boolean; avaliado_nome?: string };
type Resultado = { competencia: string; relacao: string; media: number; respondentes: number };

const RELACAO_LABEL: Record<string, string> = { auto: "Auto", gestor: "Gestor", par: "Pares", subordinado: "Time" };
const RELACAO_COLOR: Record<string, string> = { auto: "hsl(var(--primary))", gestor: "#f59e0b", par: "#10b981", subordinado: "#8b5cf6" };

export default function Feedback360() {
  const { user } = useAuth();
  const [ciclos, setCiclos] = useState<Ciclo[]>([]);
  const [cicloSel, setCicloSel] = useState<Ciclo | null>(null);
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, [user?.id]);

  async function load() {
    setLoading(true);
    const { data: cds } = await supabase
      .from("feedback_ciclos")
      .select("*")
      .in("status", ["ativo", "encerrado"])
      .order("data_inicio", { ascending: false });
    const list = (cds ?? []) as unknown as Ciclo[];
    setCiclos(list);
    if (list.length && !cicloSel) setCicloSel(list[0]);
    setLoading(false);
  }

  useEffect(() => { if (cicloSel && user) void loadCiclo(cicloSel.id); }, [cicloSel?.id, user?.id]);

  async function loadCiclo(cicloId: string) {
    if (!user) return;
    const [{ data: tf }, { data: rs }] = await Promise.all([
      supabase.from("feedback_avaliadores")
        .select("id, ciclo_id, avaliado_id, relacao, concluido, profiles!feedback_avaliadores_avaliado_id_fkey(nome)")
        .eq("ciclo_id", cicloId).eq("avaliador_id", user.id),
      supabase.rpc("fn_meus_resultados_360", { p_ciclo_id: cicloId }),
    ]);
    setTarefas((tf ?? []).map((t: { id: string; ciclo_id: string; avaliado_id: string; relacao: string; concluido: boolean; profiles?: { nome?: string } | null }) => ({
      id: t.id, ciclo_id: t.ciclo_id, avaliado_id: t.avaliado_id, relacao: t.relacao,
      concluido: t.concluido, avaliado_nome: t.profiles?.nome ?? "Colaborador",
    })));
    setResultados((rs ?? []) as Resultado[]);
  }

  const radarData = useMemo(() => {
    if (!cicloSel) return [];
    return cicloSel.competencias.map((c) => {
      const row: Record<string, string | number> = { competencia: c };
      for (const rel of ["auto", "gestor", "par", "subordinado"]) {
        const found = resultados.find((r) => r.competencia === c && r.relacao === rel);
        if (found) row[RELACAO_LABEL[rel]] = Number(found.media);
      }
      return row;
    });
  }, [cicloSel, resultados]);

  const relacoesPresentes = useMemo(() => {
    const set = new Set(resultados.map((r) => r.relacao));
    return ["auto", "gestor", "par", "subordinado"].filter((r) => set.has(r));
  }, [resultados]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 pb-24">
      <ModuleHeader title="Feedback 360º" description="Avaliação de competências por múltiplas perspectivas." icon={Target} />

      {ciclos.length === 0 && (
        <Card className="p-8 text-center border-dashed">
          <Target className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum ciclo de avaliação disponível no momento.</p>
        </Card>
      )}

      {ciclos.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {ciclos.map((c) => (
            <Button key={c.id} size="sm" variant={cicloSel?.id === c.id ? "default" : "outline"} onClick={() => setCicloSel(c)}>
              {c.titulo}
              {c.status === "encerrado" && <Badge variant="secondary" className="ml-2 text-[10px]">Encerrado</Badge>}
            </Button>
          ))}
        </div>
      )}

      {cicloSel && (
        <Tabs defaultValue="avaliar" className="space-y-4">
          <TabsList>
            <TabsTrigger value="avaliar"><Users className="w-4 h-4 mr-1" />Avaliar ({tarefas.filter((t) => !t.concluido).length})</TabsTrigger>
            <TabsTrigger value="resultados"><Target className="w-4 h-4 mr-1" />Meus Resultados</TabsTrigger>
          </TabsList>

          <TabsContent value="avaliar" className="space-y-3">
            {tarefas.length === 0 && (
              <Card className="p-6 text-center text-sm text-muted-foreground">
                Você não tem avaliações atribuídas neste ciclo.
              </Card>
            )}
            {tarefas.map((t) => (
              <AvaliacaoCard key={t.id} tarefa={t} ciclo={cicloSel} onSubmitted={() => loadCiclo(cicloSel.id)} />
            ))}
          </TabsContent>

          <TabsContent value="resultados" className="space-y-4">
            {resultados.length === 0 ? (
              <Card className="p-6 text-center text-sm text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto text-muted-foreground/60 mb-2" />
                Ainda não há resultados. As respostas de pares só aparecem quando há pelo menos 2 respondentes (garantindo anonimato).
              </Card>
            ) : (
              <>
                <Card className="p-4">
                  <h3 className="text-sm font-semibold mb-4">Radar de Competências</h3>
                  <ResponsiveContainer width="100%" height={360}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="competencia" tick={{ fontSize: 11, fill: "hsl(var(--foreground))" }} />
                      <PolarRadiusAxis angle={90} domain={[0, 5]} tick={{ fontSize: 10 }} />
                      {relacoesPresentes.map((rel) => (
                        <Radar key={rel} name={RELACAO_LABEL[rel]} dataKey={RELACAO_LABEL[rel]}
                          stroke={RELACAO_COLOR[rel]} fill={RELACAO_COLOR[rel]} fillOpacity={0.15} strokeWidth={2} />
                      ))}
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </Card>

                <div className="grid gap-3 md:grid-cols-2">
                  {cicloSel.competencias.map((comp) => {
                    const linhas = resultados.filter((r) => r.competencia === comp);
                    const geral = linhas.reduce((s, l) => s + Number(l.media), 0) / (linhas.length || 1);
                    return (
                      <Card key={comp} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold">{comp}</span>
                          <Badge variant="secondary">Geral: {geral.toFixed(1)}/5</Badge>
                        </div>
                        <div className="space-y-1">
                          {linhas.map((l) => (
                            <div key={l.relacao} className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{RELACAO_LABEL[l.relacao]} ({l.respondentes})</span>
                              <span className="font-medium" style={{ color: RELACAO_COLOR[l.relacao] }}>{Number(l.media).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function AvaliacaoCard({ tarefa, ciclo, onSubmitted }: { tarefa: Tarefa; ciclo: Ciclo; onSubmitted: () => void }) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [notas, setNotas] = useState<Record<string, number>>({});
  const [comentario, setComentario] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!user) return;
    if (Object.keys(notas).length !== ciclo.competencias.length) {
      return toast.error("Avalie todas as competências");
    }
    setSaving(true);
    const rows = ciclo.competencias.map((c) => ({
      ciclo_id: ciclo.id, avaliado_id: tarefa.avaliado_id, avaliador_id: user.id,
      relacao: tarefa.relacao, competencia: c, nota: notas[c],
      comentario: comentario || null,
    }));
    const { error } = await supabase.from("feedback_respostas").upsert(rows as never, {
      onConflict: "ciclo_id,avaliado_id,avaliador_id,competencia",
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Avaliação enviada!");
    onSubmitted();
  }

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold">{tarefa.relacao === "auto" ? "Auto-avaliação" : tarefa.avaliado_nome}</p>
          <p className="text-xs text-muted-foreground">{RELACAO_LABEL[tarefa.relacao]}</p>
        </div>
        {tarefa.concluido ? (
          <Badge className="bg-emerald-500/15 text-emerald-600 border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 mr-1" />Concluído
          </Badge>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setExpanded((e) => !e)}>
            {expanded ? "Fechar" : "Avaliar"}
          </Button>
        )}
      </div>

      {expanded && !tarefa.concluido && (
        <div className="mt-4 space-y-3 pt-3 border-t border-border/40">
          {ciclo.competencias.map((c) => (
            <div key={c}>
              <p className="text-xs font-medium mb-1">{c}</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setNotas((s) => ({ ...s, [c]: n }))}
                    className={`flex-1 py-2 rounded-md border text-xs font-semibold transition-all ${
                      notas[c] === n ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:border-primary/50"
                    }`}
                  >{n}</button>
                ))}
              </div>
            </div>
          ))}
          <Textarea placeholder="Comentário (opcional)" value={comentario} onChange={(e) => setComentario(e.target.value)} rows={2} />
          <Button onClick={submit} disabled={saving} className="w-full">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Enviar Avaliação
          </Button>
        </div>
      )}
    </Card>
  );
}
