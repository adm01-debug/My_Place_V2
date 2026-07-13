import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { Plane, MapPin, Calendar, DollarSign, Plus, Receipt, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Viagem = {
  id: string; codigo: string; user_id: string; origem: string; destino: string; motivo: string;
  meio_transporte: string; data_ida: string; data_volta: string;
  valor_estimado: number; adiantamento_solicitado: number; adiantamento_liberado: number;
  total_despesas: number; saldo: number; status: string; observacoes: string | null;
  duracao_dias?: number; total_lancamentos?: number; situacao_financeira?: string;
};

type Despesa = {
  id: string; viagem_id: string; categoria: string; descricao: string;
  data_despesa: string; valor: number; reembolsavel: boolean; comprovante_url: string | null;
};

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pendente: { label: "Pendente", variant: "secondary" },
  aprovada: { label: "Aprovada", variant: "default" },
  reprovada: { label: "Reprovada", variant: "destructive" },
  em_andamento: { label: "Em andamento", variant: "default" },
  prestacao_pendente: { label: "Prestação pendente", variant: "outline" },
  prestacao_enviada: { label: "Prestação enviada", variant: "outline" },
  concluida: { label: "Concluída", variant: "default" },
  cancelada: { label: "Cancelada", variant: "destructive" },
};

const CATEGORIAS = [
  { v: "passagem", l: "Passagem" },
  { v: "hospedagem", l: "Hospedagem" },
  { v: "alimentacao", l: "Alimentação" },
  { v: "transporte_local", l: "Transporte local" },
  { v: "combustivel", l: "Combustível" },
  { v: "pedagio", l: "Pedágio" },
  { v: "estacionamento", l: "Estacionamento" },
  { v: "material", l: "Material" },
  { v: "outros", l: "Outros" },
];

const brl = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n || 0);

