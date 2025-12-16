import { Clock, Umbrella, TrendingUp, ChevronRight, FileText, Calendar, HelpCircle, Sparkles } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/portal/PageLayout';
import { StatCard } from '@/components/portal/StatCard';
import { AlertCard } from '@/components/portal/AlertCard';
import { DashboardSkeleton } from '@/components/portal/Skeletons';
import { useLoadingState } from '@/hooks/useLoadingState';
import { mockDashboardData } from '@/data/mockData';
import { SalaryEvolutionChart, HoursDistributionChart, GoalProgressChart } from '@/components/portal/DashboardCharts';

export default function Dashboard() {
  const navigate = useNavigate();
  const isLoading = useLoadingState(1000);
  const { colaborador, salarioEstimado, horasTrabalhadas, saldoFerias, comissaoMes, alertas, comunicados } = mockDashboardData;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  if (isLoading) {
    return (
      <PageLayout>
        <DashboardSkeleton />
      </PageLayout>
    );
  }

  return (
    <PageLayout alertCount={alertas.length}>
      <div className="space-y-6">
        {/* Saudação */}
        <div className="animate-fade-in-up">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-display font-bold text-foreground">
              Olá, {colaborador.nome.split(' ')[0]}!
            </h2>
            <span className="text-2xl animate-wiggle">👋</span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            {colaborador.cargo} • {colaborador.departamento}
          </p>
        </div>

        {/* Salário Estimado - Hero Card */}
        <Card className="relative overflow-hidden border-0 shadow-elevated animate-fade-in-up stagger-1">
          {/* Animated background */}
          <div className="absolute inset-0 gradient-primary opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-br from-card via-card/95 to-card/90" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-hr/10 rounded-full blur-2xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
          
          <div className="relative p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                SALÁRIO ESTIMADO
              </div>
              <span className="text-xs text-muted-foreground">Dez/2025</span>
            </div>
            
            <div className="text-center py-6">
              <p className="text-4xl md:text-5xl font-display font-bold text-foreground">
                {formatCurrency(salarioEstimado)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">líquido estimado</p>
            </div>
            
            <Button 
              variant="ghost" 
              className="w-full justify-center text-primary hover:bg-primary/5 group"
              onClick={() => navigate('/holerites')}
            >
              Ver detalhes 
              <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </Card>

        {/* Resumo do Mês */}
        <div className="animate-fade-in-up stagger-2">
          <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-primary" />
            Resumo do Mês
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={Clock}
              label="Ponto"
              value={horasTrabalhadas}
              subValue="trabalhadas"
              color="primary"
              onClick={() => navigate('/ponto')}
            />
            <StatCard
              icon={Umbrella}
              label="Férias"
              value={`${saldoFerias} dias`}
              subValue="saldo"
              color="projects"
              onClick={() => navigate('/ferias')}
            />
            <StatCard
              icon={TrendingUp}
              label="Variável"
              value={formatCurrency(comissaoMes)}
              subValue="comissão"
              color="finance"
              onClick={() => navigate('/variavel')}
            />
          </div>
        </div>

        {/* Performance Charts */}
        <div className="animate-fade-in-up stagger-3">
          <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-finance" />
            Performance
          </h3>
          <div className="space-y-3">
            <SalaryEvolutionChart />
            <div className="grid grid-cols-2 gap-3">
              <HoursDistributionChart />
              <GoalProgressChart />
            </div>
          </div>
        </div>

        {/* Alertas */}
        {alertas.length > 0 && (
        <div className="animate-fade-in-up stagger-5">
            <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-destructive animate-pulse" />
              Alertas ({alertas.length})
            </h3>
            <div className="space-y-3">
              {alertas.map((alerta, index) => (
                <AlertCard key={alerta.id} alerta={alerta} className={`stagger-${index + 1}`} />
              ))}
            </div>
          </div>
        )}

        {/* Comunicados */}
        <div className="animate-fade-in-up stagger-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-4 rounded-full bg-projects" />
              Comunicados
            </h3>
            <Button variant="link" className="text-xs p-0 h-auto group" asChild>
              <Link to="/comunicados" className="flex items-center gap-1">
                Ver todos
                <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
          <Card className="divide-y divide-border/50 border-0 shadow-card overflow-hidden">
            {comunicados.map((comunicado, index) => (
              <Link 
                key={comunicado.id} 
                to={`/comunicados/${comunicado.id}`}
                className={`block p-4 hover:bg-muted/50 transition-all duration-300 stagger-${index + 1}`}
              >
                <div className="flex items-start gap-3">
                  {comunicado.importante && !comunicado.lido && (
                    <span className="text-[10px] bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full font-semibold animate-pulse">
                      NOVO
                    </span>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-foreground">{comunicado.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{comunicado.resumo}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </div>
              </Link>
            ))}
          </Card>
        </div>

        {/* Ações Rápidas */}
        <div className="animate-fade-in-up stagger-6">
          <h3 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-finance" />
            Ações Rápidas
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-5 border-0 shadow-card hover-lift bg-card group"
              onClick={() => navigate('/holerites')}
            >
              <div className="w-12 h-12 rounded-2xl bg-hr/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-hr" />
              </div>
              <span className="text-xs font-medium">Holerite</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-5 border-0 shadow-card hover-lift bg-card group"
              onClick={() => navigate('/ferias')}
            >
              <div className="w-12 h-12 rounded-2xl bg-projects/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-6 h-6 text-projects" />
              </div>
              <span className="text-xs font-medium">Férias</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-5 border-0 shadow-card hover-lift bg-card group"
              onClick={() => navigate('/solicitacoes')}
            >
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
                <HelpCircle className="w-6 h-6 text-muted-foreground" />
              </div>
              <span className="text-xs font-medium">Ajuda</span>
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
