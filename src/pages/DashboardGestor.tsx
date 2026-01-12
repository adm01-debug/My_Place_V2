import type { CSSProperties } from 'react';
import { Users, GraduationCap, Calendar, Clock, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageLayout } from '@/components/portal/PageLayout';
import { StatCardSkeleton, ListItemSkeleton } from '@/components/portal/Skeletons';
import { useDashboardGestor } from '@/hooks/useDashboardGestor';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const CORES = [
  'hsl(var(--primary))',
  'hsl(var(--finance))',
  'hsl(var(--projects))',
  'hsl(var(--hr))',
  'hsl(var(--chart-5))',
];

export default function DashboardGestor() {
  const { data, isLoading, error, refetch } = useDashboardGestor();

  if (isLoading) {
    return (
      <PageLayout title="Dashboard Gestão" showBack>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => <StatCardSkeleton key={i} />)}
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => <ListItemSkeleton key={i} />)}
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout title="Dashboard Gestão" showBack>
        <Card className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-2">Acesso Restrito</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
        </Card>
      </PageLayout>
    );
  }

  if (!data) return null;

  const { resumo, feriasProgramadas, graficos } = data;

  return (
    <PageLayout title="Dashboard Gestão" showBack onRefresh={refetch}>
      <div className="space-y-6 animate-fade-in-up">
        {/* Métricas Principais */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{resumo.totalColaboradores}</p>
                <p className="text-xs text-muted-foreground">Colaboradores</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-finance/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-finance" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{resumo.mediaAssiduidade}%</p>
                <p className="text-xs text-muted-foreground">Assiduidade</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-projects/10 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-projects" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{resumo.treinamentosPendentes}</p>
                <p className="text-xs text-muted-foreground">Trein. Pendentes</p>
              </div>
            </div>
            {resumo.treinamentosObrigatorios > 0 && (
              <Badge variant="destructive" className="mt-2 text-[10px]">
                {resumo.treinamentosObrigatorios} obrigatórios
              </Badge>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-hr/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-hr" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{resumo.emFeriasAgora}</p>
                <p className="text-xs text-muted-foreground">Em Férias Hoje</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Alertas */}
        {(resumo.justificativasPendentes > 0 || resumo.solicitacoesPendentes > 0) && (
          <Card className="p-4 border-l-4 border-l-primary">
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pendências
            </h3>
            <div className="flex gap-4">
              {resumo.justificativasPendentes > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{resumo.justificativasPendentes}</Badge>
                  <span className="text-sm text-muted-foreground">Justificativas</span>
                </div>
              )}
              {resumo.solicitacoesPendentes > 0 && (
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{resumo.solicitacoesPendentes}</Badge>
                  <span className="text-sm text-muted-foreground">Solicitações</span>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Gráfico de Assiduidade por Dia */}
        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-4">📊 Registros de Ponto por Dia</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={graficos.pontosPorDia}>
                <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar 
                  dataKey="entradas" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                  name="Entradas"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Status dos Treinamentos */}
        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-4">📚 Status dos Treinamentos</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={graficos.statusTreinamentos}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="valor"
                  nameKey="nome"
                >
                  {graficos.statusTreinamentos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CORES[index % CORES.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px' }}
                  formatter={(value) => <span className="text-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Distribuição por Departamento */}
        {graficos.departamentos.length > 0 && (
          <Card className="p-4">
            <h3 className="font-semibold text-sm mb-4">🏢 Colaboradores por Departamento</h3>
            <div className="space-y-3">
              {graficos.departamentos.map((depto, index) => (
                <div key={depto.nome}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-foreground">{depto.nome}</span>
                    <span className="text-muted-foreground">{depto.valor}</span>
                  </div>
                  <Progress 
                    value={(depto.valor / resumo.totalColaboradores) * 100} 
                    className="h-2"
                    style={{
                      ['--progress-foreground' as string]: CORES[index % CORES.length],
                    } as CSSProperties}
                  />
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Férias Programadas */}
        <Card className="p-4">
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Próximas Férias
          </h3>
          {feriasProgramadas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma férias programada
            </p>
          ) : (
            <div className="space-y-3">
              {feriasProgramadas.map((ferias) => {
                const inicio = new Date(ferias.dataInicio);
                const fim = new Date(ferias.dataFim);
                const hoje = new Date();
                const emAndamento = hoje >= inicio && hoje <= fim;

                return (
                  <div 
                    key={ferias.id} 
                    className={`p-3 rounded-lg border ${emAndamento ? 'bg-hr/5 border-hr/20' : 'bg-muted/30'}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm text-foreground">{ferias.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(inicio, "dd/MM", { locale: ptBR })} - {format(fim, "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={emAndamento ? "default" : "secondary"}>
                          {emAndamento ? 'Em férias' : `${ferias.dias} dias`}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </PageLayout>
  );
}
