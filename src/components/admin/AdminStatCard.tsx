import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface AdminStatCardProps {
  icon: any;
  label: string;
  value: number;
  color: string;
}

export const AdminStatCard = ({ icon: Icon, label, value, color }: AdminStatCardProps) => (
  <Card className={cn(
    "p-4 border-0 shadow-card bg-card/80 backdrop-blur-sm",
    value > 0 && "ring-2 ring-primary/20"
  )}>
    <div className="flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  </Card>
);
