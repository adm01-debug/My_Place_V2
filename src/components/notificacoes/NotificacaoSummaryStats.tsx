import { memo } from 'react';
import { AlertCircle, Bell, CheckCircle2, Flame, Info, Pin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { NotificacaoStats } from '@/hooks/useNotificacaoStats';

interface Props {
  stats: NotificacaoStats;
  densidade?: 'compact' | 'comfortable';
  className?: string;
}

interface StatItem {
  key: string;
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  hint: string;
}

function NotificacaoSummaryStatsImpl({ stats, densidade = 'comfortable', className }: Props) {
  if (stats.total === 0) return null;

  const items: StatItem[] = [
    {
      key: 'nao-lidas',
      label: 'Não lidas',
      value: stats.naoLidas,
      icon: Bell,
      tone: 'text-primary',
      hint: `${stats.naoLidas} de ${stats.total} notificações ainda não foram lidas`,
    },
    {
      key: 'prioritarias',
      label: 'Prioritárias',
      value: stats.prioritarias,
      icon: Flame,
      tone: 'text-destructive',
      hint: `${stats.prioritarias} notificações classificadas como alta prioridade`,
    },
    {
      key: 'erros',
      label: 'Erros',
      value: stats.porTipoNaoLidas.erro,
      icon: AlertCircle,
      tone: 'text-destructive',
      hint: `${stats.porTipoNaoLidas.erro} erros não lidos`,
    },
    {
      key: 'alertas',
      label: 'Alertas',
      value: stats.porTipoNaoLidas.alerta,
      icon: AlertCircle,
      tone: 'text-amber-500',
      hint: `${stats.porTipoNaoLidas.alerta} alertas não lidos`,
    },
    {
      key: 'sucesso',
      label: 'Sucesso',
      value: stats.porTipoNaoLidas.sucesso,
      icon: CheckCircle2,
      tone: 'text-emerald-500',
      hint: `${stats.porTipoNaoLidas.sucesso} confirmações não lidas`,
    },
    {
      key: 'info',
      label: 'Info',
      value: stats.porTipoNaoLidas.info,
      icon: Info,
      tone: 'text-blue-500',
      hint: `${stats.porTipoNaoLidas.info} informativos não lidos`,
    },
    {
      key: 'fixadas',
      label: 'Fixadas',
      value: stats.fixadas,
      icon: Pin,
      tone: 'text-amber-500',
      hint: `${stats.fixadas} notificações fixadas no topo`,
    },
  ];

  const compact = densidade === 'compact';

  return (
    <div
      role="group"
      aria-label="Resumo de notificações"
      className={cn(
        'grid gap-2',
        compact
          ? 'grid-cols-3 sm:grid-cols-4 md:grid-cols-7'
          : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7',
        className,
      )}
    >
      {items.map(({ key, label, value, icon: Icon, tone, hint }) => (
        <Card
          key={key}
          className={cn(
            'border-border/50 transition-all hover:border-primary/40 hover:shadow-sm',
            value === 0 && 'opacity-60',
          )}
          aria-label={hint}
          title={hint}
        >
          <CardContent className={cn('flex items-center gap-2', compact ? 'p-2' : 'p-3')}>
            <Icon className={cn(compact ? 'w-4 h-4' : 'w-5 h-5', tone)} aria-hidden="true" />
            <div className="min-w-0">
              <div className={cn('font-semibold leading-none', compact ? 'text-sm' : 'text-lg')}>
                {value}
              </div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">
                {label}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export const NotificacaoSummaryStats = memo(NotificacaoSummaryStatsImpl);
