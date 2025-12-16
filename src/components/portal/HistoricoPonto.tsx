import { useState } from 'react';
import { MapPin, Clock, Calendar, ChevronRight, Navigation, Building2, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRegistrosPonto } from '@/hooks/useRegistrosPonto';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

interface RegistroHistorico {
  id: string;
  data_hora: string;
  tipo: 'entrada' | 'saida' | 'intervalo_inicio' | 'intervalo_fim';
  latitude: number | null;
  longitude: number | null;
  endereco: string | null;
  status: 'aprovado' | 'pendente' | 'rejeitado' | 'fora_area';
  observacao: string | null;
}

// Simulated map component
function MapaSimulado({ registros }: { registros: RegistroHistorico[] }) {
  const registrosComLocalizacao = registros.filter(r => r.latitude && r.longitude);
  
  const locaisUnicos = registrosComLocalizacao.reduce((acc, reg) => {
    if (!reg.latitude || !reg.longitude) return acc;
    const key = `${reg.latitude.toFixed(4)},${reg.longitude.toFixed(4)}`;
    if (!acc[key]) {
      acc[key] = {
        latitude: reg.latitude,
        longitude: reg.longitude,
        endereco: reg.endereco || 'Local desconhecido',
        local: reg.endereco?.includes('Sede') ? 'Sede Principal' : 'Externo',
        count: 1,
        tipos: [reg.tipo],
      };
    } else {
      acc[key].count++;
      if (!acc[key].tipos.includes(reg.tipo)) {
        acc[key].tipos.push(reg.tipo);
      }
    }
    return acc;
  }, {} as Record<string, { latitude: number; longitude: number; endereco: string; local: string; count: number; tipos: string[] }>);

  if (Object.keys(locaisUnicos).length === 0) {
    return (
      <div className="w-full h-64 bg-muted/30 rounded-xl flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Nenhum registro com localização</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-64 bg-muted/30 rounded-xl overflow-hidden">
      {/* Grid pattern to simulate map */}
      <div className="absolute inset-0 opacity-20">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Simulated map markers */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-full h-full p-8">
          {Object.values(locaisUnicos).map((local, index) => {
            const isMain = local.local === 'Sede Principal';
            const x = isMain ? 50 : 30 + index * 20;
            const y = isMain ? 50 : 40 + index * 15;
            
            return (
              <div
                key={index}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 animate-fade-in"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <div className="relative group cursor-pointer">
                  {/* Pulse effect */}
                  <div className={`absolute inset-0 rounded-full animate-ping opacity-30 ${isMain ? 'bg-primary' : 'bg-projects'}`} />
                  
                  {/* Marker */}
                  <div className={`relative w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                    isMain ? 'bg-primary text-primary-foreground' : 'bg-projects text-white'
                  }`}>
                    {isMain ? (
                      <Building2 className="w-5 h-5" />
                    ) : (
                      <MapPin className="w-5 h-5" />
                    )}
                  </div>
                  
                  {/* Count badge */}
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-finance text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {local.count}
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-card border border-border rounded-lg shadow-lg p-2 whitespace-nowrap text-xs">
                      <p className="font-semibold text-foreground">{local.local}</p>
                      <p className="text-muted-foreground">{local.count} registros</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-card/80 backdrop-blur-sm px-2 py-1 rounded">
          <div className="w-3 h-3 rounded-full bg-primary" />
          Sede
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-card/80 backdrop-blur-sm px-2 py-1 rounded">
          <div className="w-3 h-3 rounded-full bg-projects" />
          Externo
        </div>
      </div>
    </div>
  );
}

function RegistroItem({ registro }: { registro: RegistroHistorico }) {
  const statusConfig = {
    aprovado: { icon: CheckCircle, color: 'text-finance', bg: 'bg-finance/10', label: 'Aprovado' },
    pendente: { icon: Clock, color: 'text-projects', bg: 'bg-projects/10', label: 'Pendente' },
    rejeitado: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Rejeitado' },
    fora_area: { icon: MapPin, color: 'text-projects', bg: 'bg-projects/10', label: 'Fora da área' },
  };

  const tipoLabels = {
    entrada: 'Entrada',
    saida: 'Saída',
    intervalo_inicio: 'Início Intervalo',
    intervalo_fim: 'Fim Intervalo',
  };

  const config = statusConfig[registro.status];
  const StatusIcon = config.icon;
  const isEntrada = registro.tipo === 'entrada' || registro.tipo === 'intervalo_fim';

  return (
    <Card className="p-3 border-0 shadow-card">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          isEntrada ? 'bg-finance/10' : 'bg-destructive/10'
        }`}>
          {isEntrada ? (
            <Navigation className="w-5 h-5 text-finance" />
          ) : (
            <MapPin className="w-5 h-5 text-destructive" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">
                {format(new Date(registro.data_hora), 'HH:mm')}
              </span>
              <Badge variant="outline" className={`text-xs ${isEntrada ? 'border-finance/30 text-finance' : 'border-destructive/30 text-destructive'}`}>
                {tipoLabels[registro.tipo]}
              </Badge>
            </div>
            <div className={`flex items-center gap-1 text-xs ${config.color}`}>
              <StatusIcon className="w-3 h-3" />
              {config.label}
            </div>
          </div>
          
          <div className="mt-1 space-y-1">
            {registro.endereco && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {registro.endereco}
              </p>
            )}
            {registro.latitude && registro.longitude && (
              <p className="text-xs text-muted-foreground">
                {registro.latitude.toFixed(6)}, {registro.longitude.toFixed(6)}
              </p>
            )}
            {registro.observacao && (
              <p className="text-xs text-muted-foreground italic">
                {registro.observacao}
              </p>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export function HistoricoPonto() {
  const [selectedTab, setSelectedTab] = useState('lista');
  const { registros, isLoading } = useRegistrosPonto();

  // Group by date
  const registrosPorData = registros.reduce((acc, reg) => {
    const dateKey = format(new Date(reg.data_hora), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(reg);
    return acc;
  }, {} as Record<string, RegistroHistorico[]>);

  const totalRegistros = registros.length;
  const registrosAprovados = registros.filter(r => r.status === 'aprovado').length;
  const registrosForaArea = registros.filter(r => r.status === 'fora_area' || r.status === 'pendente').length;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full gap-2">
          <Clock className="w-4 h-4" />
          Ver Histórico Completo
          <ChevronRight className="w-4 h-4 ml-auto" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Histórico de Registros
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <Card className="p-3 text-center border-0 shadow-card">
                <p className="text-2xl font-bold text-foreground">{totalRegistros}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </Card>
              <Card className="p-3 text-center border-0 shadow-card">
                <p className="text-2xl font-bold text-finance">{registrosAprovados}</p>
                <p className="text-xs text-muted-foreground">Aprovados</p>
              </Card>
              <Card className="p-3 text-center border-0 shadow-card">
                <p className="text-2xl font-bold text-projects">{registrosForaArea}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </Card>
            </div>

            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1">
              <TabsList className="w-full mb-4">
                <TabsTrigger value="lista" className="flex-1">Lista</TabsTrigger>
                <TabsTrigger value="mapa" className="flex-1">Mapa</TabsTrigger>
              </TabsList>

              <TabsContent value="mapa" className="mt-0">
                <MapaSimulado registros={registros} />
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Visualização dos locais de registro
                </p>
              </TabsContent>

              <TabsContent value="lista" className="mt-0">
                {registros.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">Nenhum registro encontrado</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Seus registros de ponto aparecerão aqui
                    </p>
                  </div>
                ) : (
                  <ScrollArea className="h-[calc(85vh-280px)]">
                    <div className="space-y-4 pr-4">
                      {Object.entries(registrosPorData)
                        .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                        .map(([dateKey, regs]) => (
                        <div key={dateKey}>
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span className="text-sm font-semibold text-foreground">
                              {format(new Date(dateKey), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                            </span>
                          </div>
                          <div className="space-y-2 ml-6">
                            {regs
                              .sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime())
                              .map((registro) => (
                              <RegistroItem key={registro.id} registro={registro} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
