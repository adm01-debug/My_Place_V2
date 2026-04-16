import { type LucideIcon, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon = Inbox, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center py-10 px-4 text-center">
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center">
          <Icon className="w-7 h-7 text-muted-foreground/50" />
        </div>
        <div className="absolute -inset-2 rounded-full bg-primary/5 animate-pulse -z-10" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="outline" size="sm" className="mt-3 text-xs" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
