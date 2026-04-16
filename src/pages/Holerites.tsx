import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Receipt, Download, TrendingUp, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const months = [
  { month: 'Junho 2025', status: 'Disponível', value: 'R$ 4.850,00' },
  { month: 'Maio 2025', status: 'Disponível', value: 'R$ 4.850,00' },
  { month: 'Abril 2025', status: 'Disponível', value: 'R$ 4.720,00' },
];

export default function Holerites() {
  return (
    <div className="w-full max-w-lg mx-auto p-4 pt-6 pb-20 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Holerites</h1>
        <p className="text-sm text-muted-foreground">Consulte seus contracheques</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-border/50 shadow-md">
          <CardContent className="flex flex-col items-center py-4 gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-500/10">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-xs text-muted-foreground">Último Salário</p>
            <p className="text-lg font-bold text-foreground">R$ 4.850</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-md">
          <CardContent className="flex flex-col items-center py-4 gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10">
              <Calendar className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground">Referência</p>
            <p className="text-lg font-bold text-foreground">Jun/2025</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Holerites Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {months.map(({ month, status, value }) => (
            <div key={month} className="flex items-center justify-between py-2.5 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10">
                  <Receipt className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{month}</p>
                  <p className="text-xs text-muted-foreground">{value}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary">
                <Download className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
