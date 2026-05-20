import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

interface PontoAnalyticsProps {
  stats: {
    saldoMes: string;
    mediaEntrada: string;
    mediaSaida: string;
    diasIncompletos: number;
    percentualPontualidade: number;
  };
}

export function PontoAnalytics({ stats }: PontoAnalyticsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <Card className="border-border/50 bg-primary/5">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Saldo do Mês</p>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-2xl font-bold">{stats.saldoMes}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pontualidade</p>
            <p className="text-lg font-bold text-emerald-500">{stats.percentualPontualidade}%</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/50">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="space-y-3 flex-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Status da Jornada Mensal</span>
              <span className="text-[10px] font-bold text-primary">{stats.percentualPontualidade}% completa</span>
            </div>
            <Progress value={stats.percentualPontualidade} className="h-1.5" />
            <div className="flex justify-between text-[9px] font-medium text-muted-foreground uppercase">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>Entradas: {stats.mediaEntrada}</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className={`w-3 h-3 ${stats.diasIncompletos > 0 ? 'text-amber-500' : 'text-emerald-500'}`} />
                <span>{stats.diasIncompletos} Pendências</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
