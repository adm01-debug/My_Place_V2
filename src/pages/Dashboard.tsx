import { Clock, Umbrella, TrendingUp, ChevronRight, FileText, Calendar, HelpCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/portal/PageLayout';
import { StatCard } from '@/components/portal/StatCard';
import { AlertCard } from '@/components/portal/AlertCard';
import { mockDashboardData } from '@/data/mockData';

export default function Dashboard() {
  const navigate = useNavigate();
  const { colaborador, salarioEstimado, horasTrabalhadas, saldoFerias, comissaoMes, alertas, comunicados } = mockDashboardData;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <PageLayout alertCount={alertas.length}>
      <div className="space-y-6 animate-fade-in-up">
        {/* Saudação */}
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">
            Olá, {colaborador.nome.split(' ')[0]}! 👋
          </h2>
          <p className="text-muted-foreground text-sm">
            {colaborador.cargo} | {colaborador.departamento}
          </p>
        </div>

        {/* Salário Estimado */}
        <Card className="p-5 bg-gradient-to-br from-primary/10 via-card to-card border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-muted-foreground">💰 SALÁRIO ESTIMADO (Dez/2025)</p>
          </div>
          <div className="text-center py-4">
            <p className="text-3xl font-display font-bold text-foreground">
              {formatCurrency(salarioEstimado)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">(líquido estimado)</p>
          </div>
          <Button 
            variant="ghost" 
            className="w-full justify-center text-primary"
            onClick={() => navigate('/holerites')}
          >
            Ver detalhes <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Card>

        {/* Resumo do Mês */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            📊 Resumo do Mês
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

        {/* Alertas */}
        {alertas.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              🔔 Alertas ({alertas.length})
            </h3>
            <div className="space-y-3">
              {alertas.map((alerta) => (
                <AlertCard key={alerta.id} alerta={alerta} />
              ))}
            </div>
          </div>
        )}

        {/* Comunicados */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              📢 Comunicados
            </h3>
            <Button variant="link" className="text-xs p-0 h-auto" asChild>
              <Link to="/comunicados">Ver todos</Link>
            </Button>
          </div>
          <Card className="divide-y divide-border">
            {comunicados.map((comunicado) => (
              <Link 
                key={comunicado.id} 
                to={`/comunicados/${comunicado.id}`}
                className="block p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start gap-2">
                  {comunicado.importante && !comunicado.lido && (
                    <span className="text-xs bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded font-medium">
                      NOVO
                    </span>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">{comunicado.titulo}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{comunicado.resumo}</p>
                  </div>
                </div>
              </Link>
            ))}
          </Card>
        </div>

        {/* Ações Rápidas */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            🚀 Ações Rápidas
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => navigate('/holerites')}
            >
              <FileText className="w-6 h-6 text-primary" />
              <span className="text-xs">Holerite</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => navigate('/ferias')}
            >
              <Calendar className="w-6 h-6 text-projects" />
              <span className="text-xs">Férias</span>
            </Button>
            <Button 
              variant="outline" 
              className="flex flex-col items-center gap-2 h-auto py-4"
              onClick={() => navigate('/ajuda')}
            >
              <HelpCircle className="w-6 h-6 text-muted-foreground" />
              <span className="text-xs">Ajuda</span>
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
