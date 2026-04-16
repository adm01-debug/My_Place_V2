import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, LogIn, LogOut, Coffee, DoorOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const punchTypes = [
  { label: 'Entrada', icon: LogIn, color: 'text-emerald-500 bg-emerald-500/10' },
  { label: 'Saída Almoço', icon: Coffee, color: 'text-amber-500 bg-amber-500/10' },
  { label: 'Retorno Almoço', icon: DoorOpen, color: 'text-blue-500 bg-blue-500/10' },
  { label: 'Saída', icon: LogOut, color: 'text-red-500 bg-red-500/10' },
];

export default function Ponto() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div className="w-full max-w-lg mx-auto p-4 pt-6 pb-20 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Registro de Ponto</h1>
        <p className="text-sm text-muted-foreground capitalize">{dateStr}</p>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardContent className="flex flex-col items-center py-8 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-8 h-8 text-primary" />
            <span className="text-5xl font-bold text-foreground tabular-nums">{timeStr}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>Localização será capturada ao registrar</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        {punchTypes.map(({ label, icon: Icon, color }) => {
          const [iconColor, bgColor] = color.split(' ');
          return (
            <Button
              key={label}
              variant="outline"
              className="h-auto flex flex-col items-center gap-2 py-4 border-border/50 hover:bg-accent/50"
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${bgColor}`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <span className="text-sm font-medium">{label}</span>
            </Button>
          );
        })}
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Registros de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhum registro realizado hoje.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
