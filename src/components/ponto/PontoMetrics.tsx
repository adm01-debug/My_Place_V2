import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, Timer, AlertCircle } from 'lucide-react';
import { differenceInMinutes, differenceInSeconds, startOfToday, isAfter, setHours, setMinutes } from 'date-fns';

interface PontoMetricsProps {
  punches: any[];
  expectedHours?: number; // default 8
}

export function PontoMetrics({ punches, expectedHours = 8 }: PontoMetricsProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  const entrada = punches.find(p => p.tipo === 'entrada');
  const saidaAlmoco = punches.find(p => p.tipo === 'saida_almoco');
  const retornoAlmoco = punches.find(p => p.tipo === 'retorno_almoco');
  const saida = punches.find(p => p.tipo === 'saida');

  useEffect(() => {
    if (!entrada || saida) return;

    const interval = setInterval(() => {
      const now = new Date();
      let totalMs = 0;

      if (!saidaAlmoco) {
        // Ainda trabalhando antes do almoço ou sem almoço
        totalMs = now.getTime() - new Date(entrada.data_hora).getTime();
      } else if (!retornoAlmoco) {
        // No almoço
        totalMs = new Date(saidaAlmoco.data_hora).getTime() - new Date(entrada.data_hora).getTime();
      } else {
        // Voltou do almoço, trabalhando
        const morningMs = new Date(saidaAlmoco.data_hora).getTime() - new Date(entrada.data_hora).getTime();
        const afternoonMs = now.getTime() - new Date(retornoAlmoco.data_hora).getTime();
        totalMs = morningMs + afternoonMs;
      }

      setElapsedSeconds(Math.max(0, Math.floor(totalMs / 1000)));
    }, 1000);

    return () => clearInterval(interval);
  }, [entrada, saidaAlmoco, retornoAlmoco, saida]);

  // Se já bateu a saída final, calcula o total fixo
  const calculateTotalSeconds = () => {
    if (!entrada) return 0;
    const end = saida ? new Date(saida.data_hora) : new Date();
    let totalMs = 0;

    if (saidaAlmoco && retornoAlmoco) {
      const morning = new Date(saidaAlmoco.data_hora).getTime() - new Date(entrada.data_hora).getTime();
      const afternoon = end.getTime() - new Date(retornoAlmoco.data_hora).getTime();
      totalMs = morning + afternoon;
    } else if (saidaAlmoco) {
      totalMs = new Date(saidaAlmoco.data_hora).getTime() - new Date(entrada.data_hora).getTime();
    } else {
      totalMs = end.getTime() - new Date(entrada.data_hora).getTime();
    }
    return Math.max(0, Math.floor(totalMs / 1000));
  };

  const currentTotalSeconds = calculateTotalSeconds();
  const currentTotalHours = currentTotalSeconds / 3600;
  const progress = Math.min(100, (currentTotalHours / expectedHours) * 100);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Estimativa de saída
  const getEstimatedExit = () => {
    if (!entrada) return null;
    
    // Simplificado: entrada + 8h + 1h almoço (se não bateu retorno ainda)
    const totalWorkMs = expectedHours * 3600000;
    const lunchMs = 3600000; // 1h padrão
    
    let exitDate = new Date(new Date(entrada.data_hora).getTime() + totalWorkMs + lunchMs);
    
    // Se já bateu o almoço, podemos ser mais precisos
    if (saidaAlmoco && retornoAlmoco) {
      const morningMs = new Date(saidaAlmoco.data_hora).getTime() - new Date(entrada.data_hora).getTime();
      const remainingMs = totalWorkMs - morningMs;
      exitDate = new Date(new Date(retornoAlmoco.data_hora).getTime() + remainingMs);
    }

    return exitDate;
  };

  const estimatedExit = getEstimatedExit();
  const isOvertime = currentTotalHours > expectedHours;

  return (
    <div className="grid grid-cols-1 gap-4">
      <Card className="border-border/50 bg-accent/5 overflow-hidden">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Timer className={`w-4 h-4 ${isOvertime ? 'text-amber-500 animate-pulse' : 'text-primary'}`} />
              <span className="text-sm font-medium">Tempo de Trabalho Hoje</span>
            </div>
            <span className={`text-2xl font-bold tabular-nums ${isOvertime ? 'text-amber-500' : 'text-foreground'}`}>
              {formatTime(currentTotalSeconds)}
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
              <span>Progresso da Jornada</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <span className="text-[10px] uppercase text-muted-foreground font-bold">Saída Estimada</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-muted-foreground" />
                <span className="text-sm font-semibold">
                  {estimatedExit ? formatTime(Math.floor(estimatedExit.getTime() / 1000)).substring(0, 5) : '--:--'}
                </span>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] uppercase text-muted-foreground font-bold">Extra Estimado</span>
              <div className="flex items-center gap-1.5">
                <AlertCircle className={`w-3 h-3 ${isOvertime ? 'text-amber-500' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-semibold ${isOvertime ? 'text-amber-500' : 'text-foreground'}`}>
                  {isOvertime ? `+${formatTime(currentTotalSeconds - (expectedHours * 3600))}` : '00:00:00'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
