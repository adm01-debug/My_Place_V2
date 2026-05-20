import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function TimeBankCard() {
  const { profile } = useAuth();
  
  const saldo = profile?.saldo_horas || 0;
  const valorHoraExtra = profile?.valor_hora_extra || 0;
  const valorEstimado = saldo > 0 ? saldo * valorHoraExtra : 0;
  const isPositive = saldo >= 0;

  return (
    <Card className="border-border/50 shadow-lg overflow-hidden group">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <History className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Banco de Horas</h3>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-3.5 h-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Saldo acumulado até o último fechamento.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex items-end justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-2xl font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isPositive ? '+' : ''}{saldo.toFixed(1)}h
              </span>
              <Badge variant={isPositive ? 'secondary' : 'destructive'} className="h-5 px-1.5 text-[10px]">
                {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                {isPositive ? 'Crédito' : 'Débito'}
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {isPositive 
                ? valorEstimado > 0 
                  ? `Valor estimado: R$ ${valorEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                  : 'Você possui horas para compensar.' 
                : 'Atenção: você possui horas em débito.'}
            </p>
          </div>
          
          <button className="text-xs font-semibold text-primary hover:underline pb-1">Ver Extrato</button>
        </div>

        {/* Mini visualization */}
        <div className="mt-4 h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}
            style={{ width: `${Math.min(Math.abs(saldo) * 5, 100)}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
