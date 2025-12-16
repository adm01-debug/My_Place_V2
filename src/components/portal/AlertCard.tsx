import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Alerta } from '@/types/portal';

const iconMap = {
  warning: AlertTriangle,
  info: Info,
  success: CheckCircle,
  error: XCircle,
};

const styleMap = {
  warning: 'bg-projects-light border-l-4 border-l-projects',
  info: 'bg-primary/5 border-l-4 border-l-primary',
  success: 'bg-finance-light border-l-4 border-l-finance',
  error: 'bg-destructive/10 border-l-4 border-l-destructive',
};

const iconStyleMap = {
  warning: 'text-projects',
  info: 'text-primary',
  success: 'text-finance',
  error: 'text-destructive',
};

interface AlertCardProps {
  alerta: Alerta;
}

export function AlertCard({ alerta }: AlertCardProps) {
  const Icon = iconMap[alerta.tipo];
  
  return (
    <Card className={cn('p-4 rounded-r-xl rounded-l-none', styleMap[alerta.tipo])}>
      <div className="flex items-start gap-3">
        <Icon className={cn('w-5 h-5 mt-0.5 flex-shrink-0', iconStyleMap[alerta.tipo])} />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-sm">{alerta.titulo}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{alerta.descricao}</p>
          {alerta.acao && (
            <Button variant="link" className="p-0 h-auto text-xs mt-1" asChild>
              <Link to={alerta.acao.link}>{alerta.acao.label}</Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
