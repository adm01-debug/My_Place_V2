import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Clock, LogIn, LogOut, Coffee, DoorOpen, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addWeeks, addMonths, subWeeks, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type PunchType = 'entrada' | 'saida_almoco' | 'retorno_almoco' | 'saida';

interface PunchRecord {
  id: string;
  tipo: PunchType;
  data_hora: string;
  latitude: number | null;
  longitude: number | null;
}

const punchMeta: Record<PunchType, { label: string; icon: typeof LogIn; iconColor: string; bgColor: string }> = {
  entrada: { label: 'Entrada', icon: LogIn, iconColor: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  saida_almoco: { label: 'Saída Almoço', icon: Coffee, iconColor: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  retorno_almoco: { label: 'Retorno Almoço', icon: DoorOpen, iconColor: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  saida: { label: 'Saída', icon: LogOut, iconColor: 'text-red-500', bgColor: 'bg-red-500/10' },
};

function computeDayHours(punches: PunchRecord[]): number {
  const sorted = [...punches].sort((a, b) => a.data_hora.localeCompare(b.data_hora));
  let totalMs = 0;
  const entrada = sorted.find((p) => p.tipo === 'entrada');
  const saidaAlmoco = sorted.find((p) => p.tipo === 'saida_almoco');
  const retornoAlmoco = sorted.find((p) => p.tipo === 'retorno_almoco');
  const saida = sorted.find((p) => p.tipo === 'saida');

  if (entrada && saidaAlmoco) {
    totalMs += new Date(saidaAlmoco.data_hora).getTime() - new Date(entrada.data_hora).getTime();
  }
  if (retornoAlmoco && saida) {
    totalMs += new Date(saida.data_hora).getTime() - new Date(retornoAlmoco.data_hora).getTime();
  }
  if (entrada && saida && !saidaAlmoco && !retornoAlmoco) {
    totalMs = new Date(saida.data_hora).getTime() - new Date(entrada.data_hora).getTime();
  }
  return Math.round((totalMs / 3600000) * 100) / 100;
}

function groupByDay(punches: PunchRecord[]): Map<string, PunchRecord[]> {
  const map = new Map<string, PunchRecord[]>();
  punches.forEach((p) => {
    const day = format(new Date(p.data_hora), 'yyyy-MM-dd');
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(p);
  });
  return map;
}

export default function PontoHistory() {
  const { user } = useAuth();
  const [tab, setTab] = useState<'semana' | 'mes' | 'data'>('semana');
  const [referenceDate, setReferenceDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [punches, setPunches] = useState<PunchRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const getRange = useCallback((): { start: Date; end: Date } => {
    if (tab === 'semana') {
      return { start: startOfWeek(referenceDate, { weekStartsOn: 1 }), end: endOfWeek(referenceDate, { weekStartsOn: 1 }) };
    }
    if (tab === 'mes') {
      return { start: startOfMonth(referenceDate), end: endOfMonth(referenceDate) };
    }
    // data (single day)
    const d = selectedDate || new Date();
    const start = new Date(d); start.setHours(0, 0, 0, 0);
    const end = new Date(d); end.setHours(23, 59, 59, 999);
    return { start, end };
  }, [tab, referenceDate, selectedDate]);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { start, end } = getRange();
      const { data, error } = await supabase
        .from('registros_ponto')
        .select('id, tipo, data_hora, latitude, longitude')
        .eq('user_id', user.id)
        .gte('data_hora', start.toISOString())
        .lte('data_hora', end.toISOString())
        .order('data_hora', { ascending: true });

      if (error) throw error;
      setPunches((data as PunchRecord[]) || []);
    } catch {
      setPunches([]);
    } finally {
      setLoading(false);
    }
  }, [user, getRange]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const navigate = (dir: 'prev' | 'next') => {
    if (tab === 'semana') {
      setReferenceDate((d) => (dir === 'prev' ? subWeeks(d, 1) : addWeeks(d, 1)));
    } else if (tab === 'mes') {
      setReferenceDate((d) => (dir === 'prev' ? subMonths(d, 1) : addMonths(d, 1)));
    }
  };

  const periodLabel = (): string => {
    if (tab === 'semana') {
      const { start, end } = getRange();
      return `${format(start, 'dd/MM')} - ${format(end, 'dd/MM/yyyy')}`;
    }
    if (tab === 'mes') {
      return format(referenceDate, 'MMMM yyyy', { locale: ptBR });
    }
    return selectedDate ? format(selectedDate, "dd 'de' MMMM yyyy", { locale: ptBR }) : 'Selecione uma data';
  };

  const grouped = groupByDay(punches);
  const totalHours = Array.from(grouped.values()).reduce((sum, dayPunches) => sum + computeDayHours(dayPunches), 0);
  const averageHours = grouped.size > 0 ? totalHours / grouped.size : 0;

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Histórico de Ponto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="w-full">
            <TabsTrigger value="semana" className="flex-1 text-xs">Semana</TabsTrigger>
            <TabsTrigger value="mes" className="flex-1 text-xs">Mês</TabsTrigger>
            <TabsTrigger value="data" className="flex-1 text-xs">Data</TabsTrigger>
          </TabsList>

          {/* Period navigation */}
          <TabsContent value="semana" className="mt-3">
            <PeriodNav label={periodLabel()} onPrev={() => navigate('prev')} onNext={() => navigate('next')} />
          </TabsContent>
          <TabsContent value="mes" className="mt-3">
            <PeriodNav label={periodLabel()} onPrev={() => navigate('prev')} onNext={() => navigate('next')} />
          </TabsContent>
          <TabsContent value="data" className="mt-3">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !selectedDate && 'text-muted-foreground')}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "dd 'de' MMMM yyyy", { locale: ptBR }) : 'Selecione uma data'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  locale={ptBR}
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
          </TabsContent>
        </Tabs>

        {/* Summary */}
        {!loading && punches.length > 0 && (
          <div className="flex items-center justify-between px-1">
            <span className="text-xs text-muted-foreground">{grouped.size} dia{grouped.size !== 1 ? 's' : ''} com registros</span>
            <div className="flex gap-2">
              <Badge variant="outline" className="text-[10px] px-1.5 font-normal">
                Média: {averageHours.toFixed(1)}h/dia
              </Badge>
              <Badge variant="secondary" className="text-xs">
                <Clock className="w-3 h-3 mr-1" />
                {totalHours.toFixed(1)}h total
              </Badge>
            </div>
          </div>
        )}

        {/* Records */}
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : punches.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            Nenhum registro encontrado neste período.
          </p>
        ) : (
          <div className="space-y-4">
            {Array.from(grouped.entries())
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([dateKey, dayPunches]) => {
                const dayDate = new Date(dateKey + 'T12:00:00');
                const hours = computeDayHours(dayPunches);
                return (
                  <div key={dateKey} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-foreground capitalize">
                        {format(dayDate, "EEEE, dd/MM", { locale: ptBR })}
                      </span>
                      <span className="text-xs text-muted-foreground">{hours.toFixed(1)}h</span>
                    </div>
                    <div className="space-y-1.5 pl-1">
                      {dayPunches
                        .sort((a, b) => a.data_hora.localeCompare(b.data_hora))
                        .map((punch) => {
                          const meta = punchMeta[punch.tipo];
                          const Icon = meta.icon;
                          return (
                            <div key={punch.id} className="flex items-center gap-2.5">
                              <div className={`flex items-center justify-center w-6 h-6 rounded-md ${meta.bgColor}`}>
                                <Icon className={`w-3 h-3 ${meta.iconColor}`} />
                              </div>
                              <span className="text-xs text-muted-foreground flex-1">{meta.label}</span>
                              <span className="text-xs font-medium text-foreground tabular-nums">
                                {new Date(punch.data_hora).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PeriodNav({ label, onPrev, onNext }: { label: string; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <Button variant="ghost" size="icon" onClick={onPrev} className="h-8 w-8">
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <span className="text-sm font-medium text-foreground capitalize">{label}</span>
      <Button variant="ghost" size="icon" onClick={onNext} className="h-8 w-8">
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
