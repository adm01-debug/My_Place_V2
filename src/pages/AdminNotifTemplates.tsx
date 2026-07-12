import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Eye, Copy, Power } from "lucide-react";

interface Template {
  id: string;
  codigo: string;
  categoria: string;
  canal: string;
  idioma: string;
  versao: number;
  ativo: boolean;
  titulo_template: string;
  mensagem_template: string;
  variaveis_esperadas: string[];
  descricao: string | null;
  updated_at: string;
}

const CANAIS = ["in_app", "push", "email", "sms", "whatsapp"];
const CATEGORIAS = ["financeiro", "rh", "ponto", "documentos", "sistema", "social"];

function renderPreview(tpl: string, vars: Record<string, string>): string {
  let out = tpl || "";
  Object.entries(vars).forEach(([k, v]) => {
    out = out.replaceAll(`{{${k}}}`, v || `{{${k}}}`);
  });
  return out;
}

export default function AdminNotifTemplates() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Template> | null>(null);
  const [previewVars, setPreviewVars] = useState<Record<string, string>>({});
  const [filterCanal, setFilterCanal] = useState<string>("all");

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["notif-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notificacao_templates")
        .select("*")
        .order("categoria", { ascending: true })
        .order("codigo", { ascending: true })
        .order("versao", { ascending: false });
      if (error) throw error;
      return data as unknown as Template[];
    },
  });

  const filtered = useMemo(
    () => templates.filter((t) => filterCanal === "all" || t.canal === filterCanal),
    [templates, filterCanal]
  );

  const saveMutation = useMutation({
    mutationFn: async (t: Partial<Template>) => {
      const varsArr = (t.variaveis_esperadas as string[]) || [];
      if (t.id) {
        const { error } = await supabase
          .from("notificacao_templates")
          .update({
            titulo_template: t.titulo_template,
            mensagem_template: t.mensagem_template,
            categoria: t.categoria,
            canal: t.canal,
            idioma: t.idioma,
            ativo: t.ativo,
            descricao: t.descricao,
            variaveis_esperadas: varsArr,
          })
          .eq("id", t.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("notificacao_templates").insert({
          codigo: t.codigo!,
          categoria: t.categoria!,
          canal: t.canal || "in_app",
          idioma: t.idioma || "pt-BR",
          versao: t.versao || 1,
          ativo: t.ativo ?? true,
          titulo_template: t.titulo_template!,
          mensagem_template: t.mensagem_template!,
          variaveis_esperadas: varsArr,
          descricao: t.descricao ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Template salvo");
      qc.invalidateQueries({ queryKey: ["notif-templates"] });
      setEditing(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async (t: Template) => {
      const { error } = await supabase
        .from("notificacao_templates")
        .update({ ativo: !t.ativo })
        .eq("id", t.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notif-templates"] }),
  });

  const duplicateAsNewVersion = useMutation({
    mutationFn: async (t: Template) => {
      const nextVersao =
        Math.max(...templates.filter((x) => x.codigo === t.codigo && x.canal === t.canal && x.idioma === t.idioma).map((x) => x.versao)) + 1;
      const { error } = await supabase.from("notificacao_templates").insert({
        codigo: t.codigo,
        categoria: t.categoria,
        canal: t.canal,
        idioma: t.idioma,
        versao: nextVersao,
        ativo: false,
        titulo_template: t.titulo_template,
        mensagem_template: t.mensagem_template,
        variaveis_esperadas: t.variaveis_esperadas,
        descricao: t.descricao,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Nova versão criada (inativa)");
      qc.invalidateQueries({ queryKey: ["notif-templates"] });
    },
  });

  const openNew = () =>
    setEditing({
      codigo: "",
      categoria: "sistema",
      canal: "in_app",
      idioma: "pt-BR",
      versao: 1,
      ativo: true,
      titulo_template: "",
      mensagem_template: "",
      variaveis_esperadas: [],
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Templates de Notificação</h1>
          <p className="text-sm text-muted-foreground">Gerencie títulos, mensagens e variáveis com versionamento e preview.</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterCanal} onValueChange={setFilterCanal}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os canais</SelectItem>
              {CANAIS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Novo</Button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="py-10 text-center text-muted-foreground">Nenhum template.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((t) => (
            <Card key={t.id} className={t.ativo ? "" : "opacity-60"}>
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">{t.codigo}</CardTitle>
                    <Badge variant="outline">{t.categoria}</Badge>
                    <Badge variant="secondary">{t.canal}</Badge>
                    <Badge variant="outline">{t.idioma}</Badge>
                    <Badge>v{t.versao}</Badge>
                    {t.ativo && <Badge className="bg-emerald-600">Ativo</Badge>}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => { setPreviewVars({}); setEditing(t); }}>
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => duplicateAsNewVersion.mutate(t)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => toggleActive.mutate(t)}>
                      <Power className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-1">
                <p className="font-medium text-sm">{t.titulo_template}</p>
                <p className="text-sm text-muted-foreground">{t.mensagem_template}</p>
                {t.variaveis_esperadas?.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {t.variaveis_esperadas.map((v) => (
                      <Badge key={v} variant="outline" className="font-mono text-xs">{`{{${v}}}`}</Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar Template" : "Novo Template"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Código</Label>
                  <Input
                    value={editing.codigo || ""}
                    disabled={!!editing.id}
                    onChange={(e) => setEditing({ ...editing, codigo: e.target.value })}
                    placeholder="ex: vale_aprovado"
                  />
                </div>
                <div>
                  <Label>Categoria</Label>
                  <Select value={editing.categoria} onValueChange={(v) => setEditing({ ...editing, categoria: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Canal</Label>
                  <Select value={editing.canal} onValueChange={(v) => setEditing({ ...editing, canal: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CANAIS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Idioma</Label>
                  <Input value={editing.idioma || "pt-BR"} onChange={(e) => setEditing({ ...editing, idioma: e.target.value })} />
                </div>
              </div>

              <div>
                <Label>Título</Label>
                <Input
                  value={editing.titulo_template || ""}
                  onChange={(e) => setEditing({ ...editing, titulo_template: e.target.value })}
                />
              </div>
              <div>
                <Label>Mensagem</Label>
                <Textarea
                  rows={4}
                  value={editing.mensagem_template || ""}
                  onChange={(e) => setEditing({ ...editing, mensagem_template: e.target.value })}
                />
              </div>
              <div>
                <Label>Variáveis (separadas por vírgula)</Label>
                <Input
                  value={(editing.variaveis_esperadas as string[] | undefined)?.join(", ") || ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      variaveis_esperadas: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="nome, valor, data"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={editing.ativo ?? true} onCheckedChange={(v) => setEditing({ ...editing, ativo: v })} />
                <Label>Ativo</Label>
              </div>

              {(editing.variaveis_esperadas as string[] | undefined)?.length ? (
                <Card className="bg-muted/30">
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Preview</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {(editing.variaveis_esperadas as string[]).map((v) => (
                        <Input
                          key={v}
                          placeholder={v}
                          value={previewVars[v] || ""}
                          onChange={(e) => setPreviewVars({ ...previewVars, [v]: e.target.value })}
                        />
                      ))}
                    </div>
                    <div className="rounded border p-3 bg-background">
                      <p className="font-medium text-sm">{renderPreview(editing.titulo_template || "", previewVars)}</p>
                      <p className="text-sm text-muted-foreground">{renderPreview(editing.mensagem_template || "", previewVars)}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              <DialogFooter>
                <Button variant="ghost" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button
                  onClick={() => saveMutation.mutate(editing)}
                  disabled={!editing.codigo || !editing.titulo_template || !editing.mensagem_template || saveMutation.isPending}
                >
                  Salvar
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
