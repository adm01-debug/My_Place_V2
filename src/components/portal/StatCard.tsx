import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  subValue?: string;
  color?: 'primary' | 'hr' | 'finance' | 'projects' | 'warning';
  onClick?: () => void;
}

const colorMap = {
  primary: 'bg-primary/10 text-primary',
  hr: 'bg-hr-light text-hr',
  finance: 'bg-finance-light text-finance',
  projects: 'bg-projects-light text-projects',
  warning: 'bg-projects-light text-projects',
};

export function StatCard({ icon: Icon, label, value, subValue, color = 'primary', onClick }: StatCardProps) {
  return (
    <Card 
      className={cn(
        'p-3 cursor-pointer hover:shadow-md transition-shadow',
        onClick && 'active:scale-[0.98]'
      )}
      onClick={onClick}
    >
      <div className="flex flex-col items-center text-center gap-2">
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', colorMap[color])}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          <p className="text-lg font-bold text-foreground">{value}</p>
          {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
        </div>
      </div>
    </Card>
  );
}
