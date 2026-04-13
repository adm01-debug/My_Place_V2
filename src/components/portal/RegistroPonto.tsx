import { useState, useEffect, useMemo } from 'react';
import { MapPin, Clock, CheckCircle, Loader2, Navigation, Wifi, Coffee, LogOut } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRegistrosPonto } from '@/hooks/useRegistrosPonto';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { JornadaProgress } from '@/components/ponto/JornadaProgress';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';

interface LocationData {
  latitude: number;
  longitude: number;
  endereco: string;
  isValid: boolean;
  localNome: string | null;
}

interface LocalPermitido {
  nome: string;
  latitude: number;
  longitude: number;
  raio_metros: number;
}

function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(deltaPhi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function RegistroPonto() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { registros, registrarPonto } = useRegistrosPonto();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'entrada' | 'saida' | 'intervalo_inicio' | 'intervalo_fim' | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locaisPermitidos, setLocaisPermitidos] = useState<LocalPermitido[]>([]);

  useEffect(() => {
    const fetchLocais = async () => {
      const { data } = await supabase.from('locais_permitidos').select('nome, latitude, longitude, raio_metros').eq('ativo', true);
      if (data) setLocaisPermitidos(data);
    };
    fetchLocais();
  }, []);

  const today = format(new Date(), 'yyyy-MM-dd');
  const batidasHoje = useMemo(() =>
    registros.filter(r => format(new Date(r.data_hora), 'yyyy-MM-dd') === today)
      .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()),
    [registros, today]
  );

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const workedMinutes = useMemo(() => {
    if (batidasHoje.length < 1) return 0;
    let total = 0;
    const entradas = batidasHoje.filter(b => b.tipo === 'entrada' || b.tipo === 'intervalo_fim');
    const saidas = batidasHoje.filter(b => b.tipo === 'saida' || b.tipo === 'intervalo_inicio');
    for (let i = 0; i < entradas.length; i++) {
      const entrada = new Date(entradas[i].data_hora);
      const saida = saidas[i] ? new Date(saidas[i].data_hora) : null;
      total += saida ? (saida.getTime() - entrada.getTime()) / 60000 : (currentTime.getTime() - entrada.getTime()) / 60000;
    }
    return Math.max(0, total);
  }, [batidasHoje, currentTime]);

  const getNextAction = (): 'entrada' | 'saida' | 'intervalo_inicio' | 'intervalo_fim' => {
    if (batidasHoje.length === 0) return 'entrada';
    const last = batidasHoje[batidasHoje.length - 1];
    switch (last.tipo) {
      case 'entrada': return 'intervalo_inicio';
      case 'intervalo_inicio': return 'intervalo_fim';
      case 'intervalo_fim': return 'saida';
      default: return 'entrada';
    }
  };

  const nextAction = getNextAction();

  const getGeolocation = (): Promise<LocationData> => new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ latitude: 0, longitude: 0, endereco: 'Geolocalização indisponível', isValid: false, localNome: null });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const nearest = locaisPermitidos.find(loc => calcularDistancia(latitude, longitude, loc.latitude, loc.longitude) <= loc.raio_metros);
        resolve({ latitude, longitude, endereco: nearest ? nearest.nome : 'Localização atual', isValid: !!nearest, localNome: nearest?.nome || null });
      },
      () => resolve({ latitude: 0, longitude: 0, endereco: 'Localização não obtida', isValid: false, localNome: null }),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  const handleRegistro = async (tipo: typeof nextAction) => {
    if (!user) { toast({ title: 'Erro', description: 'Faça login para registrar o ponto', variant: 'destructive' }); return; }
    setIsLoading(true);
    setPendingAction(tipo);
    const loc = await getGeolocation();
    setLocation(loc);
    setIsLoading(false);
    setShowConfirmDialog(true);
  };

  const confirmRegistro = async () => {
    if (!location || !pendingAction) return;
    setIsLoading(true);
    const result = await registrarPonto(pendingAction, location.latitude, location.longitude, location.endereco);
    setIsLoading(false);
    const labels: Record<string, string> = { entrada: '✅ Entrada registrada!', saida: '✅ Saída registrada!', intervalo_inicio: '☕ Intervalo iniciado!', intervalo_fim: '✅ Intervalo encerrado!' };
    if (result.success) {
      toast({ title: labels[pendingAction] || 'Registrado!', description: `Horário: ${format(currentTime, 'HH:mm')} • ${location.endereco}` });
    } else {
      toast({ title: 'Erro ao registrar ponto', description: result.error, variant: 'destructive' });
    }
    setShowConfirmDialog(false);
    setPendingAction(null);
    setLocation(null);
  };

  const actionLabels: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
    entrada: { label: 'Entrada', icon: <Navigation className="w-5 h-5" />, color: 'bg-finance hover:bg-finance/90 text-primary-foreground' },
    intervalo_inicio: { label: 'Iniciar Intervalo', icon: <Coffee className="w-5 h-5" />, color: 'bg-projects hover:bg-projects-dark text-primary-foreground' },
    intervalo_fim: { label: 'Fim Intervalo', icon: <Coffee className="w-5 h-5" />, color: 'bg-finance hover:bg-finance/90 text-primary-foreground' },
    saida: { label: 'Saída', icon: <LogOut className="w-5 h-5" />, color: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' },
  };
  const actionConfig = actionLabels[nextAction];

  if (!user) return <Card className="p-6 text-center"><p className="text-muted-foreground">Faça login para registrar o ponto</p></Card>;

  return (
    <>
      <Card className="relative overflow-hidden border-0 shadow-elevated">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        <div className="relative p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2"><Clock className="w-4 h-4 text-primary" />Registro de Ponto</h3>
              <p className="text-xs text-muted-foreground">{format(currentTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
            </div>
            <Badge variant={nextAction === 'entrada' ? 'default' : 'secondary'} className="animate-pulse text-xs">
              {nextAction === 'entrada' && '📍 Aguardando entrada'}
              {nextAction === 'intervalo_inicio' && '☕ Intervalo pendente'}
              {nextAction === 'intervalo_fim' && '⏰ Em intervalo'}
              {nextAction === 'saida' && '🚪 Aguardando saída'}
            </Badge>
          </div>

          <div className="flex flex-col items-center gap-2">
            <JornadaProgress workedMinutes={workedMinutes} />
            <p className="text-4xl font-display font-bold text-foreground tabular-nums">{format(currentTime, 'HH:mm:ss')}</p>
          </div>

          <Button size="lg" onClick={() => handleRegistro(nextAction)} disabled={isLoading}
            className={`w-full h-14 text-base font-semibold gap-2 ${actionConfig.color}`}>
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : actionConfig.icon}{actionConfig.label}
          </Button>

          {batidasHoje.length > 0 && (
            <div className="pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Batidas de hoje</p>
              <div className="flex flex-wrap gap-2">
                {batidasHoje.map((batida) => {
                  const isEntrada = batida.tipo === 'entrada' || batida.tipo === 'intervalo_fim';
                  const isInterval = batida.tipo === 'intervalo_inicio' || batida.tipo === 'intervalo_fim';
                  return (
                    <div key={batida.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                      isInterval ? 'bg-projects/10 text-projects-dark' : isEntrada ? 'bg-finance/10 text-finance' : 'bg-destructive/10 text-destructive'}`}>
                      {batida.tipo === 'entrada' && '→'}{batida.tipo === 'saida' && '←'}{batida.tipo === 'intervalo_inicio' && '☕'}{batida.tipo === 'intervalo_fim' && '▶'}
                      {' '}{format(new Date(batida.data_hora), 'HH:mm')}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {location?.isValid ? <CheckCircle className="w-5 h-5 text-finance" /> : <MapPin className="w-5 h-5 text-destructive" />}
              Confirmar {actionLabels[pendingAction || 'entrada']?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center py-4 bg-muted/50 rounded-lg">
              <p className="text-4xl font-display font-bold text-foreground">{format(currentTime, 'HH:mm')}</p>
              <p className="text-sm text-muted-foreground">{format(currentTime, 'dd/MM/yyyy')}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <MapPin className={`w-5 h-5 mt-0.5 ${location?.isValid ? 'text-finance' : 'text-destructive'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{location?.endereco}</p>
                  {location && location.latitude !== 0 && <p className="text-xs text-muted-foreground">{location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</p>}
                  <Badge variant="outline" className={`mt-1 ${location?.isValid ? 'text-finance border-finance/30' : 'text-destructive border-destructive/30'}`}>
                    {location?.isValid ? <><CheckCircle className="w-3 h-3 mr-1" /> Local autorizado</> : '⚠️ Fora da área permitida'}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Wifi className="w-5 h-5 text-primary" />
                <div><p className="text-sm font-medium text-foreground">App Mobile</p><p className="text-xs text-muted-foreground">Dispositivo atual</p></div>
              </div>
            </div>
            {!location?.isValid && <p className="text-xs text-center text-muted-foreground bg-destructive/10 p-2 rounded">⚠️ Registro fora da área autorizada será enviado para aprovação.</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isLoading}>Cancelar</Button>
            <Button onClick={confirmRegistro} disabled={isLoading}
              className={pendingAction === 'entrada' || pendingAction === 'intervalo_fim' ? 'bg-finance hover:bg-finance/90' : ''}
              variant={pendingAction === 'saida' ? 'destructive' : 'default'}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
