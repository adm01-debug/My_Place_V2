import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { toast } from "sonner";
import { Target, Plus, Trash2, Calendar, TrendingUp, Loader2, CheckCircle2 } from "lucide-react";

type Meta = {
  id: string;
  titulo: string;
  descricao: string | null;
  progresso: number;
  data_inicio: string | null;
  data_fim: string | null;
  tipo: "pessoal" | "equipe" | "empresa";
  prioridade: "baixa" | "media" | "alta";
};

const TIPO_LABEL = { pessoal: "Pessoal", equipe: "Equipe", empresa: "Empresa" } as const;
const PRIO_COLOR: Record<string, string> = {
  baixa: "bg-slate-500/15 text-slate-600 border-slate-500/30",
  media: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  alta: "bg-rose-500/15 text-rose-600 border-rose-500/30",
};

export default function Metas() {
  const { user } = useAuth();
  const [metas, setMetas] = useState<Meta[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Meta | null>(null);

  useEffect(() => { if (user) void load(); }, [user?.id]);

  async function load() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("metas_colaborador")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setMetas((data ?? []) as unknown as Meta[]);
    setLoading(false);
  }

  async function updateProgresso(m: Meta, novo: number) {
    setMetas((s) => s.map((x) => (x.id === m.id ? { ...x, progresso: novo } : x)));
    const { error } = await supabase.from("metas_colaborador").update({ progresso: novo }).eq("id", m.id);
    if (error) { toast.error("Falha ao salvar"); void load(); }
    else if (novo === 100 && m.progresso < 100) toast.success("🎉 Meta concluída!");
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta meta?")) return;
    const { error } = await supabase.from("metas_colaborador").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Meta removida");
    void load();
  }

  const concluidas = metas.filter((m) => m.progresso >= 100).length;
  const progressoMedio = metas.length ? Math.round(metas.reduce((s, m) => s + m.progresso, 0) / metas.length) : 0;
  const atrasadas = metas.filter((m) => m.data_fim && new Date(m.data_fim) < new Date() && m.progresso < 100).length;

  return (
    <div className="space-y-6 pb-24">
      <ModuleHeader title="Metas & OKRs" description="Acompanhe seus objetivos e resultados-chave." icon={Target} />

      <div className="grid grid-cols-3 gap-3">
        <MetricCard label="Ativas" value={metas.length - concluidas} color="text-primary" />
        <MetricCard label="Concluídas" value={concluidas} color="text-emerald-600" />
        <MetricCard label="Progresso médio" value={`${progressoMedio}%`} color="text-blue-600" />
      </div>

      {atrasadas > 0 && (
        <Card className="p-3 border-rose-500/30 bg-rose-500/5">
          <p className="text-xs text-rose-700 dark:text-rose-400">
            ⚠️ Você tem <b>{atrasadas}</b> meta(s) atrasada(s). Reavalie o prazo ou o escopo.
          </p>
        </Card>
      )}

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
        <DialogTrigger asChild>
          <Button className="w-full gap-2"><Plus className="w-4 h-4" />Nova Meta</Button>
        </DialogTrigger>
        <MetaForm meta={editing} onSaved={() => { setOpen(false); setEditing(null); void load(); }} />
      </Dialog>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : metas.length === 0 ? (
        <Card className="p-8 text-center border-dashed">
          <Target className="w-12 h-12 mx-auto text-muted-foreground/60 mb-2" />
          <p className="text-sm text-muted-foreground">Você ainda não definiu metas. Comece criando uma!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {metas.map((m) => {
            const atrasada = m.data_fim && new Date(m.data_fim) < new Date() && m.progresso < 100;
            const concluida = m.progresso >= 100;
            return (
              <Card key={m.id} className={`p-4 space-y-3 ${concluida ? "border-emerald-500/40 bg-emerald-500/5" : atrasada ? "border-rose-500/30" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {concluida && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                      <h3 className="text-sm font-semibold truncate">{m.titulo}</h3>
                      <Badge variant="outline" className="text-[10px]">{TIPO_LABEL[m.tipo]}</Badge>
                      <Badge className={`text-[10px] ${PRIO_COLOR[m.prioridade]}`}>{m.prioridade}</Badge>
                    </div>
                    {m.descricao && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{m.descricao}</p>}
                    {m.data_fim && (
                      <p className={`text-[11px] mt-1 flex items-center gap-1 ${atrasada ? "text-rose-600" : "text-muted-foreground"}`}>
                        <Calendar className="w-3 h-3" />
                        Prazo: {new Date(m.data_fim + "T12:00:00").toLocaleDateString("pt-BR")}
                        {atrasada && " (atrasada)"}
                      </p>
                    )}
                  </div>
                  <Button size="icon" variant="ghost" onClick={() => remove(m.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" />Progresso</span>
                    <span className="font-bold">{m.progresso}%</span>
                  </div>
                  <Progress value={m.progresso} className="h-2" />
                  <Slider
                    value={[m.progresso]}
                    max={100}
                    step={5}
                    onValueChange={(v) => setMetas((s) => s.map((x) => (x.id === m.id ? { ...x, progresso: v[0] } : x)))}
                    onValueCommit={(v) => updateProgresso(m, v[0])}
                    className="pt-1"
                  />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <Card className="p-3 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
    </Card>
  );
}

function MetaForm({ meta, onSaved }: { meta: Meta | null; onSaved: () => void }) {
  const { user } = useAuth();
  const [titulo, setTitulo] = useState(meta?.titulo ?? "");
  const [descricao, setDescricao] = useState(meta?.descricao ?? "");
  const [dataFim, setDataFim] = useState(meta?.data_fim ?? "");
  const [tipo, setTipo] = useState<Meta["tipo"]>(meta?.tipo ?? "pessoal");
  const [prioridade, setPrioridade] = useState<Meta["prioridade"]>(meta?.prioridade ?? "media");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!user) return;
    if (!titulo.trim()) return toast.error("Informe o título");
    setSaving(true);
    const payload = {
      user_id: user.id,
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      data_fim: dataFim || null,
      tipo,
      prioridade,
    };
    const { error } = meta
      ? await supabase.from("metas_colaborador").update(payload).eq("id", meta.id)
      : await supabase.from("metas_colaborador").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(meta ? "Meta atualizada" : "Meta criada!");
    onSaved();
  }

  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{meta ? "Editar Meta" : "Nova Meta"}</DialogTitle></DialogHeader>
      <div className="space-y-3">
        <div>
          <Label className="text-xs">Título *</Label>
          <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex: Concluir curso de React" maxLength={120} />
        </div>
        <div>
          <Label className="text-xs">Descrição</Label>
          <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} placeholder="Detalhes ou resultados-chave" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as Meta["tipo"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pessoal">Pessoal</SelectItem>
                <SelectItem value="equipe">Equipe</SelectItem>
                <SelectItem value="empresa">Empresa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Prioridade</Label>
            <Select value={prioridade} onValueChange={(v) => setPrioridade(v as Meta["prioridade"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label className="text-xs">Prazo (opcional)</Label>
          <Input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={save} disabled={saving} className="w-full">
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {meta ? "Salvar Alterações" : "Criar Meta"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
