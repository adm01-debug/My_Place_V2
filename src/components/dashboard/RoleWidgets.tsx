import { useNavigate } from 'react-router-dom';
import { Clock, Users, BarChart3, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SectionHeader } from '@/components/portal/SectionHeader';
import { StatCardWithTrend } from '@/components/portal/StatCardWithTrend';
import { formatCurrency } from '@/lib/utils';

interface GestorWidgetProps {
  treinamentosPendentes: number;
}

export function GestorDashboardWidget({ treinamentosPendentes }: GestorWidgetProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <SectionHeader
        icon={Users}
        title="Painel do Gestor"
        accentColor="bg-primary"
        action={{
          label: 'Dashboard completo',
          onClick: () => navigate('/gestor'),
        }}
      />
      <div className="grid grid-cols-3 gap-3">
        <Card 
          className="p-3 text-center cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/gestor')}
        >
          <Users className="w-5 h-5 mx-auto mb-1 text-primary" />
          <p className="text-lg font-bold text-foreground">—</p>
          <p className="text-xs text-muted-foreground">Equipe</p>
        </Card>
        <Card 
          className="p-3 text-center cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate('/metas')}
        >
          <Target className="w-5 h-5 mx-auto mb-1 text-projects" />
          <p className="text-lg font-bold text-foreground">—</p>
          <p className="text-xs text-muted-foreground">Metas</p>
        </Card>
        <Card 
          className="p-3 text-center cursor-pointer hover:shadow-md transition-shadow relative"
          onClick={() => navigate('/admin')}
        >
          <AlertTriangle className="w-5 h-5 mx-auto mb-1 text-destructive" />
          <p className="text-lg font-bold text-foreground">{treinamentosPendentes}</p>
          <p className="text-xs text-muted-foreground">Pendências</p>
          {treinamentosPendentes > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs">
              !
            </Badge>
          )}
        </Card>
      </div>
    </div>
  );
}

interface ComissaoWidgetProps {
  comissaoMes: number;
  bancoHoras: string;
}

export function ComissaoDestaque({ comissaoMes, bancoHoras }: ComissaoWidgetProps) {
  const navigate = useNavigate();

  return (
    <Card className="p-4 bg-gradient-to-r from-finance/5 to-transparent border-l-4 border-l-finance">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Comissão do Mês</p>
          <p className="text-2xl font-bold text-finance">{formatCurrency(comissaoMes)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Banco de Horas</p>
          <p className="text-lg font-bold text-foreground">{bancoHoras}</p>
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <Badge 
          variant="outline" 
          className="cursor-pointer hover:bg-finance/10"
          onClick={() => navigate('/variavel')}
        >
          <TrendingUp className="w-3 h-3 mr-1" /> Ver detalhes
        </Badge>
        <Badge 
          variant="outline" 
          className="cursor-pointer hover:bg-primary/10"
          onClick={() => navigate('/ponto')}
        >
          <Clock className="w-3 h-3 mr-1" /> Ver ponto
        </Badge>
      </div>
    </Card>
  );
}

interface BancoHorasWidgetProps {
  bancoHoras: string;
  horasTrabalhadas: string;
}

export function BancoHorasDestaque({ bancoHoras, horasTrabalhadas }: BancoHorasWidgetProps) {
  const navigate = useNavigate();
  
  // Parse hours for progress
  const parseHours = (str: string): number => {
    const clean = str.replace(/[+-]/g, '');
    const [h, m] = clean.split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  };
  
  const horasMin = parseHours(horasTrabalhadas);
  const targetMes = 176 * 60; // 176h mensais em minutos
  const progress = Math.min(100, (horasMin / targetMes) * 100);

  return (
    <Card 
      className="p-4 cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate('/ponto')}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          <span className="text-sm font-medium">Jornada do Mês</span>
        </div>
        <span className={`text-sm font-bold ${bancoHoras.startsWith('-') ? 'text-destructive' : 'text-finance'}`}>
          BH: {bancoHoras}
        </span>
      </div>
      <Progress value={progress} className="h-2 mb-1" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{horasTrabalhadas} trabalhadas</span>
        <span>Meta: 176h</span>
      </div>
    </Card>
  );
}