import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Users, 
  Clock, 
  Palmtree, 
  FileText, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  History,
  Activity,
  Zap
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const [
        { count: totalUsers },
        { count: pendingFerias },
        { count: pendingSolicitacoes },
        { data: rolesData },
        { data: todayPunches },
        { data: recentActivity }
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("solicitacoes_ferias").select("*", { count: "exact", head: true }).eq("status", "pendente"),
        supabase.from("solicitacoes").select("*", { count: "exact", head: true }).eq("status", "pendente"),
        supabase.from("user_roles").select("role"),
        supabase.from("registros_ponto").select("id").gte("data_hora", today),
        supabase.from("registros_ponto")
          .select("id, tipo, data_hora, profiles(full_name)")
          .order("data_hora", { ascending: false })
          .limit(5)
      ]);

      // Process roles for pie chart
      const roleCounts = (rolesData || []).reduce((acc: any, curr: any) => {
        acc[curr.role] = (acc[curr.role] || 0) + 1;
        return acc;
      }, {});

      const roleChartData = Object.entries(roleCounts).map(([name, value]) => ({ name, value }));

      return {
        totalUsers: totalUsers || 0,
        pendingFerias: pendingFerias || 0,
        pendingSolicitacoes: pendingSolicitacoes || 0,
        todayPunches: todayPunches?.length || 0,
        roleChartData,
        recentActivity: (recentActivity || []).map((a: any) => ({
          id: a.id,
          user: a.profiles?.full_name || "Sistema",
          type: a.tipo,
          time: a.data_hora
        }))
      };
    }
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">Visão geral da organização e pendências operacionais.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Colaboradores" 
          value={stats?.totalUsers} 
          icon={Users} 
          description="Contas ativas no sistema" 
          loading={isLoading}
        />
        <StatCard 
          title="Férias Pendentes" 
          value={stats?.pendingFerias} 
          icon={Palmtree} 
          description="Aguardando aprovação" 
          color="text-amber-500"
          loading={isLoading}
        />
        <StatCard 
          title="Solicitações RH" 
          value={stats?.pendingSolicitacoes} 
          icon={FileText} 
          description="Pedidos em aberto" 
          color="text-purple-500"
          loading={isLoading}
        />
        <StatCard 
          title="Pontos Hoje" 
          value={stats?.todayPunches} 
          icon={Clock} 
          description="Registros realizados" 
          color="text-emerald-500"
          loading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Distribuição de Perfis</CardTitle>
            <CardDescription>Quantidade de usuários por nível de acesso.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.roleChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {stats?.roleChartData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Atividade Recente</CardTitle>
            <CardDescription>Resumo volumétrico de ações no sistema.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center h-[300px] space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Engajamento de Ponto</span>
                <span className="font-medium">{stats ? Math.round((stats.todayPunches / stats.totalUsers) * 100) : 0}%</span>
              </div>
              <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000" 
                  style={{ width: `${stats ? Math.min(100, (stats.todayPunches / (stats.totalUsers || 1)) * 100) : 0}%` }}
                />
      </div>

      <Card className="border-border/50 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle className="text-xl flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Linha do Tempo de Atividades
            </CardTitle>
            <CardDescription>Eventos em tempo real processados pelo sistema.</CardDescription>
          </div>
          <Badge variant="outline" className="flex items-center gap-1.5 py-1 px-3 bg-primary/5 border-primary/20">
            <Zap className="h-3.5 w-3.5 text-primary fill-primary/20" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Live Monitor</span>
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="relative space-y-4 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border/50 before:via-border/50 before:to-transparent">
            {isLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="relative flex items-center gap-4 pl-2">
                   <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                   <div className="space-y-1 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                   </div>
                </div>
              ))
            ) : stats?.recentActivity.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground text-sm">Nenhuma atividade recente.</p>
            ) : (
              stats?.recentActivity.map((activity: any) => (
                <div key={activity.id} className="relative flex items-center gap-4 pl-2 group">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background border border-border shadow-sm z-10 transition-colors group-hover:border-primary/50">
                    <History className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold truncate text-foreground">
                        {activity.user}
                      </p>
                      <time className="text-[10px] text-muted-foreground whitespace-nowrap bg-muted px-2 py-0.5 rounded-full">
                        {format(new Date(activity.time), "HH:mm:ss", { locale: ptBR })}
                      </time>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Realizou registro de <span className="font-medium text-primary uppercase">{activity.type.replace('_', ' ')}</span>
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
              <div className="p-4 rounded-xl bg-accent/30 border border-border/50">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Integridade Fiscal</p>
                <div className="flex items-center gap-2 mt-1">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="text-lg font-bold">100% Auditado</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, description, color = "text-primary", loading }: any) {
  return (
    <Card className="border-border/50 shadow-sm hover:shadow-md transition-all">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-2xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
