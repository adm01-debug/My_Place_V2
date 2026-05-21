import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PontoHistory from '@/components/ponto/PontoHistory';
import { PontoMetrics } from '@/components/ponto/PontoMetrics';
import { PontoAnalytics } from '@/components/ponto/PontoAnalytics';
import { PullToRefresh } from '@/components/portal/PullToRefresh';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, LogIn, LogOut, Coffee, DoorOpen, CheckCircle2, Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ModuleHeader } from '@/components/layout/ModuleHeader';

type PunchType = 'entrada' | 'saida_almoco' | 'retorno_almoco' | 'saida';

interface PunchRecord {
  id: string;
  tipo: PunchType;
  data_hora: string;
  latitude: number | null;
  longitude: number | null;
  endereco: string | null;
}

const punchConfig: { tipo: PunchType; label: string; icon: typeof LogIn; iconColor: string; bgColor: string }[] = [
  { tipo: 'entrada', label: 'Entrada', icon: LogIn, iconColor: 'text-emerald-500', bgColor: 'bg-emerald-500/10' },
  { tipo: 'saida_almoco', label: 'Saída Almoço', icon: Coffee, iconColor: 'text-amber-500', bgColor: 'bg-amber-500/10' },
  { tipo: 'retorno_almoco', label: 'Retorno Almoço', icon: DoorOpen, iconColor: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  { tipo: 'saida', label: 'Saída', icon: LogOut, iconColor: 'text-red-500', bgColor: 'bg-red-500/10' },
];

const punchLabelMap: Record<PunchType, string> = {
  entrada: 'Entrada',
  saida_almoco: 'Saída Almoço',
  retorno_almoco: 'Retorno Almoço',
  saida: 'Saída',
};

export default function Ponto() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayPunches, setTodayPunches] = useState<PunchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [punching, setPunching] = useState<PunchType | null>(null);
  const [stats, setStats] = useState({
    saldoMes: "00:00",
    mediaEntrada: "09:00",
    mediaSaida: "18:00",
    diasIncompletos: 0,
    percentualPontualidade: 100
  });

  // Live clock
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const timeStr = currentTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = currentTime.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  const fetchTodayPunches = useCallback(async () => {
    if (!user) return;
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { data, error } = await supabase
        .from('registros_ponto')
        .select('id, tipo, data_hora, latitude, longitude, endereco')
        .eq('user_id', user.id)
        .gte('data_hora', todayStart.toISOString())
        .lte('data_hora', todayEnd.toISOString())
        .order('data_hora', { ascending: true });

      if (error) throw error;
      setTodayPunches((data as PunchRecord[]) || []);
    } catch (error) {
      console.error('Erro ao buscar registros de hoje:', error);
    }
  }, [user]);

  const fetchMonthlyStats = useCallback(async () => {
    if (!user) return;
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      const { data, error } = await supabase
        .from('registros_ponto')
        .select('tipo, data_hora')
        .eq('user_id', user.id)
        .gte('data_hora', monthStart.toISOString())
        .lte('data_hora', monthEnd.toISOString());

      if (error) throw error;

      const punches = data || [];
      const daysWithPunches = new Set(punches.map(p => p.data_hora.split('T')[0])).size;
      
      // Calculate Average Arrival (mediaEntrada)
      const entradas = punches.filter(p => p.tipo === 'entrada');
      let avgEntradaStr = "09:00";
      if (entradas.length > 0) {
        const totalMinutes = entradas.reduce((acc, p) => {
          const date = new Date(p.data_hora);
          return acc + (date.getHours() * 60 + date.getMinutes());
        }, 0);
        const avgMinutes = Math.floor(totalMinutes / entradas.length);
        avgEntradaStr = `${String(Math.floor(avgMinutes / 60)).padStart(2, '0')}:${String(avgMinutes % 60).padStart(2, '0')}`;
      }

      // Calculate Average Exit (mediaSaida)
      const saidas = punches.filter(p => p.tipo === 'saida');
      let avgSaidaStr = "18:00";
      if (saidas.length > 0) {
        const totalMinutes = saidas.reduce((acc, p) => {
          const date = new Date(p.data_hora);
          return acc + (date.getHours() * 60 + date.getMinutes());
        }, 0);
        const avgMinutes = Math.floor(totalMinutes / saidas.length);
        avgSaidaStr = `${String(Math.floor(avgMinutes / 60)).padStart(2, '0')}:${String(avgMinutes % 60).padStart(2, '0')}`;
      }

      // Calculate incomplete days (diasIncompletos)
      // Group by day and check if there are 4 punches (standard)
      const dailyGroups: Record<string, string[]> = {};
      punches.forEach(p => {
        const day = p.data_hora.split('T')[0];
        if (!dailyGroups[day]) dailyGroups[day] = [];
        dailyGroups[day].push(p.tipo);
      });
      
      let incompleteDaysCount = 0;
      Object.keys(dailyGroups).forEach(day => {
        // Only count full days that have passed (not today)
        if (day !== new Date().toISOString().split('T')[0]) {
          if (dailyGroups[day].length < 4) incompleteDaysCount++;
        }
      });

      // Simple calculation for monthly balance (saldoMes)
      // Assume 8h per day. Calculate total worked duration.
      // This is a simplified version.
      let totalWorkedMinutes = 0;
      Object.keys(dailyGroups).forEach(day => {
        const dayPunches = punches.filter(p => p.data_hora.split('T')[0] === day).sort((a, b) => a.data_hora.localeCompare(b.data_hora));
        
        let dayWorked = 0;
        // Basic calculation: Entry -> Lunch Start, Lunch End -> Exit
        const entry = dayPunches.find(p => p.tipo === 'entrada');
        const lunchStart = dayPunches.find(p => p.tipo === 'saida_almoco');
        const lunchEnd = dayPunches.find(p => p.tipo === 'retorno_almoco');
        const exit = dayPunches.find(p => p.tipo === 'saida');

        if (entry && lunchStart) {
          dayWorked += (new Date(lunchStart.data_hora).getTime() - new Date(entry.data_hora).getTime()) / 60000;
        }
        if (lunchEnd && exit) {
          dayWorked += (new Date(exit.data_hora).getTime() - new Date(lunchEnd.data_hora).getTime()) / 60000;
        } else if (entry && exit && !lunchStart && !lunchEnd) {
          // Continuous shift
          dayWorked += (new Date(exit.data_hora).getTime() - new Date(entry.data_hora).getTime()) / 60000;
        }
        
        totalWorkedMinutes += dayWorked;
      });

      const expectedMinutes = daysWithPunches * 8 * 60; // 8h/day
      const balanceMinutes = totalWorkedMinutes - expectedMinutes;
      const balanceSign = balanceMinutes >= 0 ? '+' : '-';
      const absMinutes = Math.abs(Math.floor(balanceMinutes));
      const balanceStr = `${balanceSign}${String(Math.floor(absMinutes / 60)).padStart(2, '0')}:${String(absMinutes % 60).padStart(2, '0')}`;

      // Punctuality (percentualPontualidade)
      // Consider "on time" if entry is before 09:15
      const onTimeEntradas = entradas.filter(p => {
        const date = new Date(p.data_hora);
        return (date.getHours() < 9) || (date.getHours() === 9 && date.getMinutes() <= 15);
      }).length;
      
      const punctuality = entradas.length > 0 ? Math.round((onTimeEntradas / entradas.length) * 100) : 100;

      setStats({
        saldoMes: balanceStr,
        mediaEntrada: avgEntradaStr,
        mediaSaida: avgSaidaStr,
        diasIncompletos: incompleteDaysCount,
        percentualPontualidade: punctuality
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas mensais:', error);
    }
  }, [user]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchTodayPunches(), fetchMonthlyStats()]);
    setLoading(false);
  }, [fetchTodayPunches, fetchMonthlyStats]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getLocation = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  };

  const validateLocation = async (lat: number, lng: number): Promise<{ allowed: boolean; name?: string; distance?: number }> => {
    const { data, error } = await supabase.rpc('fn_validar_ponto_no_raio', {
      p_latitude: lat,
      p_longitude: lng,
    });

    if (error) {
      console.error('Erro na validação de localização:', error);
      return { allowed: true };
    }

    if (data && data.length > 0) {
      return { allowed: true, name: data[0].local_nome, distance: Math.round(data[0].distancia_metros) };
    }

    return { allowed: false };
  };

  const handlePunch = useCallback(async (tipo: PunchType) => {
    if (!user || punching) return;

    if (todayPunches.some((p) => p.tipo === tipo)) {
      toast.error(`Você já registrou "${punchLabelMap[tipo]}" hoje.`);
      return;
    }

    setPunching(tipo);
    try {
      const location = await getLocation();

      if (!location) {
        toast.error('Não foi possível obter sua localização. Ative o GPS e tente novamente.', {
          icon: <ShieldAlert className="w-4 h-4" />,
        });
        setPunching(null);
        return;
      }

      const validation = await validateLocation(location.lat, location.lng);

      if (!validation.allowed) {
        toast.error('Você está fora da área permitida para registro de ponto. Aproxime-se de um local autorizado.', {
          icon: <ShieldAlert className="w-4 h-4" />,
          duration: 5000,
        });
        setPunching(null);
        return;
      }

      const { error } = await supabase.from('registros_ponto').insert({
        user_id: user.id,
        tipo,
        latitude: location.lat,
        longitude: location.lng,
        metadata: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          timestamp_sync: new Date().toISOString()
        }
      });

      if (error) throw error;

      const distText = validation.distance ? ` (${validation.distance}m de ${validation.name})` : '';
      toast.success(`${punchLabelMap[tipo]} registrada com sucesso!${distText}`, {
        icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
      });
      
      // Haptic feedback if supported
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 30, 100]);
      }
      
      await loadData();
    } catch (error) {
      console.error('Erro ao registrar ponto:', error);
      toast.error('Erro ao registrar ponto. Tente novamente.');
    } finally {
      setPunching(null);
    }
  }, [user, punching, todayPunches, fetchTodayPunches]);

  useEffect(() => {
    loadData();

    const handleAction = (e: any) => {
      const { type } = e.detail;
      if (type === 'punch-entrada') handlePunch('entrada');
      if (type === 'punch-almoco') handlePunch('saida_almoco');
      if (type === 'punch-retorno') handlePunch('retorno_almoco');
      if (type === 'punch-saida') handlePunch('saida');
    };

    window.addEventListener('app-action', handleAction);
    return () => window.removeEventListener('app-action', handleAction);
  }, [fetchTodayPunches, handlePunch]);

  const isPunched = (tipo: PunchType) => todayPunches.some((p) => p.tipo === tipo);

  const nextPunchIndex = punchConfig.findIndex((p) => !isPunched(p.tipo));

  return (
    <PullToRefresh onRefresh={async () => { await loadData(); }}>
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <ModuleHeader 
        title="Ponto Eletrônico Digital" 
        description={dateStr}
        icon={Clock}
      />

      <PontoAnalytics stats={stats} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Clock & Map Preview */}
        <Card className="border-border/50 shadow-lg h-full overflow-hidden">
          <div className="relative h-28 bg-muted/30 border-b border-border/50 overflow-hidden">
             <div className="absolute inset-0 opacity-30 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-primary/20 animate-[ping_3s_linear_infinite]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-primary/10 animate-[ping_4s_linear_infinite]" />
                {/* Simulated Radar Line */}
                <div className="absolute top-1/2 left-1/2 w-[150px] h-[1px] bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 origin-left animate-[spin_4s_linear_infinite]" />
             </div>
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-1">
                   <div className="flex flex-col items-center gap-2 px-4 py-2 rounded-2xl bg-background/60 backdrop-blur-md border border-white/20 shadow-xl">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                        <span className="text-[11px] font-bold uppercase tracking-widest text-foreground">Escritório Central</span>
                      </div>
                      <span className="text-[9px] text-muted-foreground font-medium">Sua localização está dentro do raio permitido</span>
                   </div>
                </div>
             </div>
          </div>
          <CardContent className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-2">
                <Clock className="w-6 h-6 text-primary" />
                <span className="text-4xl font-bold text-foreground tabular-nums">{timeStr}</span>
              </div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Hora oficial (GMT-3)</p>
            </div>
            
            <div className="w-full pt-2">
              <PontoMetrics punches={todayPunches} />
            </div>
          </CardContent>
        </Card>

        {/* Punch Buttons */}
        <div className="grid grid-cols-2 gap-3">
          {punchConfig.map(({ tipo, label, icon: Icon, iconColor, bgColor }, index) => {
            const done = isPunched(tipo);
            const isNext = index === nextPunchIndex;
            const isLoading = punching === tipo;

            return (
              <Button
                key={tipo}
                variant="outline"
                disabled={done || isLoading || (punching !== null && punching !== tipo)}
                onClick={() => handlePunch(tipo)}
                className={`h-auto flex flex-col items-center gap-2 py-6 border-border/50 transition-all ${
                  done
                    ? 'opacity-60 cursor-not-allowed'
                    : isNext
                      ? 'ring-2 ring-primary/50 hover:bg-accent/50 shadow-md scale-[1.02]'
                      : 'hover:bg-accent/50'
                }`}
              >
                <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${bgColor} relative`}>
                  {isLoading ? (
                    <Loader2 className={`w-5 h-5 ${iconColor} animate-spin`} />
                  ) : done ? (
                    <CheckCircle2 className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                  )}
                </div>
                <span className="text-sm font-medium">{label}</span>
                {done && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {new Date(todayPunches.find((p) => p.tipo === tipo)!.data_hora).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Badge>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
        {/* Today's Records */}
        <Card className="border-border/50 shadow-lg h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Registros de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center gap-3 py-2">
                    <Skeleton className="w-8 h-8 rounded-lg" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : todayPunches.length === 0 ? (
              <EmptyState 
                title="Nenhum registro" 
                description="Você ainda não realizou nenhum registro de ponto hoje."
                className="py-6"
              />
            ) : (
              <div className="space-y-3">
                {todayPunches.map((punch) => {
                  const config = punchConfig.find((p) => p.tipo === punch.tipo);
                  const PunchIcon = config?.icon || Clock;
                  return (
                    <div key={punch.id} className="flex items-center gap-3 py-2 animate-in slide-in-from-left-2 duration-300">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${config?.bgColor}`}>
                        <PunchIcon className={`w-4 h-4 ${config?.iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">{punchLabelMap[punch.tipo]}</p>
                        {punch.latitude && punch.longitude && (
                          <p className="text-xs text-muted-foreground truncate">
                            📍 {punch.latitude.toFixed(4)}, {punch.longitude.toFixed(4)}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-foreground tabular-nums">
                          {new Date(punch.data_hora).toLocaleTimeString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">Confirmado</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* History Summary */}
        <div className="h-full">
          <PontoHistory />
        </div>
      </div>
    </div>
    </PullToRefresh>
  );
}
