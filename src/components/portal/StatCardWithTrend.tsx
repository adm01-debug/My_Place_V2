import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardWithTrendProps {
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  label: string;
  value: string;
  subtitle?: string;
  trend?: {
    value: number;
    label?: string;
  };
  onClick?: () => void;
}

export function StatCardWithTrend({
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/10',
  label,
  value,
  subtitle,
  trend,
  onClick,
}: StatCardWithTrendProps) {
  const TrendIcon = trend
    ? trend.value > 0 ? TrendingUp : trend.value < 0 ? TrendingDown : Minus
    : null;

  const trendColor = trend
    ? trend.value > 0 ? 'text-finance' : trend.value < 0 ? 'text-destructive' : 'text-muted-foreground'
    : '';

  return (
    <Card
      className={cn(
        'p-4 transition-all duration-200',
        onClick && 'cursor-pointer hover:shadow-elevated hover:-translate-y-0.5 motion-reduce:hover:translate-y-0'
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-4 h-4', iconColor)} />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-lg font-bold text-foreground">{value}</p>
      <div className="flex items-center justify-between mt-1">
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
        {trend && TrendIcon && (
          <div className={cn('flex items-center gap-0.5 text-xs font-medium', trendColor)}>
            <TrendIcon className="w-3 h-3" />
            <span>{trend.value > 0 ? '+' : ''}{trend.value}%</span>
          </div>
        )}
      </div>
    </Card>
  );
}
