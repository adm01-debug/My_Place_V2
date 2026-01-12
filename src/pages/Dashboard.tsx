import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, Clock, Umbrella, TrendingUp, Bell, 
  FileText, CreditCard, AlertTriangle, Info, CheckCircle,
  ChevronRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageLayout } from '@/components/portal/PageLayout';
import { StatCardSkeleton, ListItemSkeleton } from '@/components/portal/Skeletons';
import { AniversariantesCard } from '@/components/portal/AniversariantesCard';
import { KudosWidget } from '@/components/portal/KudosWidget';
import { TrilhasWidget } from '@/components/portal/TrilhasWidget';
import { useDashboard } from '@/hooks/useDashboard';
import { useNotificacoes } from '@/hooks/useNotificacoes';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

const alertaIcons: Record<string, any> = {
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
  alert: AlertTriangle,
};

const alertaColors: Record<string, string> = {
  warning: 'text-projects bg-projects/10',
  info: 'text-primary bg-primary/10',
  success: 'text-finance bg-finance/10',
  alert: 'text-destructive bg-destructive/10',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { 
    colaborador, 
    salarioEstimado, 
    horasTrabalhadas, 
    horasHoje,
    saldoFerias, 
    comissaoMes, 
    emprestimoAtivo,
    alertas, 
    comunicados,
    notificacoesNaoLidas,
    solicitacoesPendentes,
    isLoading,
    refetch
  } = useDashboard();

  const { unreadCount } = useNotificacoes();

  if (isLoading) {
    return (
      <PageLayout title="Dashboard">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <ListItemSkeleton />
          <ListItemSkeleton />
        </div>
      </PageLayout>
    );
  }

  const initials = colaborador?.nome
    ?.split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  return (
    <PageLayout title="Dashboard" onRefresh={refetch}>
      <div className="space-y-6 animate-fade-in-up">
        {/* Header com Avatar */}
        <div className="flex items-center gap-4">
          <Avatar className="w-14 h-14 border-2 border-card shadow">
            <AvatarImage src={colaborador?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-foreground">
              Olá, {colaborador?.nome?.split(' ')[0] || 'Colaborador'}!
            </h2>
            <p className="text-sm text-muted-foreground">
              {colaborador?.cargo || 'Bem-vindo ao portal'}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button 
              variant="outline" 
              size="icon"
              className="relative"
              onClick={() => navigate('/menu')}
            >
              <Bell className="w-5 h-5" />
              <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
                {unreadCount}
              </Badge>
            </Button>
          )}
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-2 gap-4">
          <Card 
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/holerites')}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-finance/10 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-finance" />
              </div>
              <span className="text-xs text-muted-foreground">Salário Est.</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(salarioEstimado)}
            </p>
          </Card>

          <Card 
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/ponto')}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Horas Mês</span>
            </div>
            <p className="text-lg font-bold text-foreground">{horasTrabalhadas}</p>
            <p className="text-xs text-muted-foreground">Hoje: {horasHoje}</p>
          </Card>

          <Card 
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/ferias')}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-projects/10 flex items-center justify-center">
                <Umbrella className="w-4 h-4 text-projects" />
              </div>
              <span className="text-xs text-muted-foreground">Férias</span>
            </div>
            <p className="text-lg font-bold text-foreground">{saldoFerias} dias</p>
          </Card>

          <Card 
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/variavel')}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-finance/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-finance" />
              </div>
              <span className="text-xs text-muted-foreground">Comissão</span>
            </div>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(comissaoMes)}
            </p>
          </Card>
        </div>

        {/* Empréstimo Ativo */}
        {emprestimoAtivo && (
          <Card 
            className="p-4 cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate('/emprestimos')}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <span className="font-medium">Empréstimo Ativo</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Saldo devedor:</span>
                <span className="font-medium">{formatCurrency(emprestimoAtivo.saldo_devedor)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Próxima parcela:</span>
                <span className="font-medium">{formatCurrency(emprestimoAtivo.proxima_parcela)}</span>
              </div>
              <Progress 
                value={((12 - emprestimoAtivo.parcelas_restantes) / 12) * 100} 
                className="h-2"
              />
              <p className="text-xs text-muted-foreground text-center">
                {emprestimoAtivo.parcelas_restantes} parcelas restantes
              </p>
            </div>
          </Card>
        )}

        {/* Alertas */}
        {alertas.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">
              ⚠️ Alertas
            </h3>
            {alertas.map((alerta) => {
              const Icon = alertaIcons[alerta.tipo] || Info;
              const colorClass = alertaColors[alerta.tipo] || alertaColors.info;
              
              return (
                <Card 
                  key={alerta.id} 
                  className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => alerta.acao && navigate(alerta.acao.link)}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colorClass}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{alerta.titulo}</p>
                      <p className="text-xs text-muted-foreground">{alerta.descricao}</p>
                    </div>
                    {alerta.acao && (
                      <Button variant="ghost" size="sm">
                        {alerta.acao.label}
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Comunicados Recentes */}
        {comunicados.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                📢 Comunicados
              </h3>
              <Button 
                variant="link" 
                size="sm" 
                className="p-0 h-auto"
                onClick={() => navigate('/comunicados')}
              >
                Ver todos
              </Button>
            </div>
            {comunicados.map((com) => (
              <Card 
                key={com.id} 
                className={`p-3 cursor-pointer hover:shadow-md transition-shadow ${
                  !com.lido ? 'border-l-4 border-l-primary' : ''
                }`}
                onClick={() => navigate('/comunicados')}
              >
                <div className="flex items-start gap-2">
                  {com.importante && !com.lido && (
                    <Badge variant="destructive" className="text-xs">NOVO</Badge>
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{com.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(com.data_publicacao), 'dd/MM')} | {com.categoria}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Aniversariantes do Mês */}
        <AniversariantesCard />
        
        {/* Widgets de Gamificação */}
        <div className="grid gap-4 md:grid-cols-2">
          <KudosWidget />
          <TrilhasWidget />
        </div>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-3 gap-3">
          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col gap-1"
            onClick={() => navigate('/holerites')}
          >
            <FileText className="w-5 h-5" />
            <span className="text-xs">Holerite</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col gap-1"
            onClick={() => navigate('/ferias')}
          >
            <Umbrella className="w-5 h-5" />
            <span className="text-xs">Férias</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto py-4 flex flex-col gap-1 relative"
            onClick={() => navigate('/solicitacoes')}
          >
            <Bell className="w-5 h-5" />
            <span className="text-xs">Ajuda</span>
            {solicitacoesPendentes > 0 && (
              <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
                {solicitacoesPendentes}
              </Badge>
            )}
          </Button>
        </div>
      </div>
    </PageLayout>
  );
}
