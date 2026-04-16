import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palmtree, CalendarDays, Plus, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const stats = [
  { label: 'Saldo Disponível', value: '20 dias', icon: Palmtree, color: 'text-emerald-500 bg-emerald-500/10' },
  { label: 'Período Aquisitivo', value: '2024/2025', icon: CalendarDays, color: 'text-blue-500 bg-blue-500/10' },
  { label: 'Próximo Vencimento', value: '15/03/2026', icon: Clock, color: 'text-amber-500 bg-amber-500/10' },
];

export default function Ferias() {
  return (
    <div className="w-full max-w-lg mx-auto p-4 pt-6 pb-20 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Férias</h1>
          <p className="text-sm text-muted-foreground">Gerencie suas férias e folgas</p>
        </div>
        <Button size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" />
          Solicitar
        </Button>
      </div>

      <div className="grid gap-3">
        {stats.map(({ label, value, icon: Icon, color }) => {
          const [iconColor, bgColor] = color.split(' ');
          return (
            <Card key={label} className="border-border/50 shadow-md">
              <CardContent className="flex items-center gap-4 py-4">
                <div className={`flex items-center justify-center w-11 h-11 rounded-xl ${bgColor}`}>
                  <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-lg font-semibold text-foreground">{value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Histórico de Solicitações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma solicitação de férias registrada.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
