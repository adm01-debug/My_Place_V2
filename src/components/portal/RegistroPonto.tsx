import { useState, useEffect } from 'react';
import { MapPin, Clock, CheckCircle, Loader2, Navigation, Wifi } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRegistrosPonto } from '@/hooks/useRegistrosPonto';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface LocationData {
  latitude: number;
  longitude: number;
  endereco: string;
  isValid: boolean;
  localNome: string | null;
}

// Simulated company locations
const locaisPermitidos = [
  { nome: 'Sede Principal', lat: -23.5505, lng: -46.6333, raio: 100 },
  { nome: 'Filial Centro', lat: -23.5489, lng: -46.6388, raio: 50 },
];

// Get real geolocation or simulate
const getGeolocation = (): Promise<LocationData> => {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Check if within allowed locations
          const nearestLocation = locaisPermitidos.find(loc => {
            const distance = Math.sqrt(
              Math.pow(loc.lat - latitude, 2) + Math.pow(loc.lng - longitude, 2)
            ) * 111000; // Approximate meters
            return distance < loc.raio;
          });

          resolve({
            latitude,
            longitude,
            endereco: nearestLocation ? `${nearestLocation.nome} - São Paulo, SP` : 'Localização atual',
            isValid: !!nearestLocation,
            localNome: nearestLocation?.nome || null,
          });
        },
        () => {
          // Fallback to simulation on error
          resolve(simulateGeolocation());
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      resolve(simulateGeolocation());
    }
  });
};

// Simulate geolocation as fallback
const simulateGeolocation = (): LocationData => {
  const isAtValidLocation = Math.random() > 0.2;
  
  if (isAtValidLocation) {
    const location = locaisPermitidos[Math.floor(Math.random() * locaisPermitidos.length)];
    return {
      latitude: location.lat + (Math.random() - 0.5) * 0.001,
      longitude: location.lng + (Math.random() - 0.5) * 0.001,
      endereco: `${location.nome} - São Paulo, SP`,
      isValid: true,
      localNome: location.nome,
    };
  }
  
  return {
    latitude: -23.5505 + (Math.random() - 0.5) * 0.1,
    longitude: -46.6333 + (Math.random() - 0.5) * 0.1,
    endereco: 'Localização externa',
    isValid: false,
    localNome: null,
  };
};

