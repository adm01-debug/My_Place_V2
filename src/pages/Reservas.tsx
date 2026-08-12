import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CalendarClock, MapPin, Users, Plus, XCircle, DoorOpen, Car, Package, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Recurso = {
  id: string;
  nome: string;
  tipo: "sala" | "veiculo" | "equipamento" | "outro";
  localizacao: string | null;
  capacidade: number | null;
  descricao: string | null;
  ativo: boolean;
};

type Reserva = {
  id: string;
  recurso_id: string;
  user_id: string;
  titulo: string;
  descricao: string | null;
  data_inicio: string;
  data_fim: string;
  participantes: number | null;
  status: "confirmada" | "cancelada" | "concluida";
  motivo_cancelamento: string | null;
};

const TIPO_ICON = { sala: DoorOpen, veiculo: Car, equipamento: Package, outro: Sparkles };
const TIPO_LABEL = { sala: "Sala", veiculo: "Veículo", equipamento: "Equipamento", outro: "Outro" };

export default function Reservas() {
  const { user } = useAuth();
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    recurso_id: "",
    titulo: "",
    descricao: "",
    data_inicio: "",
    data_fim: "",
    participantes: "",
  });

  const load = async () => {
    setLoading(true);
    const [r1, r2] = await Promise.all([
      supabase.from("salas_recursos").select("*").eq("ativo", true).order("tipo").order("nome"),
      supabase
        .from("reservas_recursos")
        .select("*")
        .gte("data_fim", new Date().toISOString())
        .order("data_inicio", { ascending: true }),
    ]);
    if (r1.error) toast.error("Erro ao carregar recursos");
    if (r2.error) toast.error("Erro ao carregar reservas");
    setRecursos((r1.data ?? []) as Recurso[]);
    setReservas((r2.data ?? []) as Reserva[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const minhasReservas = useMemo(
    () => reservas.filter((r) => r.user_id === user?.id && r.status === "confirmada"),
    [reservas, user?.id]
  );

  const nextByRecurso = useMemo(() => {
    const map = new Map<string, Reserva[]>();
    for (const r of reservas.filter((r) => r.status === "confirmada")) {
      const list = map.get(r.recurso_id) ?? [];
      list.push(r);
      map.set(r.recurso_id, list);
    }
    return map;
  }, [reservas]);

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.recurso_id || !form.titulo || !form.data_inicio || !form.data_fim) {
      toast.error("Preencha recurso, título e horários");
      return;
    }
    if (new Date(form.data_fim) <= new Date(form.data_inicio)) {
      toast.error("O horário final deve ser após o inicial");
      return;
    }
    const { error } = await supabase.from("reservas_recursos").insert({
      recurso_id: form.recurso_id,
      user_id: user.id,
      titulo: form.titulo,
      descricao: form.descricao || null,
      data_inicio: new Date(form.data_inicio).toISOString(),
      data_fim: new Date(form.data_fim).toISOString(),
      participantes: form.participantes ? Number(form.participantes) : null,
    });
    if (error) {
      if (error.message.includes("reserva_sem_conflito")) {
        toast.error("Este recurso já está reservado nesse horário");
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success("Reserva confirmada ✅");
    setOpen(false);
    setForm({ recurso_id: "", titulo: "", descricao: "", data_inicio: "", data_fim: "", participantes: "" });
    load();
  };

  const cancelar = async (id: string) => {
    const motivo = window.prompt("Motivo do cancelamento (opcional):") ?? "";
    const { error } = await supabase
      .from("reservas_recursos")
      .update({ status: "cancelada", cancelada_em: new Date().toISOString(), motivo_cancelamento: motivo || null })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Reserva cancelada");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarClock className="w-6 h-6 text-primary" /> Reservas de Salas & Recursos
          </h1>
          <p className="text-sm text-muted-foreground">Agende salas, veículos e equipamentos sem conflito de horários</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Nova reserva</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nova reserva</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Recurso</Label>
                <Select value={form.recurso_id} onValueChange={(v) => setForm({ ...form, recurso_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione um recurso" /></SelectTrigger>
                  <SelectContent>
                    {recursos.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {TIPO_LABEL[r.tipo]} · {r.nome}
                        {r.capacidade ? ` (${r.capacidade} pax)` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Título</Label>
                <Input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: Reunião de planejamento Q3" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Início</Label>
                  <Input type="datetime-local" value={form.data_inicio} onChange={(e) => setForm({ ...form, data_inicio: e.target.value })} />
                </div>
                <div>
                  <Label>Fim</Label>
                  <Input type="datetime-local" value={form.data_fim} onChange={(e) => setForm({ ...form, data_fim: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Participantes (opcional)</Label>
                <Input type="number" min={1} value={form.participantes} onChange={(e) => setForm({ ...form, participantes: e.target.value })} />
              </div>
              <div>
                <Label>Descrição (opcional)</Label>
                <Textarea value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} rows={3} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit}>Confirmar reserva</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Minhas reservas ativas</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando…</p>
          ) : minhasReservas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Você não tem reservas futuras.</p>
          ) : (
            <div className="space-y-2">
              {minhasReservas.map((r) => {
                const recurso = recursos.find((x) => x.id === r.recurso_id);
                return (
                  <div key={r.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium">{r.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {recurso?.nome} · {format(new Date(r.data_inicio), "dd/MM HH:mm", { locale: ptBR })} → {format(new Date(r.data_fim), "HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => cancelar(r.id)}>
                      <XCircle className="w-4 h-4 mr-1" /> Cancelar
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {recursos.map((r) => {
          const Icon = TIPO_ICON[r.tipo];
          const proximas = (nextByRecurso.get(r.id) ?? []).slice(0, 3);
          return (
            <Card key={r.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className="w-4 h-4 text-primary" /> {r.nome}
                    </CardTitle>
                    {r.localizacao && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {r.localizacao}
                      </p>
                    )}
                  </div>
                  {r.capacidade && (
                    <Badge variant="secondary" className="gap-1">
                      <Users className="w-3 h-3" /> {r.capacidade}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {r.descricao && <p className="text-xs text-muted-foreground mb-2">{r.descricao}</p>}
                <p className="text-xs font-medium mb-1">Próximas reservas:</p>
                {proximas.length === 0 ? (
                  <p className="text-xs text-muted-foreground">Livre nos próximos dias</p>
                ) : (
                  <ul className="space-y-1">
                    {proximas.map((p) => (
                      <li key={p.id} className="text-xs text-muted-foreground">
                        • {format(new Date(p.data_inicio), "dd/MM HH:mm", { locale: ptBR })} → {format(new Date(p.data_fim), "HH:mm", { locale: ptBR })}
                      </li>
                    ))}
                  </ul>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full mt-3"
                  onClick={() => {
                    setForm({ ...form, recurso_id: r.id });
                    setOpen(true);
                  }}
                >
                  Reservar este recurso
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
