import { Clock, AlertTriangle, CheckCircle, TrendingUp, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { isSameDay, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig = {
  ok: { icon: CheckCircle, color: 'text-finance', bg: 'bg-finance-light', label: 'OK' },
  atraso: { icon: AlertTriangle, color: 'text-projects', bg: 'bg-projects-light', label: 'Atraso' },
  extra: { icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10', label: 'Extra' },
  falta: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Falta' },
  pendente: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Pendente' },
  justificado: { icon: FileText, color: 'text-primary', bg: 'bg-primary/10', label: 'Justificado' },
};

export interface EspelhoDia {
  data: Date;
  dateKey: string;
  status: keyof typeof statusConfig;
  totalHoras: string;
  batidas: { horario: string; tipo: string }[];
  isWeekend: boolean;
  justificativa: any;
}

interface EspelhoDiaCardProps {
  dia: EspelhoDia;
  onJustificar: (date: Date) => void;
}

export const EspelhoDiaCard = ({ dia, onJustificar }: EspelhoDiaCardProps) => {
  const config = statusConfig[dia.status];
  const Icon = config.icon;
  const isToday = isSameDay(dia.data, new Date());
  const diaSemana = format(dia.data, 'EEE', { locale: ptBR }).toUpperCase();

  return (
    <Card
      className={`p-3 ${isToday ? 'ring-2 ring-primary' : ''} ${dia.isWeekend ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bg}`}>
            <Icon className={`w-4 h-4 ${config.color}`} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-medium text-foreground text-sm">
                {format(dia.data, 'dd/MM')} ({diaSemana})
              </p>
              {isToday && <Badge variant="outline" className="text-xs">HOJE</Badge>}
              {dia.isWeekend && <Badge variant="secondary" className="text-xs">FDS</Badge>}
              {dia.justificativa && (
                <Badge
                  variant={dia.justificativa.status === 'aprovado' ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {dia.justificativa.status === 'pendente' ? 'Aguardando' :
                   dia.justificativa.status === 'aprovado' ? 'Aprovado' : 'Rejeitado'}
                </Badge>
              )}
            </div>
            {dia.batidas.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {dia.batidas.map(b => {
                  const icon = b.tipo === 'entrada' ? '→' : b.tipo === 'saida' ? '←' : b.tipo === 'intervalo_inicio' ? '☕' : '▶';
                  return `${icon}${b.horario}`;
                }).join(' | ')}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className={`text-sm font-medium ${config.color}`}>
            {dia.totalHoras !== '0:00' ? dia.totalHoras : '-'}
          </p>
        </div>
      </div>
      {dia.status === 'falta' && (
        <Button
          size="sm"
          variant="outline"
          className="w-full mt-2 text-xs"
          onClick={() => onJustificar(dia.data)}
        >
          <FileText className="w-3 h-3 mr-1" /> Justificar
        </Button>
      )}
    </Card>
  );
};