export default function Viagens() {
  const { user, isAdmin, isGestor } = useAuth();
  const qc = useQueryClient();
  const [openNova, setOpenNova] = useState(false);
  const [viagemDespesas, setViagemDespesas] = useState<Viagem | null>(null);

  const { data: viagens = [], isLoading } = useQuery({
    queryKey: ["viagens"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_viagens_resumo")
        .select("*")
        .order("data_ida", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Viagem[];
    },
  });

  const criar = useMutation({
    mutationFn: async (payload: Partial<Viagem>) => {
      const insertPayload = { ...payload, user_id: user!.id } as unknown as
        Database["public"]["Tables"]["viagens"]["Insert"];
      const { error } = await supabase.from("viagens").insert(insertPayload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Viagem solicitada!");
      qc.invalidateQueries({ queryKey: ["viagens"] });
      setOpenNova(false);
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  });

  const mudarStatus = useMutation({
    mutationFn: async ({ id, status, adiantamento_liberado }: { id: string; status: string; adiantamento_liberado?: number }) => {
      const patch: Database["public"]["Tables"]["viagens"]["Update"] = {
        status,
        aprovador_id: user!.id,
        aprovado_em: new Date().toISOString(),
      };
      if (typeof adiantamento_liberado === "number") patch.adiantamento_liberado = adiantamento_liberado;
      const { error } = await supabase.from("viagens").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status atualizado.");
      qc.invalidateQueries({ queryKey: ["viagens"] });
    },
    onError: (e: unknown) => toast.error(getErrorMessage(e)),
  });

  const kpis = {
    total: viagens.length,
    aprovadas: viagens.filter((v) => v.status === "aprovada" || v.status === "em_andamento").length,
    pendentes: viagens.filter((v) => v.status === "pendente").length,
    prestacao: viagens.filter((v) => v.status.startsWith("prestacao")).length,
  };

  const podeAprovar = isAdmin || isGestor;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Plane className="h-7 w-7 text-primary" />
            Viagens Corporativas
          </h1>
          <p className="text-muted-foreground text-sm">Solicite, acompanhe e preste contas das suas viagens a trabalho.</p>
        </div>
        <Dialog open={openNova} onOpenChange={setOpenNova}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Nova viagem</Button>
          </DialogTrigger>
          <NovaViagemDialog onSubmit={(p) => criar.mutate(p)} loading={criar.isPending} />
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard icon={<Plane className="h-4 w-4" />} label="Total" value={kpis.total} />
        <KpiCard icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} label="Aprovadas" value={kpis.aprovadas} />
        <KpiCard icon={<Clock className="h-4 w-4 text-amber-500" />} label="Pendentes" value={kpis.pendentes} />
        <KpiCard icon={<Receipt className="h-4 w-4 text-blue-500" />} label="Em prestação" value={kpis.prestacao} />
      </div>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      ) : viagens.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">Nenhuma viagem registrada.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {viagens.map((v) => {
            const badge = STATUS_BADGE[v.status] ?? { label: v.status, variant: "outline" as const };
            return (
              <Card key={v.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 space-y-3">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-mono">{v.codigo}</span>
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 font-semibold">
                        <MapPin className="h-4 w-4 text-primary" />
                        {v.origem} → {v.destino}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(v.data_ida), "dd/MM/yy", { locale: ptBR })} –{" "}
                        {format(new Date(v.data_volta), "dd/MM/yy", { locale: ptBR })}
                        {v.duracao_dias ? <span className="ml-1">({v.duracao_dias} dias)</span> : null}
                        <span className="ml-2 capitalize">{v.meio_transporte.replace("_", " ")}</span>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="flex items-center gap-1 justify-end text-muted-foreground">
                        <DollarSign className="h-3 w-3" /> Estimado
                      </div>
                      <div className="font-semibold">{brl(v.valor_estimado)}</div>
                      {v.adiantamento_liberado > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Adiant.: <span className="font-medium text-foreground">{brl(v.adiantamento_liberado)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">{v.motivo}</p>

                  {(v.status === "prestacao_pendente" || v.status === "prestacao_enviada" || v.status === "concluida") && (
                    <div className="flex items-center justify-between text-xs bg-muted/40 rounded-md px-3 py-2">
                      <span>Despesas: <b>{brl(v.total_despesas)}</b></span>
                      <span>
                        Saldo: <b className={v.saldo < 0 ? "text-red-500" : "text-green-500"}>{brl(v.saldo)}</b>
                      </span>
                      {v.situacao_financeira && (
                        <Badge variant="outline" className="capitalize">{v.situacao_financeira.replace(/_/g, " ")}</Badge>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => setViagemDespesas(v)}>
                      <Receipt className="h-4 w-4 mr-1" /> Despesas ({v.total_lancamentos ?? 0})
                    </Button>

                    {podeAprovar && v.status === "pendente" && (
                      <>
                        <AprovarBtn onConfirm={(adi) => mudarStatus.mutate({ id: v.id, status: "aprovada", adiantamento_liberado: adi })} sugestao={v.adiantamento_solicitado} />
                        <Button size="sm" variant="destructive" onClick={() => mudarStatus.mutate({ id: v.id, status: "reprovada" })}>
                          <XCircle className="h-4 w-4 mr-1" /> Reprovar
                        </Button>
                      </>
                    )}
                    {v.user_id === user?.id && v.status === "aprovada" && (
                      <Button size="sm" variant="secondary" onClick={() => mudarStatus.mutate({ id: v.id, status: "em_andamento" })}>
                        Iniciar viagem
                      </Button>
                    )}
                    {v.user_id === user?.id && v.status === "em_andamento" && (
                      <Button size="sm" variant="secondary" onClick={() => mudarStatus.mutate({ id: v.id, status: "prestacao_pendente" })}>
                        Finalizar e prestar contas
                      </Button>
                    )}
                    {v.user_id === user?.id && v.status === "prestacao_pendente" && (
                      <Button size="sm" onClick={() => mudarStatus.mutate({ id: v.id, status: "prestacao_enviada" })}>
                        Enviar prestação
                      </Button>
                    )}
                    {podeAprovar && v.status === "prestacao_enviada" && (
                      <Button size="sm" onClick={() => mudarStatus.mutate({ id: v.id, status: "concluida" })}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Concluir
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <DespesasDialog viagem={viagemDespesas} onClose={() => setViagemDespesas(null)} />
    </div>
  );
}

function KpiCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="text-xs text-muted-foreground flex items-center gap-1">{icon} {label}</div>
        <div className="text-2xl font-bold mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}

function AprovarBtn({ onConfirm, sugestao }: { onConfirm: (adi: number) => void; sugestao: number }) {
  const [open, setOpen] = useState(false);
  const [valor, setValor] = useState(sugestao?.toString() ?? "0");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><CheckCircle2 className="h-4 w-4 mr-1" /> Aprovar</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Aprovar viagem</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Label>Adiantamento a liberar (R$)</Label>
          <Input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
        </div>
        <DialogFooter>
          <Button onClick={() => { onConfirm(parseFloat(valor) || 0); setOpen(false); }}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NovaViagemDialog({ onSubmit, loading }: { onSubmit: (p: Partial<Viagem>) => void; loading: boolean }) {
  const [f, setF] = useState({
    origem: "", destino: "", motivo: "", meio_transporte: "aereo",
    data_ida: "", data_volta: "", valor_estimado: "0", adiantamento_solicitado: "0", observacoes: "",
  });
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>Nova viagem</DialogTitle></DialogHeader>
      <div className="grid gap-3">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Origem</Label><Input value={f.origem} onChange={(e) => setF({ ...f, origem: e.target.value })} /></div>
          <div><Label>Destino</Label><Input value={f.destino} onChange={(e) => setF({ ...f, destino: e.target.value })} /></div>
        </div>
        <div><Label>Motivo</Label><Textarea rows={2} value={f.motivo} onChange={(e) => setF({ ...f, motivo: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Meio de transporte</Label>
            <Select value={f.meio_transporte} onValueChange={(v) => setF({ ...f, meio_transporte: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="aereo">Aéreo</SelectItem>
                <SelectItem value="rodoviario">Rodoviário</SelectItem>
                <SelectItem value="ferroviario">Ferroviário</SelectItem>
                <SelectItem value="veiculo_proprio">Veículo próprio</SelectItem>
                <SelectItem value="veiculo_empresa">Veículo da empresa</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Valor estimado (R$)</Label><Input type="number" step="0.01" value={f.valor_estimado} onChange={(e) => setF({ ...f, valor_estimado: e.target.value })} /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Ida</Label><Input type="date" value={f.data_ida} onChange={(e) => setF({ ...f, data_ida: e.target.value })} /></div>
          <div><Label>Volta</Label><Input type="date" value={f.data_volta} onChange={(e) => setF({ ...f, data_volta: e.target.value })} /></div>
        </div>
        <div><Label>Adiantamento solicitado (R$)</Label><Input type="number" step="0.01" value={f.adiantamento_solicitado} onChange={(e) => setF({ ...f, adiantamento_solicitado: e.target.value })} /></div>
        <div><Label>Observações</Label><Textarea rows={2} value={f.observacoes} onChange={(e) => setF({ ...f, observacoes: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button
          disabled={loading || !f.origem || !f.destino || !f.motivo || !f.data_ida || !f.data_volta}
          onClick={() => onSubmit({
            origem: f.origem, destino: f.destino, motivo: f.motivo, meio_transporte: f.meio_transporte,
            data_ida: f.data_ida, data_volta: f.data_volta,
            valor_estimado: parseFloat(f.valor_estimado) || 0,
            adiantamento_solicitado: parseFloat(f.adiantamento_solicitado) || 0,
            observacoes: f.observacoes,
          })}
        >
          Solicitar
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function DespesasDialog({ viagem, onClose }: { viagem: Viagem | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [nova, setNova] = useState({ categoria: "alimentacao", descricao: "", data_despesa: "", valor: "", reembolsavel: true, comprovante_url: "" });

  const { data: despesas = [] } = useQuery({
    queryKey: ["viagem_despesas", viagem?.id],
    enabled: !!viagem,
    queryFn: async () => {
      const { data, error } = await supabase.from("viagens_despesas").select("*").eq("viagem_id", viagem!.id).order("data_despesa", { ascending: false });
      if (error) throw error;
      return (data as Despesa[]) || [];
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("viagens_despesas").insert({
        viagem_id: viagem!.id, user_id: user!.id,
        categoria: nova.categoria, descricao: nova.descricao, data_despesa: nova.data_despesa,
        valor: parseFloat(nova.valor), reembolsavel: nova.reembolsavel,
        comprovante_url: nova.comprovante_url || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Despesa lançada.");
      qc.invalidateQueries({ queryKey: ["viagem_despesas", viagem!.id] });
      qc.invalidateQueries({ queryKey: ["viagens"] });
      setNova({ categoria: "alimentacao", descricao: "", data_despesa: "", valor: "", reembolsavel: true, comprovante_url: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("viagens_despesas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["viagem_despesas", viagem!.id] });
      qc.invalidateQueries({ queryKey: ["viagens"] });
    },
  });

  if (!viagem) return null;
  const total = despesas.reduce((s, d) => s + (d.reembolsavel ? Number(d.valor) : 0), 0);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Despesas — {viagem.codigo}</DialogTitle></DialogHeader>

        <Card className="bg-muted/30">
          <CardContent className="p-3 grid grid-cols-3 gap-2 text-sm">
            <div>Adiantamento<br /><b>{brl(viagem.adiantamento_liberado)}</b></div>
            <div>Total reembolsável<br /><b>{brl(total)}</b></div>
            <div>Saldo<br /><b className={viagem.adiantamento_liberado - total < 0 ? "text-red-500" : "text-green-500"}>{brl(viagem.adiantamento_liberado - total)}</b></div>
          </CardContent>
        </Card>

        <div className="grid gap-2 border rounded-md p-3">
          <div className="text-sm font-medium">Nova despesa</div>
          <div className="grid grid-cols-2 gap-2">
            <Select value={nova.categoria} onValueChange={(v) => setNova({ ...nova, categoria: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIAS.map((c) => <SelectItem key={c.v} value={c.v}>{c.l}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="date" value={nova.data_despesa} onChange={(e) => setNova({ ...nova, data_despesa: e.target.value })} />
          </div>
          <Input placeholder="Descrição" value={nova.descricao} onChange={(e) => setNova({ ...nova, descricao: e.target.value })} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" step="0.01" placeholder="Valor" value={nova.valor} onChange={(e) => setNova({ ...nova, valor: e.target.value })} />
            <Input placeholder="URL do comprovante (opcional)" value={nova.comprovante_url} onChange={(e) => setNova({ ...nova, comprovante_url: e.target.value })} />
          </div>
          <Button
            size="sm"
            disabled={!nova.descricao || !nova.data_despesa || !nova.valor || add.isPending}
            onClick={() => add.mutate()}
          >
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </div>

        <div className="space-y-2">
          {despesas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma despesa lançada.</p>
          ) : despesas.map((d) => (
            <div key={d.id} className="flex items-center justify-between border rounded-md p-2 text-sm">
              <div>
                <div className="font-medium">{d.descricao}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {d.categoria.replace("_", " ")} • {format(new Date(d.data_despesa), "dd/MM/yyyy")}
                  {!d.reembolsavel && <span className="ml-1">(não reembolsável)</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{brl(Number(d.valor))}</span>
                <Button size="sm" variant="ghost" onClick={() => del.mutate(d.id)}>Excluir</Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
