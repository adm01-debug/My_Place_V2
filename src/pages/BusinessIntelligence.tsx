import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRoles } from "@/hooks/useUserRoles";
import { toast } from "sonner";
import {
  Users,
  DollarSign,
  Activity,
  ShieldCheck,
  Heart,
  TrendingDown,
  RefreshCw,
  Snowflake,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { KpiCard } from "@/components/bi/KpiCard";
import { TrendChart } from "@/components/bi/TrendChart";
import { HeatmapDepartamentos } from "@/components/bi/HeatmapDepartamentos";
import { DrilldownTable } from "@/components/bi/DrilldownTable";
import { ExportPanel } from "@/components/bi/ExportPanel";

type Meses = 3 | 6 | 12;

type HeadcountRow = { mes: string; departamento: string; ativos: number } & Record<string, unknown>;
type AbsentRow = { mes: string; departamento: string; total_atestados: number; dias_afastados: number; taxa_absenteismo_pct: number | null } & Record<string, unknown>;
type CustoRow = { mes: string; departamento: string; salarios: number; reembolsos: number; viagens: number; vales: number; total: number } & Record<string, unknown>;
type TurnoverRow = { trimestre: string; departamento: string; admissoes: number; desligamentos: number; turnover_pct: number | null } & Record<string, unknown>;
type EngajRow = { mes: string; departamento: string; kudos: number; treinamentos_concluidos: number; clima_respostas: number; score_engajamento: number } & Record<string, unknown>;
type ComplianceRow = { departamento: string; politicas_pct: number | null; treinamentos_pct: number | null; epis_pct: number | null; score_geral: number | null } & Record<string, unknown>;

const currency = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(n);
const pct = (n: number | null | undefined) => (n == null ? "—" : `${Number(n).toFixed(1)}%`);
const formatMes = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });

