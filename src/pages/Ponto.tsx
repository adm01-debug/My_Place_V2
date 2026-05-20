import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PontoHistory from '@/components/ponto/PontoHistory';
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
      console.error('Erro ao buscar registros:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

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
      });

      if (error) throw error;

      const distText = validation.distance ? ` (${validation.distance}m de ${validation.name})` : '';
      toast.success(`${punchLabelMap[tipo]} registrada com sucesso!${distText}`, {
        icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
      });
      await fetchTodayPunches();
    } catch (error) {
      console.error('Erro ao registrar ponto:', error);
      toast.error('Erro ao registrar ponto. Tente novamente.');
    } finally {
      setPunching(null);
    }
  }, [user, punching, todayPunches, fetchTodayPunches]);

  useEffect(() => {
    fetchTodayPunches();

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
    <PullToRefresh onRefresh={async () => { await fetchTodayPunches(); }}>
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <ModuleHeader 
        title="Bater Ponto" 
        description={dateStr}
        icon={Clock}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Clock & Map Preview */}
        <Card className="border-border/50 shadow-lg h-full overflow-hidden">
          <div className="relative h-24 bg-muted/30 border-b border-border/50 overflow-hidden">
             <div className="absolute inset-0 opacity-20 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full border border-primary/20 animate-[ping_3s_linear_infinite]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-primary/10 animate-[ping_4s_linear_infinite]" />
             </div>
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-1">
                   <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Localização Verificada</span>
                   </div>
                </div>
             </div>
          </div>
          <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="w-8 h-8 text-primary" />
              <span className="text-5xl font-bold text-foreground tabular-nums">{timeStr}</span>
            </div>
            <p className="text-xs text-muted-foreground">Hora oficial de Brasília (GMT-3)</p>
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
                      <span className="text-sm font-semibold text-foreground tabular-nums">
                        {new Date(punch.data_hora).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
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
