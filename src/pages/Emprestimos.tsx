import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/portal/EmptyState";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Landmark, Plus, Calendar, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { getErrorMessage } from "@/lib/errors";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Emprestimo {
  id: string;
  valor_solicitado: number;
  num_parcelas: number;
  taxa_mensal: number;
  valor_parcela: number;
  valor_total: number;
  motivo: string | null;
  status: "pendente" | "aprovado" | "recusado" | "quitado" | "cancelado";
  observacao_admin: string | null;
  aprovado_em: string | null;
  created_at: string;
}
interface Parcela {
  id: string;
  emprestimo_id: string;
  numero: number;
  vencimento: string;
  valor: number;
  status: "pendente" | "paga" | "atrasada";
  paga_em: string | null;
}

const statusMap = {
  pendente: { label: "Em análise", cls: "bg-amber-500/15 text-amber-600 border-amber-500/30", Icon: Clock },
  aprovado: { label: "Aprovado", cls: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30", Icon: CheckCircle2 },
  recusado: { label: "Recusado", cls: "bg-rose-500/15 text-rose-600 border-rose-500/30", Icon: XCircle },
  quitado: { label: "Quitado", cls: "bg-sky-500/15 text-sky-600 border-sky-500/30", Icon: CheckCircle2 },
  cancelado: { label: "Cancelado", cls: "bg-muted text-muted-foreground border-muted", Icon: XCircle },
} as const;

const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v || 0);

// Price (Tabela Price): PMT = PV * i / (1 - (1+i)^-n)
function calcularParcela(valor: number, n: number, taxa: number) {
  if (taxa === 0) return valor / n;
  return (valor * taxa) / (1 - Math.pow(1 + taxa, -n));
}