export default function BusinessIntelligence() {
  const { isAdmin, isGestor, isLoading: loadingRole } = useUserRoles();
  const [meses, setMeses] = useState<Meses>(12);
  const [departamento, setDepartamento] = useState<string>("todos");
  const queryClient = useQueryClient();

  const hasAccess = isAdmin || isGestor;

  const headcount = useQuery({
    queryKey: ["bi", "headcount", meses],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("fn_bi_headcount", { p_meses: meses });
      if (error) throw error;
      return (data ?? []) as HeadcountRow[];
    },
    enabled: hasAccess,
    staleTime: 5 * 60 * 1000,
  });

  const absent = useQuery({
    queryKey: ["bi", "absent", meses],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("fn_bi_absenteismo", { p_meses: meses });
      if (error) throw error;
      return (data ?? []) as AbsentRow[];
    },
    enabled: hasAccess,
    staleTime: 5 * 60 * 1000,
  });

  const custo = useQuery({
    queryKey: ["bi", "custo", meses],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("fn_bi_custo", { p_meses: meses });
      if (error) throw error;
      return (data ?? []) as CustoRow[];
    },
    enabled: hasAccess,
    staleTime: 5 * 60 * 1000,
  });

  const turnover = useQuery({
    queryKey: ["bi", "turnover"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("fn_bi_turnover");
      if (error) throw error;
      return (data ?? []) as TurnoverRow[];
    },
    enabled: hasAccess,
    staleTime: 5 * 60 * 1000,
  });

  const engaj = useQuery({
    queryKey: ["bi", "engaj", meses],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("fn_bi_engajamento", { p_meses: meses });
      if (error) throw error;
      return (data ?? []) as EngajRow[];
    },
    enabled: hasAccess,
    staleTime: 5 * 60 * 1000,
  });

  const compliance = useQuery({
    queryKey: ["bi", "compliance"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("fn_bi_compliance");
      if (error) throw error;
      return (data ?? []) as ComplianceRow[];
    },
    enabled: hasAccess,
    staleTime: 5 * 60 * 1000,
  });

  const refresh = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("fn_bi_refresh_all");
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Views atualizadas");
      queryClient.invalidateQueries({ queryKey: ["bi"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const snapshot = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("fn_bi_criar_snapshot");
      if (error) throw error;
      return data;
    },
    onSuccess: () => toast.success("Snapshot mensal congelado"),
    onError: (e: Error) => toast.error(e.message),
  });

  const departamentos = useMemo(() => {
    const set = new Set<string>();
    headcount.data?.forEach((r) => set.add(r.departamento));
    return ["todos", ...Array.from(set).sort()];
  }, [headcount.data]);

  const filtro = <T extends { departamento: string }>(rows: T[] | undefined) =>
    (rows ?? []).filter((r) => departamento === "todos" || r.departamento === departamento);

  // Séries agregadas por mês para os charts — useMemo precisa rodar antes de qualquer
  // return condicional (regra dos hooks), por isso ficam aqui e não perto do uso no JSX.
  const headcountSerie = useMemo(() => {
    const rows = filtro(headcount.data);
    const map = new Map<string, number>();
    rows.forEach((r) => map.set(r.mes, (map.get(r.mes) || 0) + r.ativos));
    return Array.from(map.entries()).map(([mes, ativos]) => ({ mes: formatMes(mes), ativos }));
  }, [headcount.data, departamento]);

  const custoSerie = useMemo(() => {
    const rows = filtro(custo.data);
    const map = new Map<string, number>();
    rows.forEach((r) => map.set(r.mes, (map.get(r.mes) || 0) + Number(r.total)));
    return Array.from(map.entries()).map(([mes, total]) => ({ mes: formatMes(mes), total }));
  }, [custo.data, departamento]);

  const engajSerie = useMemo(() => {
    const rows = filtro(engaj.data);
    const map = new Map<string, number>();
    rows.forEach((r) => map.set(r.mes, (map.get(r.mes) || 0) + r.score_engajamento));
    return Array.from(map.entries()).map(([mes, score]) => ({ mes: formatMes(mes), score }));
  }, [engaj.data, departamento]);

  if (loadingRole) return <PageSkeleton />;
  if (!hasAccess) return <Navigate to="/" replace />;

  const kpiHeadcount = headcount.data
    ? headcount.data
        .filter((r) => r.mes === headcount.data![headcount.data!.length - 1]?.mes)
        .reduce((s, r) => s + (r.ativos || 0), 0)
    : 0;

  const kpiCustoAtual = custo.data
    ? custo.data
        .filter((r) => r.mes === custo.data![custo.data!.length - 1]?.mes)
        .reduce((s, r) => s + Number(r.total || 0), 0)
    : 0;

  const kpiAbsentMedio =
    absent.data && absent.data.length > 0
      ? absent.data.reduce((s, r) => s + Number(r.taxa_absenteismo_pct || 0), 0) / absent.data.length
      : 0;

  const kpiComplianceMedio =
    compliance.data && compliance.data.length > 0
      ? compliance.data.reduce((s, r) => s + Number(r.score_geral || 0), 0) / compliance.data.length
      : 100;

  const kpiEngajTotal = engaj.data
    ? engaj.data.reduce((s, r) => s + (r.score_engajamento || 0), 0)
    : 0;

  const kpiTurnoverMedio =
    turnover.data && turnover.data.length > 0
      ? turnover.data.reduce((s, r) => s + Number(r.turnover_pct || 0), 0) / turnover.data.length
      : 0;

  return (
    <div className="space-y-4 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Business Intelligence</h1>
          <p className="text-sm text-muted-foreground">
            Fonte única de verdade — KPIs consolidados de todos os módulos.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={String(meses)} onValueChange={(v) => setMeses(Number(v) as Meses)}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="3">Últimos 3 meses</SelectItem>
              <SelectItem value="6">Últimos 6 meses</SelectItem>
              <SelectItem value="12">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
          <Select value={departamento} onValueChange={setDepartamento}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {departamentos.map((d) => (
                <SelectItem key={d} value={d}>{d === "todos" ? "Todos os departamentos" : d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refresh.mutate()}
                disabled={refresh.isPending}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refresh.isPending ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => snapshot.mutate()}
                disabled={snapshot.isPending}
                className="gap-2"
              >
                <Snowflake className="w-4 h-4" />
                Congelar mês
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <KpiCard label="Headcount atual" value={String(kpiHeadcount)} icon={Users} tone="default" hint="Colaboradores ativos" />
        <KpiCard label="Custo do mês" value={currency(kpiCustoAtual)} icon={DollarSign} tone="warning" hint="Salários + variáveis" />
        <KpiCard label="Absenteísmo" value={pct(kpiAbsentMedio)} icon={Activity} tone="destructive" hint="Média período" />
        <KpiCard label="Turnover" value={pct(kpiTurnoverMedio)} icon={TrendingDown} tone="warning" hint="Média trimestral" />
        <KpiCard label="Compliance" value={pct(kpiComplianceMedio)} icon={ShieldCheck} tone="success" hint="Score geral" />
        <KpiCard label="Engajamento" value={String(kpiEngajTotal)} icon={Heart} tone="success" hint="Score consolidado" />
      </div>

      <ExportPanel meses={meses} />

      <Tabs defaultValue="pessoas" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pessoas">Pessoas</TabsTrigger>
          <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
          <TabsTrigger value="engajamento">Engajamento</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="pessoas" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Evolução de headcount</CardTitle>
              <CardDescription>Colaboradores ativos por mês</CardDescription>
            </CardHeader>
            <CardContent>
              {headcount.isLoading ? <Skeleton className="h-64" /> : <TrendChart data={headcountSerie} xKey="mes" yKey="ativos" label="Ativos" />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Turnover trimestral</CardTitle>
              <CardDescription>Admissões vs desligamentos</CardDescription>
            </CardHeader>
            <CardContent>
              <DrilldownTable
                rows={filtro(turnover.data)}
                columns={[
                  { key: "trimestre", label: "Trimestre", format: (v) => new Date(String(v)).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }) },
                  { key: "departamento", label: "Departamento" },
                  { key: "admissoes", label: "Admissões", align: "right" },
                  { key: "desligamentos", label: "Desligamentos", align: "right" },
                  { key: "turnover_pct", label: "Turnover", align: "right", format: (v) => pct(v as number | null) },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financeiro" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Custo total mensal</CardTitle>
              <CardDescription>Salários + reembolsos + viagens + vales</CardDescription>
            </CardHeader>
            <CardContent>
              {custo.isLoading ? <Skeleton className="h-64" /> : <TrendChart data={custoSerie} xKey="mes" yKey="total" label="Custo (R$)" color="hsl(var(--destructive))" />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Custo por departamento (mês atual)</CardTitle>
            </CardHeader>
            <CardContent>
              <HeatmapDepartamentos
                data={
                  filtro(custo.data)
                    .filter((r) => r.mes === custo.data?.[custo.data.length - 1]?.mes)
                    .map((r) => ({ departamento: r.departamento, valor: Number(r.total) }))
                }
                metricLabel="Custo total (R$)"
                format={(n) => currency(n)}
                invertScale
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engajamento" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Score de engajamento</CardTitle>
              <CardDescription>Kudos x3 + treinamentos x2 + respostas de clima</CardDescription>
            </CardHeader>
            <CardContent>
              {engaj.isLoading ? <Skeleton className="h-64" /> : <TrendChart data={engajSerie} xKey="mes" yKey="score" label="Score" color="hsl(var(--primary))" />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Absenteísmo por departamento</CardTitle>
              <CardDescription>Média do período — quanto maior, pior</CardDescription>
            </CardHeader>
            <CardContent>
              <HeatmapDepartamentos
                data={
                  Array.from(
                    filtro(absent.data).reduce((map, r) => {
                      const cur = map.get(r.departamento) ?? { soma: 0, n: 0 };
                      cur.soma += Number(r.taxa_absenteismo_pct || 0);
                      cur.n += 1;
                      map.set(r.departamento, cur);
                      return map;
                    }, new Map<string, { soma: number; n: number }>()),
                  ).map(([departamento, { soma, n }]) => ({
                    departamento,
                    valor: n > 0 ? soma / n : 0,
                  }))
                }
                metricLabel="Taxa média de absenteísmo (%)"
                format={(n) => pct(n)}
                invertScale
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Score de compliance por departamento</CardTitle>
              <CardDescription>Média entre políticas aceitas, treinamentos em dia e EPIs válidos</CardDescription>
            </CardHeader>
            <CardContent>
              <HeatmapDepartamentos
                data={filtro(compliance.data).map((r) => ({
                  departamento: r.departamento,
                  valor: Number(r.score_geral || 0),
                }))}
                metricLabel="Score (0-100)"
                format={(n) => pct(n)}
              />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento de compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <DrilldownTable
                rows={filtro(compliance.data)}
                columns={[
                  { key: "departamento", label: "Departamento" },
                  { key: "politicas_pct", label: "Políticas", align: "right", format: (v) => pct(v as number | null) },
                  { key: "treinamentos_pct", label: "Treinamentos", align: "right", format: (v) => pct(v as number | null) },
                  { key: "epis_pct", label: "EPIs", align: "right", format: (v) => pct(v as number | null) },
                  { key: "score_geral", label: "Score", align: "right", format: (v) => pct(v as number | null) },
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}
