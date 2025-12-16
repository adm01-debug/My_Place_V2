import { useState, useEffect } from 'react';
import { MapPin, Clock, CheckCircle, Loader2, Navigation, Wifi } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

interface Batida {
  tipo: 'entrada' | 'saida';
  horario: string;
  localizacao: {
    latitude: number;
    longitude: number;
    endereco: string;
  };
  dispositivo: string;
}

// Simulated company locations
const locaisPermitidos = [
  { nome: 'Sede Principal', lat: -23.5505, lng: -46.6333, raio: 100 },
  { nome: 'Filial Centro', lat: -23.5489, lng: -46.6388, raio: 50 },
];

// Simulate geolocation
const simulateGeolocation = () => {
  // Randomly decide if user is at valid location (80% chance)
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
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<'entrada' | 'saida' | null>(null);
  const [location, setLocation] = useState<ReturnType<typeof simulateGeolocation> | null>(null);
  const [batidas, setBatidas] = useState<Batida[]>([
    {
      tipo: 'entrada',
      horario: '08:02',
      localizacao: { latitude: -23.5505, longitude: -46.6333, endereco: 'Sede Principal - São Paulo, SP' },
      dispositivo: 'App Mobile',
    },
    {
      tipo: 'saida',
      horario: '12:01',
      localizacao: { latitude: -23.5505, longitude: -46.6333, endereco: 'Sede Principal - São Paulo, SP' },
      dispositivo: 'App Mobile',
    },
    {
      tipo: 'entrada',
      horario: '13:00',
      localizacao: { latitude: -23.5505, longitude: -46.6333, endereco: 'Sede Principal - São Paulo, SP' },
      dispositivo: 'App Mobile',
    },
  ]);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine next action
  const nextAction = batidas.length % 2 === 0 ? 'entrada' : 'saida';
  const lastBatida = batidas[batidas.length - 1];

  const handleRegistro = async (tipo: 'entrada' | 'saida') => {
    setIsLoading(true);
    setPendingAction(tipo);
    
    // Simulate getting location
    await new Promise(resolve => setTimeout(resolve, 1500));
    const loc = simulateGeolocation();
    setLocation(loc);
    setIsLoading(false);
    setShowConfirmDialog(true);
  };

  const confirmRegistro = () => {
    if (!location || !pendingAction) return;

    const novaBatida: Batida = {
      tipo: pendingAction,
      horario: format(currentTime, 'HH:mm'),
      localizacao: {
        latitude: location.latitude,
        longitude: location.longitude,
        endereco: location.endereco,
      },
      dispositivo: 'App Mobile',
    };

    setBatidas([...batidas, novaBatida]);
    setShowConfirmDialog(false);
    setPendingAction(null);
    setLocation(null);

    toast({
      title: pendingAction === 'entrada' ? '✅ Entrada registrada!' : '✅ Saída registrada!',
      description: `Horário: ${novaBatida.horario} • ${location.endereco}`,
    });
  };

  const calculateWorkedHours = () => {
    if (batidas.length < 2) return '0:00';
    
    let totalMinutes = 0;
    for (let i = 0; i < batidas.length - 1; i += 2) {
      const entrada = batidas[i];
      const saida = batidas[i + 1];
      if (entrada && saida) {
        const [hIn, mIn] = entrada.horario.split(':').map(Number);
        const [hOut, mOut] = saida.horario.split(':').map(Number);
        totalMinutes += (hOut * 60 + mOut) - (hIn * 60 + mIn);
      }
    }
    
    // If currently clocked in, add time until now
    if (batidas.length % 2 === 1) {
      const lastEntrada = batidas[batidas.length - 1];
      const [hIn, mIn] = lastEntrada.horario.split(':').map(Number);
      const now = currentTime;
      totalMinutes += (now.getHours() * 60 + now.getMinutes()) - (hIn * 60 + mIn);
    }

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hours}:${String(mins).padStart(2, '0')}`;
  };

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
          {batidas.length > 0 && (
            <div className="pt-3 border-t border-border/50">
              <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">Batidas de hoje</p>
              <div className="flex flex-wrap gap-2">
                {batidas.map((batida, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                      batida.tipo === 'entrada' 
                        ? 'bg-finance/10 text-finance' 
                        : 'bg-destructive/10 text-destructive'
                    }`}
                  >
                    {batida.tipo === 'entrada' ? '→' : '←'} {batida.horario}
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
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={confirmRegistro}
              className={pendingAction === 'entrada' ? 'bg-finance hover:bg-finance/90' : ''}
              variant={pendingAction === 'saida' ? 'destructive' : 'default'}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
