import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { FileText, Plus, Upload, CheckCircle2, XCircle, Clock } from "lucide-react";

type StatusJustif = "pendente" | "aprovada" | "recusada";
type TipoJustif = "esquecimento" | "atestado_medico" | "problema_tecnico" | "transporte" | "folga_compensada" | "outros";

const TIPO_LABELS: Record<TipoJustif, string> = {
  esquecimento: "Esquecimento",
  atestado_medico: "Atestado Médico",
  problema_tecnico: "Problema Técnico",
  transporte: "Transporte",
  folga_compensada: "Folga Compensada",
  outros: "Outros",
};

const STATUS_STYLE: Record<StatusJustif, { icon: typeof Clock; label: string; className: string }> = {
  pendente: { icon: Clock, label: "Pendente", className: "bg-yellow-500/15 text-yellow-600 border-yellow-500/30" },
  aprovada: { icon: CheckCircle2, label: "Aprovada", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  recusada: { icon: XCircle, label: "Recusada", className: "bg-red-500/15 text-red-600 border-red-500/30" },
};

export default function Justificativas() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [dataRef, setDataRef] = useState(format(new Date(), "yyyy-MM-dd"));
  const [tipo, setTipo] = useState<TipoJustif>("esquecimento");
  const [descricao, setDescricao] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: itens = [], isLoading } = useQuery({
    queryKey: ["justificativas", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("justificativas_ponto")
        .select("*")
        .eq("user_id", user!.id)
        .order("data_referencia", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const cancelar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("justificativas_ponto").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Justificativa removida");
      queryClient.invalidateQueries({ queryKey: ["justificativas"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (descricao.trim().length < 10) {
      toast.error("Descreva com ao menos 10 caracteres");
      return;
    }
    setSaving(true);
    try {
      let anexo_url: string | null = null;
      if (file) {
        const path = `${user.id}/${Date.now()}-${file.name}`;
        const { error: upErr } = await supabase.storage.from("anexos").upload(path, file);
        if (upErr) throw upErr;
        anexo_url = path;
      }
      const { error } = await supabase.from("justificativas_ponto").insert({
        user_id: user.id,
        data_referencia: dataRef,
        tipo,
        descricao: descricao.trim(),
        anexo_url,
      });
      if (error) throw error;
      toast.success("Justificativa enviada para aprovação");
      setOpen(false);
      setDescricao("");
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ["justificativas"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao enviar");
    } finally {
      setSaving(false);
    }
  }

  const pendentes = itens.filter((i) => i.status === "pendente").length;
  const aprovadas = itens.filter((i) => i.status === "aprovada").length;

  return (
    <div className="space-y-6 py-4">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Justificativas de Ponto
          </h1>
          <p className="text-sm text-muted-foreground">
            Registre ausências, esquecimentos ou problemas técnicos no ponto
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" /> Nova Justificativa</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Justificativa</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="data">Data de referência</Label>
                  <Input
                    id="data"
                    type="date"
                    value={dataRef}
                    max={format(new Date(), "yyyy-MM-dd")}
                    onChange={(e) => setDataRef(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Tipo</Label>
                  <Select value={tipo} onValueChange={(v) => setTipo(v as TipoJustif)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(TIPO_LABELS).map(([k, l]) => (
                        <SelectItem key={k} value={k}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="desc">Descrição detalhada</Label>
                <Textarea
                  id="desc"
                  rows={4}
                  minLength={10}
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Explique o motivo da justificativa..."
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="anexo" className="flex items-center gap-1">
                  <Upload className="w-4 h-4" /> Anexo (opcional)
                </Label>
                <Input
                  id="anexo"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button type="submit" disabled={saving}>{saving ? "Enviando..." : "Enviar"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total</p><p className="text-2xl font-bold">{itens.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pendentes</p><p className="text-2xl font-bold text-yellow-600">{pendentes}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Aprovadas</p><p className="text-2xl font-bold text-emerald-600">{aprovadas}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : itens.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p>Nenhuma justificativa enviada</p>
            </div>
          ) : (
            itens.map((j) => {
              const s = STATUS_STYLE[j.status as StatusJustif];
              const Icon = s.icon;
              return (
                <div key={j.id} className="p-4 border rounded-lg space-y-2 hover:bg-accent/30 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">{TIPO_LABELS[j.tipo as TipoJustif]}</p>
                      <p className="text-xs text-muted-foreground">
                        Ref: {format(new Date(j.data_referencia + "T00:00"), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <Badge variant="outline" className={s.className}>
                      <Icon className="w-3 h-3 mr-1" /> {s.label}
                    </Badge>
                  </div>
                  <p className="text-sm">{j.descricao}</p>
                  {j.observacao_admin && (
                    <p className="text-xs italic text-muted-foreground border-l-2 border-primary/40 pl-2">
                      Admin: {j.observacao_admin}
                    </p>
                  )}
                  {j.status === "pendente" && (
                    <div className="flex justify-end">
                      <Button size="sm" variant="ghost" onClick={() => cancelar.mutate(j.id)}>
                        Cancelar
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}
