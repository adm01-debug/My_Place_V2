import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRoles } from "@/hooks/useUserRoles";
import { toast } from "sonner";
import { Plus, Zap, Send, CheckCircle2, AlertTriangle, Activity, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ConexaoCard } from "@/components/integracoes/ConexaoCard";
import { EventoRow } from "@/components/integracoes/EventoRow";
import { LogViewer } from "@/components/integracoes/LogViewer";
import { TestPanel, type TestResult } from "@/components/integracoes/TestPanel";

const TIPOS = ["webhook","bitrix24","n8n","whatsapp","smtp","erp_folha","slack","generico"] as const;
type Tipo = typeof TIPOS[number];

interface FormState {
  id?: string;
  nome: string;
  tipo: Tipo;
  descricao: string;
  endpoint: string;
  secret_ref: string;
  hmac_secret_ref: string;
  timeout_ms: number;
  headers_extra: string;
  ativo: boolean;
}

const emptyForm: FormState = {
  nome: "", tipo: "webhook", descricao: "", endpoint: "",
  secret_ref: "", hmac_secret_ref: "", timeout_ms: 15000,
  headers_extra: "{}", ativo: true,
};

export default function AdminIntegracoes() {
  const { isAdmin, isLoading: loadingRole } = useUserRoles();
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [openForm, setOpenForm] = useState(false);
  const [logEventoId, setLogEventoId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [filtroIntegracao, setFiltroIntegracao] = useState<string>("todas");

  const integracoes = useQuery({
    queryKey: ["integracoes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("integracoes").select("*").order("nome");
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  const stats = useQuery({
    queryKey: ["integracoes_stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("fn_integracao_estatisticas", { p_horas: 24 });
      if (error) throw error;
      return data ?? [];
    },
    enabled: isAdmin,
  });

  const eventos = useQuery({
    queryKey: ["integracoes_eventos", filtroStatus, filtroIntegracao],
    queryFn: async () => {
      let q = supabase.from("integracoes_eventos")
        .select("*, integracoes(nome)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (filtroStatus !== "todos") q = q.eq("status", filtroStatus);
      if (filtroIntegracao !== "todas") q = q.eq("integracao_id", filtroIntegracao);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
    refetchInterval: 15_000,
  });

  const salvar = useMutation({
    mutationFn: async (f: FormState) => {
      let headers_extra: Record<string, unknown> = {};
      try { headers_extra = JSON.parse(f.headers_extra || "{}"); } catch { throw new Error("Headers extra deve ser JSON válido"); }
      const payload = {
        nome: f.nome, tipo: f.tipo, descricao: f.descricao || null,
        endpoint: f.endpoint, secret_ref: f.secret_ref || null,
        hmac_secret_ref: f.hmac_secret_ref || null,
        timeout_ms: f.timeout_ms, headers_extra, ativo: f.ativo,
      };
      if (f.id) {
        const { error } = await supabase.from("integracoes").update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("integracoes").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Integração salva");
      setOpenForm(false); setForm(emptyForm);
      qc.invalidateQueries({ queryKey: ["integracoes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("integracoes").update({ ativo }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["integracoes"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const remover = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("integracoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removida");
      qc.invalidateQueries({ queryKey: ["integracoes"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const testar = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.functions.invoke("integracoes-test", {
        body: { integracao_id: id },
      });
      if (error) throw error;
      return data as TestResult;
    },
    onSuccess: (data) => setTestResult(data),
    onError: (e: Error) => toast.error(e.message),
  });

  const reenviar = useMutation({
    mutationFn: async (evento_id: string) => {
      await supabase.from("integracoes_eventos").update({
        status: "pendente", proxima_tentativa: new Date().toISOString(),
      }).eq("id", evento_id);
      const { error } = await supabase.functions.invoke("integracoes-dispatcher", {
        body: { evento_id },
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reenviado");
      qc.invalidateQueries({ queryKey: ["integracoes_eventos"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const processarFila = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("integracoes-dispatcher", {
        body: { limit: 50 },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (d) => {
      toast.success(`Fila processada: ${(d as { processados: number }).processados} eventos`);
      qc.invalidateQueries({ queryKey: ["integracoes_eventos"] });
      qc.invalidateQueries({ queryKey: ["integracoes_stats"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (loadingRole) return <Skeleton className="h-64" />;
  if (!isAdmin) return <Navigate to="/" replace />;

  const totalAtivas = (integracoes.data ?? []).filter((i) => i.ativo).length;
  const totalEventos = (stats.data ?? []).reduce((s, r) => s + Number(r.total_eventos ?? 0), 0);
  const totalFalhou = (stats.data ?? []).reduce((s, r) => s + Number(r.falhou ?? 0), 0);
  const taxaMedia = (() => {
    const rows = (stats.data ?? []).filter((r) => r.taxa_sucesso_pct != null);
    if (rows.length === 0) return null;
    return rows.reduce((s, r) => s + Number(r.taxa_sucesso_pct), 0) / rows.length;
  })();

  return (
    <div className="space-y-4 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Central de Integrações</h1>
          <p className="text-sm text-muted-foreground">
            Conecte sistemas externos com retry, HMAC e trilha completa.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => processarFila.mutate()} disabled={processarFila.isPending} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${processarFila.isPending ? "animate-spin" : ""}`} />
            Processar fila
          </Button>
          <Button onClick={() => { setForm(emptyForm); setOpenForm(true); }} className="gap-2">
            <Plus className="w-4 h-4" /> Nova
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Kpi icon={Zap} label="Ativas" value={String(totalAtivas)} />
        <Kpi icon={Send} label="Eventos 24h" value={String(totalEventos)} />
        <Kpi icon={CheckCircle2} label="Taxa sucesso" value={taxaMedia == null ? "—" : `${taxaMedia.toFixed(1)}%`} />
        <Kpi icon={AlertTriangle} label="Falhas 24h" value={String(totalFalhou)} tone={totalFalhou > 0 ? "destructive" : "default"} />
      </div>

      <Tabs defaultValue="conexoes">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="conexoes">Conexões</TabsTrigger>
          <TabsTrigger value="eventos">Eventos</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>

        <TabsContent value="conexoes" className="mt-4">
          {integracoes.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48" />)}
            </div>
          ) : (integracoes.data ?? []).length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">
              Nenhuma integração ainda. Clique em "Nova" para começar.
            </CardContent></Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(integracoes.data ?? []).map((i) => (
                <ConexaoCard
                  key={i.id}
                  integracao={i}
                  onToggle={(id, ativo) => toggle.mutate({ id, ativo })}
                  onTest={(id) => testar.mutate(id)}
                  onEdit={(id) => {
                    const it = (integracoes.data ?? []).find((x) => x.id === id);
                    if (!it) return;
                    setForm({
                      id: it.id, nome: it.nome, tipo: it.tipo as Tipo,
                      descricao: it.descricao ?? "", endpoint: it.endpoint,
                      secret_ref: it.secret_ref ?? "", hmac_secret_ref: it.hmac_secret_ref ?? "",
                      timeout_ms: it.timeout_ms, ativo: it.ativo,
                      headers_extra: JSON.stringify(it.headers_extra ?? {}, null, 2),
                    });
                    setOpenForm(true);
                  }}
                  onDelete={(id) => { if (confirm("Remover esta integração?")) remover.mutate(id); }}
                  testing={testar.isPending && testar.variables === i.id}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="eventos" className="mt-4 space-y-3">
          <div className="flex gap-2 flex-wrap">
            <Select value={filtroStatus} onValueChange={setFiltroStatus}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="processando">Processando</SelectItem>
                <SelectItem value="enviado">Enviado</SelectItem>
                <SelectItem value="falhou">Falhou</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filtroIntegracao} onValueChange={setFiltroIntegracao}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas integrações</SelectItem>
                {(integracoes.data ?? []).map((i) => (
                  <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Integração</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tentativas</TableHead>
                    <TableHead>Criado</TableHead>
                    <TableHead>Erro</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(eventos.data ?? []).map((e) => (
                    <EventoRow key={e.id} evento={e} onReenviar={(id) => reenviar.mutate(id)} onVer={setLogEventoId} />
                  ))}
                </TableBody>
              </Table>
              {(eventos.data ?? []).length === 0 && (
                <p className="text-center text-muted-foreground py-8">Nenhum evento no filtro atual.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Últimas 24 horas por integração</CardTitle>
              <CardDescription>Volume, taxa de sucesso e latência</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Integração</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Enviados</TableHead>
                    <TableHead className="text-right">Falhas</TableHead>
                    <TableHead className="text-right">Pendentes</TableHead>
                    <TableHead className="text-right">Sucesso</TableHead>
                    <TableHead className="text-right">Latência média</TableHead>
                    <TableHead className="text-right">p95</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(stats.data ?? []).map((r) => (
                    <TableRow key={r.integracao_id}>
                      <td className="p-2">{r.nome}</td>
                      <td className="p-2 text-right">{r.total_eventos}</td>
                      <td className="p-2 text-right text-success">{r.enviados}</td>
                      <td className="p-2 text-right text-destructive">{r.falhou}</td>
                      <td className="p-2 text-right">{r.pendentes}</td>
                      <td className="p-2 text-right">{r.taxa_sucesso_pct == null ? "—" : `${r.taxa_sucesso_pct}%`}</td>
                      <td className="p-2 text-right">{r.latencia_media_ms == null ? "—" : `${r.latencia_media_ms}ms`}</td>
                      <td className="p-2 text-right">{r.latencia_p95_ms == null ? "—" : `${r.latencia_p95_ms}ms`}</td>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <FormDialog open={openForm} onOpenChange={setOpenForm} form={form} setForm={setForm} onSave={() => salvar.mutate(form)} saving={salvar.isPending} />
      <LogViewer eventoId={logEventoId} onClose={() => setLogEventoId(null)} />
      <TestPanel result={testResult} onClose={() => setTestResult(null)} />
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone = "default" }: { icon: React.ElementType; label: string; value: string; tone?: "default" | "destructive" }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <Icon className="w-4 h-4" /> {label}
        </div>
        <div className={`text-2xl font-bold ${tone === "destructive" ? "text-destructive" : ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}

function FormDialog({ open, onOpenChange, form, setForm, onSave, saving }: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  form: FormState;
  setForm: (f: FormState) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form.id ? "Editar" : "Nova"} integração</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome</Label>
            <Input value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v as Tipo })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TIPOS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea rows={2} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          </div>
          <div>
            <Label>Endpoint (URL)</Label>
            <Input value={form.endpoint} onChange={(e) => setForm({ ...form, endpoint: e.target.value })} placeholder="https://..." />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Secret name (Bearer)</Label>
              <Input value={form.secret_ref} onChange={(e) => setForm({ ...form, secret_ref: e.target.value })} placeholder="ex: BITRIX24_TOKEN" />
            </div>
            <div>
              <Label>HMAC secret name</Label>
              <Input value={form.hmac_secret_ref} onChange={(e) => setForm({ ...form, hmac_secret_ref: e.target.value })} placeholder="ex: WEBHOOK_HMAC" />
            </div>
          </div>
          <div>
            <Label>Timeout (ms)</Label>
            <Input type="number" value={form.timeout_ms} onChange={(e) => setForm({ ...form, timeout_ms: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Headers extras (JSON)</Label>
            <Textarea rows={3} className="font-mono text-xs" value={form.headers_extra} onChange={(e) => setForm({ ...form, headers_extra: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={onSave} disabled={saving || !form.nome || !form.endpoint}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
