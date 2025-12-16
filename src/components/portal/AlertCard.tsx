import { AlertTriangle, Info, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
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
  warning: {
    card: 'bg-gradient-to-r from-projects/10 via-card to-card border-l-4 border-l-projects',
    icon: 'bg-projects/20 text-projects',
  },
  info: {
    card: 'bg-gradient-to-r from-primary/10 via-card to-card border-l-4 border-l-primary',
    icon: 'bg-primary/20 text-primary',
  },
  success: {
    card: 'bg-gradient-to-r from-finance/10 via-card to-card border-l-4 border-l-finance',
    icon: 'bg-finance/20 text-finance',
  },
  error: {
    card: 'bg-gradient-to-r from-destructive/10 via-card to-card border-l-4 border-l-destructive',
    icon: 'bg-destructive/20 text-destructive',
  },
};

interface AlertCardProps {
  alerta: Alerta;
  className?: string;
}

export function AlertCard({ alerta, className }: AlertCardProps) {
  const Icon = iconMap[alerta.tipo];
  const style = styleMap[alerta.tipo];
  
  return (
    <Card className={cn(
      'p-4 rounded-r-xl rounded-l-none border-0 shadow-card transition-all duration-300 hover-lift',
      style.card,
      className
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
          style.icon
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm">{alerta.titulo}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{alerta.descricao}</p>
          {alerta.acao && (
            <Button 
              variant="link" 
              className="p-0 h-auto text-xs mt-2 group"
              asChild
            >
              <Link to={alerta.acao.link} className="flex items-center gap-1">
                {alerta.acao.label}
                <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