export default function Emprestimos() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [valor, setValor] = useState("");
  const [parcelas, setParcelas] = useState("6");
  const [motivo, setMotivo] = useState("");
  const [detalhe, setDetalhe] = useState<Emprestimo | null>(null);

  const TAXA = 0.015;

  const { data: emprestimos, isLoading } = useQuery({
    queryKey: ["emprestimos", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emprestimos")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Emprestimo[];
    },
  });

  const { data: parcelasDetalhe } = useQuery({
    queryKey: ["parcelas", detalhe?.id],
    enabled: !!detalhe?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("parcelas_emprestimo")
        .select("*")
        .eq("emprestimo_id", detalhe!.id)
        .order("numero");
      if (error) throw error;
      return (data ?? []) as Parcela[];
    },
  });

  const valorNum = Number(valor.replace(",", ".")) || 0;
  const parcelasNum = Number(parcelas) || 1;
  const valorParcela = useMemo(
    () => calcularParcela(valorNum, parcelasNum, TAXA),
    [valorNum, parcelasNum],
  );
  const valorTotal = valorParcela * parcelasNum;

  const solicitar = useMutation({
    mutationFn: async () => {
      if (valorNum < 100) throw new Error("Valor mínimo de R$ 100,00");
      if (valorNum > 50000) throw new Error("Valor máximo de R$ 50.000,00");
      const { error } = await supabase.from("emprestimos").insert({
        user_id: user!.id,
        valor_solicitado: valorNum,
        num_parcelas: parcelasNum,
        taxa_mensal: TAXA,
        valor_parcela: Number(valorParcela.toFixed(2)),
        valor_total: Number(valorTotal.toFixed(2)),
        motivo: motivo.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Solicitação enviada", description: "Aguarde a aprovação do RH." });
      qc.invalidateQueries({ queryKey: ["emprestimos"] });
      setOpen(false);
      setValor("");
      setMotivo("");
      setParcelas("6");
    },
    onError: (e: unknown) => toast({ title: "Erro", description: getErrorMessage(e), variant: "destructive" }),
  });

  const cancelar = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("emprestimos")
        .update({ status: "cancelado" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Solicitação cancelada" });
      qc.invalidateQueries({ queryKey: ["emprestimos"] });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const ativos = emprestimos?.filter((e) => e.status === "aprovado") ?? [];
  const totalDevedor = ativos.reduce((s, e) => s + Number(e.valor_total), 0);

  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={Landmark}
        title="Empréstimos Consignados"
        description="Solicite adiantamentos com desconto direto em folha."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1" /> Novo empréstimo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Simular empréstimo</DialogTitle>
                <DialogDescription>
                  Taxa fixa de {(TAXA * 100).toFixed(2)}% ao mês (Tabela Price).
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="valor">Valor desejado (R$)</Label>
                  <Input
                    id="valor"
                    inputMode="decimal"
                    placeholder="Ex.: 2000"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="parc">Número de parcelas</Label>
                  <Input
                    id="parc"
                    type="number"
                    min={1}
                    max={60}
                    value={parcelas}
                    onChange={(e) => setParcelas(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="mot">Motivo (opcional)</Label>
                  <Textarea
                    id="mot"
                    rows={2}
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    maxLength={300}
                  />
                </div>
                {valorNum > 0 && (
                  <div className="rounded-lg border bg-muted/40 p-4 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Parcela mensal</span>
                      <span className="font-semibold">{brl(valorParcela)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor total a pagar</span>
                      <span className="font-semibold">{brl(valorTotal)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Juros total</span>
                      <span>{brl(valorTotal - valorNum)}</span>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={() => solicitar.mutate()} disabled={solicitar.isPending || !valorNum}>
                  {solicitar.isPending ? "Enviando..." : "Solicitar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Empréstimos ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ativos.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Saldo devedor total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{brl(totalDevedor)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Taxa aplicada</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(TAXA * 100).toFixed(2)}% a.m.</div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : !emprestimos || emprestimos.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="Nenhum empréstimo ainda"
          description="Clique em 'Novo empréstimo' para simular e solicitar."
        />
      ) : (
        <div className="grid gap-3">
          {emprestimos.map((e) => {
            const st = statusMap[e.status];
            return (
              <Card
                key={e.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setDetalhe(e)}
              >
                <CardContent className="pt-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">{brl(e.valor_solicitado)}</span>
                      <Badge variant="outline" className={st.cls}>
                        <st.Icon className="h-3 w-3 mr-1" />
                        {st.label}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {e.num_parcelas}x de {brl(e.valor_parcela)} · Total {brl(e.valor_total)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Solicitado em{" "}
                      {format(new Date(e.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  </div>
                  {e.status === "pendente" && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        cancelar.mutate(e.id);
                      }}
                    >
                      Cancelar
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!detalhe} onOpenChange={(o) => !o && setDetalhe(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do empréstimo</DialogTitle>
          </DialogHeader>
          {detalhe && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">Valor</div>
                  <div className="font-semibold">{brl(detalhe.valor_solicitado)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Parcelas</div>
                  <div className="font-semibold">
                    {detalhe.num_parcelas}x de {brl(detalhe.valor_parcela)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Total</div>
                  <div className="font-semibold">{brl(detalhe.valor_total)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Status</div>
                  <Badge variant="outline" className={statusMap[detalhe.status].cls}>
                    {statusMap[detalhe.status].label}
                  </Badge>
                </div>
              </div>
              {detalhe.motivo && (
                <div className="text-sm">
                  <div className="text-muted-foreground">Motivo</div>
                  <div>{detalhe.motivo}</div>
                </div>
              )}
              {detalhe.observacao_admin && (
                <div className="text-sm rounded-md bg-muted p-3">
                  <div className="text-muted-foreground text-xs">Observação do RH</div>
                  <div>{detalhe.observacao_admin}</div>
                </div>
              )}
              {parcelasDetalhe && parcelasDetalhe.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Cronograma de parcelas</div>
                  <div className="max-h-64 overflow-y-auto rounded-md border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-xs text-muted-foreground">
                        <tr>
                          <th className="text-left px-3 py-2">#</th>
                          <th className="text-left px-3 py-2">Vencimento</th>
                          <th className="text-right px-3 py-2">Valor</th>
                          <th className="text-left px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parcelasDetalhe.map((p) => (
                          <tr key={p.id} className="border-t">
                            <td className="px-3 py-2">{p.numero}</td>
                            <td className="px-3 py-2">
                              {format(new Date(p.vencimento), "dd/MM/yyyy", { locale: ptBR })}
                            </td>
                            <td className="px-3 py-2 text-right">{brl(p.valor)}</td>
                            <td className="px-3 py-2">
                              <Badge
                                variant="outline"
                                className={
                                  p.status === "paga"
                                    ? statusMap.aprovado.cls
                                    : p.status === "atrasada"
                                      ? statusMap.recusado.cls
                                      : statusMap.pendente.cls
                                }
                              >
                                {p.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {(() => {
                    const pagas = parcelasDetalhe.filter((p) => p.status === "paga").length;
                    const pct = Math.round((pagas / parcelasDetalhe.length) * 100);
                    return (
                      <div className="mt-3 space-y-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progresso de quitação</span>
                          <span>
                            {pagas}/{parcelasDetalhe.length}
                          </span>
                        </div>
                        <Progress value={pct} />
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
