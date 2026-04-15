import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  DollarSign, Clock, Umbrella, TrendingUp, Bell, 
  FileText, CreditCard, AlertTriangle, Info, CheckCircle,
  ChevronRight, Megaphone
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
import { SmartGreeting } from '@/components/portal/SmartGreeting';
import { StatCardWithTrend } from '@/components/portal/StatCardWithTrend';
import { SectionHeader } from '@/components/portal/SectionHeader';
import { useDashboard } from '@/hooks/useDashboard';
import { useNotificacoes } from '@/hooks/useNotificacoes';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

const alertaIcons: Record<string, React.ElementType> = {
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
    bancoHoras,
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
  const { isSubscribed, permission, subscribe } = usePushNotifications();

  // Auto-prompt push notifications on first visit
  useEffect(() => {
    const prompted = localStorage.getItem('push_prompted');
    if (!prompted && !isSubscribed && permission === 'default') {
      const timer = setTimeout(() => {
        subscribe();
        localStorage.setItem('push_prompted', 'true');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSubscribed, permission, subscribe]);

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
      <div className="space-y-6 animate-fade-in-up motion-reduce:animate-none">
        {/* Header com Avatar */}
        <div className="flex items-center gap-4">
          <Avatar className="w-14 h-14 border-2 border-card shadow">
            <AvatarImage src={colaborador?.avatar_url || undefined} alt={`Avatar de ${colaborador?.nome || 'usuário'}`} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <SmartGreeting name={colaborador?.nome?.split(' ')[0]} />
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
              aria-label={`${unreadCount} notificações não lidas`}
            >
              <Bell className="w-5 h-5" />
              <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
                {unreadCount}
              </Badge>
            </Button>
          )}
        </div>

        {/* Cards de Estatísticas com Tendências */}
        <div className="grid grid-cols-2 gap-4">
          <StatCardWithTrend
            icon={DollarSign}
            iconColor="text-finance"
            iconBg="bg-finance/10"
            label="Salário Est."
            value={formatCurrency(salarioEstimado)}
            onClick={() => navigate('/holerites')}
          />
          <StatCardWithTrend
            icon={Clock}
            iconColor="text-primary"
            iconBg="bg-primary/10"
            label="Horas Mês"
            value={horasTrabalhadas}
            subtitle={`Hoje: ${horasHoje} | BH: ${bancoHoras}`}
            onClick={() => navigate('/ponto')}
          />
          <StatCardWithTrend
            icon={Umbrella}
            iconColor="text-projects"
            iconBg="bg-projects/10"
            label="Férias"
            value={`${saldoFerias} dias`}
            onClick={() => navigate('/ferias')}
          />
          <StatCardWithTrend
            icon={TrendingUp}
            iconColor="text-finance"
            iconBg="bg-finance/10"
            label="Comissão"
            value={formatCurrency(comissaoMes)}
            onClick={() => navigate('/variavel')}
          />
        </div>

        {/* Empréstimo Ativo */}
        {emprestimoAtivo && (
          <Card 
            className="p-4 cursor-pointer hover:shadow-elevated transition-all duration-200 hover:-translate-y-0.5 motion-reduce:hover:translate-y-0"
            onClick={() => navigate('/emprestimos')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') navigate('/emprestimos'); }}
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
                value={emprestimoAtivo.quantidade_parcelas 
                  ? ((emprestimoAtivo.quantidade_parcelas - emprestimoAtivo.parcelas_restantes) / emprestimoAtivo.quantidade_parcelas) * 100 
                  : 0} 
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
          <div className="space-y-3">
            <SectionHeader
              icon={AlertTriangle}
              title="Alertas"
              count={alertas.length}
              accentColor="bg-destructive"
            />
            {alertas.map((alerta) => {
              const Icon = alertaIcons[alerta.tipo] || Info;
              const colorClass = alertaColors[alerta.tipo] || alertaColors.info;
              
              return (
                <Card 
                  key={alerta.id} 
                  className="p-3 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => alerta.acao && navigate(alerta.acao.link)}
                  role={alerta.acao ? 'button' : undefined}
                  tabIndex={alerta.acao ? 0 : undefined}
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
          <div className="space-y-3">
            <SectionHeader
              icon={Megaphone}
              title="Comunicados"
              action={{
                label: 'Ver todos',
                onClick: () => navigate('/comunicados'),
              }}
            />
            {comunicados.map((com) => (
              <Card 
                key={com.id} 
                className={`p-3 cursor-pointer hover:shadow-md transition-shadow ${
                  !com.lido ? 'border-l-4 border-l-primary' : ''
                }`}
                onClick={() => navigate('/comunicados')}
                role="button"
                tabIndex={0}
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
        <div className="space-y-3">
          <SectionHeader title="Ações Rápidas" />
          <div className="grid grid-cols-3 gap-3">
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col gap-1"
              onClick={() => navigate('/holerites')}
              aria-label="Ver holerites"
            >
              <FileText className="w-5 h-5" />
              <span className="text-xs">Holerite</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col gap-1"
              onClick={() => navigate('/ferias')}
              aria-label="Ver férias"
            >
              <Umbrella className="w-5 h-5" />
              <span className="text-xs">Férias</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-auto py-4 flex flex-col gap-1 relative"
              onClick={() => navigate('/solicitacoes')}
              aria-label={`Solicitações${solicitacoesPendentes > 0 ? `, ${solicitacoesPendentes} pendentes` : ''}`}
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
      </div>
    </PageLayout>
  );
}
