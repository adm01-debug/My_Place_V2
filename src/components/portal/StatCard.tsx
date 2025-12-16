import { LucideIcon, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  subValue?: string;
  color?: 'primary' | 'hr' | 'finance' | 'projects' | 'warning' | 'operations' | 'marketing';
  onClick?: () => void;
  className?: string;
}

const colorConfig = {
  primary: {
    bg: 'bg-gradient-to-br from-primary/20 to-primary/5',
    icon: 'bg-primary/20 text-primary',
    glow: 'group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.3)]',
  },
  hr: {
    bg: 'bg-gradient-to-br from-hr/20 to-hr/5',
    icon: 'bg-hr/20 text-hr',
    glow: 'group-hover:shadow-[0_0_20px_hsl(var(--hr)/0.3)]',
  },
  finance: {
    bg: 'bg-gradient-to-br from-finance/20 to-finance/5',
    icon: 'bg-finance/20 text-finance',
    glow: 'group-hover:shadow-[0_0_20px_hsl(var(--finance)/0.3)]',
  },
  projects: {
    bg: 'bg-gradient-to-br from-projects/20 to-projects/5',
    icon: 'bg-projects/20 text-projects',
    glow: 'group-hover:shadow-[0_0_20px_hsl(var(--projects)/0.3)]',
  },
  warning: {
    bg: 'bg-gradient-to-br from-projects/20 to-projects/5',
    icon: 'bg-projects/20 text-projects',
    glow: 'group-hover:shadow-[0_0_20px_hsl(var(--projects)/0.3)]',
  },
  operations: {
    bg: 'bg-gradient-to-br from-operations/20 to-operations/5',
    icon: 'bg-operations/20 text-operations',
    glow: 'group-hover:shadow-[0_0_20px_hsl(var(--operations)/0.3)]',
  },
  marketing: {
    bg: 'bg-gradient-to-br from-marketing/20 to-marketing/5',
    icon: 'bg-marketing/20 text-marketing',
    glow: 'group-hover:shadow-[0_0_20px_hsl(var(--marketing)/0.3)]',
  },
};

export function StatCard({ icon: Icon, label, value, subValue, color = 'primary', onClick, className }: StatCardProps) {
  const config = colorConfig[color];
  
  return (
    <Card 
      className={cn(
        'group p-4 cursor-pointer transition-all duration-300 hover-lift border-0 shadow-card overflow-hidden relative',
        config.bg,
        config.glow,
        onClick && 'active:scale-[0.98]',
        className
      )}
      onClick={onClick}
    >
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-card/80 to-transparent pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center text-center gap-2">
        <div className={cn(
          'w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
          config.icon
        )}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
          <p className="text-xl font-display font-bold text-foreground mt-0.5">{value}</p>
          {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
        </div>
      </div>
    </Card>
  );
}