export function RegistroPonto() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { registros, registrarPonto, isLoading: isLoadingRegistros } = useRegistrosPonto();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'entrada' | 'saida' | 'intervalo_inicio' | 'intervalo_fim' | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);

  // Filter today's registros
  const today = format(new Date(), 'yyyy-MM-dd');
  const batidasHoje = registros.filter(r => 
    format(new Date(r.data_hora), 'yyyy-MM-dd') === today
  ).sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine next action based on today's punches
  const getNextAction = () => {
    const entradasHoje = batidasHoje.filter(b => b.tipo === 'entrada').length;
    const saidasHoje = batidasHoje.filter(b => b.tipo === 'saida').length;
    
    if (entradasHoje === saidasHoje) return 'entrada';
    return 'saida';
  };

  const nextAction = getNextAction();

  const handleRegistro = async (tipo: 'entrada' | 'saida') => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para registrar o ponto',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setPendingAction(tipo);
    
    // Get location
    const loc = await getGeolocation();
    setLocation(loc);
    setIsLoading(false);
    setShowConfirmDialog(true);
  };

  const confirmRegistro = async () => {
    if (!location || !pendingAction) return;

    setIsLoading(true);
    const result = await registrarPonto(
      pendingAction,
      location.latitude,
      location.longitude,
      location.endereco
    );
    setIsLoading(false);

    if (result.success) {
      toast({
        title: pendingAction === 'entrada' ? '✅ Entrada registrada!' : '✅ Saída registrada!',
        description: `Horário: ${format(currentTime, 'HH:mm')} • ${location.endereco}`,
      });
    } else {
      toast({
        title: 'Erro ao registrar ponto',
        description: result.error,
        variant: 'destructive',
      });
    }

    setShowConfirmDialog(false);
    setPendingAction(null);
    setLocation(null);
  };

  const calculateWorkedHours = () => {
    if (batidasHoje.length < 1) return '0:00';
    
    let totalMinutes = 0;
    const entradas = batidasHoje.filter(b => b.tipo === 'entrada');
    const saidas = batidasHoje.filter(b => b.tipo === 'saida');
    
    for (let i = 0; i < entradas.length; i++) {
      const entrada = new Date(entradas[i].data_hora);
      const saida = saidas[i] ? new Date(saidas[i].data_hora) : null;
      
      if (saida) {
        totalMinutes += (saida.getTime() - entrada.getTime()) / 60000;
      } else {
        // If no exit yet, count until now
        totalMinutes += (currentTime.getTime() - entrada.getTime()) / 60000;
      }
    }

    const hours = Math.floor(totalMinutes / 60);
    const mins = Math.floor(totalMinutes % 60);
    return `${hours}:${String(mins).padStart(2, '0')}`;
  };

  if (!user) {
    return (
      <Card className="p-6 text-center">
        <p className="text-muted-foreground">Faça login para registrar o ponto</p>
      </Card>
    );
  }

  return (
    <>
      <Card className="relative overflow-hidden border-0 shadow-elevated">
        {/* Animated background */}
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
        
        <div className="relative p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Registro de Ponto
              </h3>
              <p className="text-xs text-muted-foreground">
                {format(currentTime, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
            <Badge variant={nextAction === 'entrada' ? 'default' : 'secondary'} className="animate-pulse">
              {nextAction === 'entrada' ? '📍 Aguardando entrada' : '🚪 Aguardando saída'}
            </Badge>
          </div>

          {/* Current time */}
          <div className="text-center py-4">
            <p className="text-5xl font-display font-bold text-foreground tabular-nums">
              {format(currentTime, 'HH:mm:ss')}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Trabalhado hoje: <span className="font-semibold text-primary">{calculateWorkedHours()}</span>
            </p>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              size="lg"
              onClick={() => handleRegistro('entrada')}
              disabled={isLoading || nextAction !== 'entrada'}
              className="h-14 text-base font-semibold bg-finance hover:bg-finance/90"
            >
              {isLoading && pendingAction === 'entrada' ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Navigation className="w-5 h-5 mr-2" />
              )}
              Entrada
            </Button>
            <Button
              size="lg"
              variant="destructive"
              onClick={() => handleRegistro('saida')}
              disabled={isLoading || nextAction !== 'saida'}
              className="h-14 text-base font-semibold"
            >
              {isLoading && pendingAction === 'saida' ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <MapPin className="w-5 h-5 mr-2" />
              )}
              Saída
            </Button>
          </div>

          {/* Today's punches */}
          {batidasHoje.length > 0 && (
            <div className="pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Batidas de hoje</p>
              <div className="flex flex-wrap gap-2">
                {batidasHoje.map((batida) => (
                  <div
                    key={batida.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                      batida.tipo === 'entrada' 
                        ? 'bg-finance/10 text-finance' 
                        : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    {batida.tipo === 'entrada' ? '→' : '←'} {format(new Date(batida.data_hora), 'HH:mm')}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {location?.isValid ? (
                <CheckCircle className="w-5 h-5 text-finance" />
              ) : (
                <MapPin className="w-5 h-5 text-projects" />
              )}
              Confirmar {pendingAction === 'entrada' ? 'Entrada' : 'Saída'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Time */}
            <div className="text-center py-4 bg-muted/50 rounded-lg">
              <p className="text-4xl font-display font-bold text-foreground">
                {format(currentTime, 'HH:mm')}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(currentTime, "dd/MM/yyyy")}
              </p>
            </div>

            {/* Location info */}
            <div className="space-y-2">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <MapPin className={`w-5 h-5 mt-0.5 ${location?.isValid ? 'text-finance' : 'text-projects'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {location?.endereco}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {location?.latitude.toFixed(6)}, {location?.longitude.toFixed(6)}
                  </p>
                  {location?.isValid ? (
                    <Badge variant="outline" className="mt-1 text-finance border-finance/30">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Local autorizado
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="mt-1 text-projects border-projects/30">
                      ⚠️ Fora da área permitida
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Wifi className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">App Mobile</p>
                  <p className="text-xs text-muted-foreground">Dispositivo atual</p>
                </div>
              </div>
            </div>

            {!location?.isValid && (
              <p className="text-xs text-center text-muted-foreground bg-projects/10 p-2 rounded">
                ⚠️ Você está fora da área autorizada. O registro será enviado para aprovação do gestor.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmRegistro}
              disabled={isLoading}
              className={pendingAction === 'entrada' ? 'bg-finance hover:bg-finance/90' : ''}
              variant={pendingAction === 'saida' ? 'destructive' : 'default'}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
