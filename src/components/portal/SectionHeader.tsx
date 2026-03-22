import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  icon?: React.ElementType;
  title: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  count?: number;
  accentColor?: string;
  className?: string;
}

export function SectionHeader({ 
  icon: Icon, 
  title, 
  action, 
  count, 
  accentColor = 'bg-primary',
  className 
}: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <span className={cn('w-1 h-4 rounded-full', accentColor)} />
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {title}
        {count !== undefined && count > 0 && (
          <span className="text-xs bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full font-medium">
            {count}
          </span>
        )}
      </h3>
      {action && (
        <Button 
          variant="link" 
          size="sm" 
          className="p-0 h-auto text-xs"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      )}
    </div>
  );
}
