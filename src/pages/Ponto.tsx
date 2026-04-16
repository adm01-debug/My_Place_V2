import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PontoHistory from '@/components/ponto/PontoHistory';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, LogIn, LogOut, Coffee, DoorOpen, CheckCircle2, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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

  useEffect(() => {
    fetchTodayPunches();
  }, [fetchTodayPunches]);

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

  const handlePunch = async (tipo: PunchType) => {
    if (!user || punching) return;

    // Check if already punched this type today
    if (todayPunches.some((p) => p.tipo === tipo)) {
      toast.error(`Você já registrou "${punchLabelMap[tipo]}" hoje.`);
      return;
    }

    setPunching(tipo);
    try {
      const location = await getLocation();

      const { error } = await supabase.from('registros_ponto').insert({
        user_id: user.id,
        tipo,
        latitude: location?.lat ?? null,
        longitude: location?.lng ?? null,
      });

      if (error) throw error;

      toast.success(`${punchLabelMap[tipo]} registrada com sucesso!`);
      await fetchTodayPunches();
    } catch (error) {
      console.error('Erro ao registrar ponto:', error);
      toast.error('Erro ao registrar ponto. Tente novamente.');
    } finally {
      setPunching(null);
    }
  };

  const isPunched = (tipo: PunchType) => todayPunches.some((p) => p.tipo === tipo);

  // Determine next expected punch
  const nextPunchIndex = punchConfig.findIndex((p) => !isPunched(p.tipo));

  return (
    <div className="w-full max-w-lg mx-auto p-4 pt-6 pb-20 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Registro de Ponto</h1>
        <p className="text-sm text-muted-foreground capitalize">{dateStr}</p>
      </div>

      {/* Clock */}
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
              className={`h-auto flex flex-col items-center gap-2 py-4 border-border/50 transition-all ${
                done
                  ? 'opacity-60 cursor-not-allowed'
                  : isNext
                    ? 'ring-2 ring-primary/50 hover:bg-accent/50'
                    : 'hover:bg-accent/50'
              }`}
            >
              <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${bgColor} relative`}>
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

      {/* Today's Records */}
      <Card className="border-border/50 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Registros de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : todayPunches.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum registro realizado hoje.
            </p>
          ) : (
            <div className="space-y-3">
              {todayPunches.map((punch) => {
                const config = punchConfig.find((p) => p.tipo === punch.tipo);
                const PunchIcon = config?.icon || Clock;
                return (
                  <div key={punch.id} className="flex items-center gap-3 py-2">
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
    </div>
  );
}
