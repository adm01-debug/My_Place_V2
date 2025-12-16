import { useState } from 'react';
import { MapPin, Clock, Calendar, ChevronRight, Navigation, Building2, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  data: Date;
  tipo: 'entrada' | 'saida';
  horario: string;
  localizacao: {
    latitude: number;
    longitude: number;
    endereco: string;
    local: string;
  };
  dispositivo: string;
  status: 'aprovado' | 'pendente' | 'rejeitado';
  dentroArea: boolean;
}

// Mock historical data
const mockHistorico: RegistroHistorico[] = [
  {
    id: '1',
    data: new Date('2025-12-16'),
    tipo: 'entrada',
    horario: '08:02',
    localizacao: { latitude: -23.5505, longitude: -46.6333, endereco: 'Av. Paulista, 1000', local: 'Sede Principal' },
    dispositivo: 'App Mobile',
    status: 'aprovado',
    dentroArea: true,
  },
  {
    id: '2',
    data: new Date('2025-12-16'),
    tipo: 'saida',
    horario: '12:01',
    localizacao: { latitude: -23.5505, longitude: -46.6333, endereco: 'Av. Paulista, 1000', local: 'Sede Principal' },
    dispositivo: 'App Mobile',
    status: 'aprovado',
    dentroArea: true,
  },
  {
    id: '3',
    data: new Date('2025-12-16'),
    tipo: 'entrada',
    horario: '13:00',
    localizacao: { latitude: -23.5505, longitude: -46.6333, endereco: 'Av. Paulista, 1000', local: 'Sede Principal' },
    dispositivo: 'App Mobile',
    status: 'aprovado',
    dentroArea: true,
  },
  {
    id: '4',
    data: new Date('2025-12-13'),
    tipo: 'entrada',
    horario: '08:00',
    localizacao: { latitude: -23.5505, longitude: -46.6333, endereco: 'Av. Paulista, 1000', local: 'Sede Principal' },
    dispositivo: 'App Mobile',
    status: 'aprovado',
    dentroArea: true,
  },
  {
    id: '5',
    data: new Date('2025-12-13'),
    tipo: 'saida',
    horario: '12:00',
    localizacao: { latitude: -23.5505, longitude: -46.6333, endereco: 'Av. Paulista, 1000', local: 'Sede Principal' },
    dispositivo: 'App Mobile',
    status: 'aprovado',
    dentroArea: true,
  },
  {
    id: '6',
    data: new Date('2025-12-13'),
    tipo: 'entrada',
    horario: '13:00',
    localizacao: { latitude: -23.5489, longitude: -46.6388, endereco: 'Rua Augusta, 500', local: 'Cliente Externo' },
    dispositivo: 'App Mobile',
    status: 'pendente',
    dentroArea: false,
  },
  {
    id: '7',
    data: new Date('2025-12-13'),
    tipo: 'saida',
    horario: '18:30',
    localizacao: { latitude: -23.5489, longitude: -46.6388, endereco: 'Rua Augusta, 500', local: 'Cliente Externo' },
    dispositivo: 'App Mobile',
    status: 'aprovado',
    dentroArea: false,
  },
  {
    id: '8',
    data: new Date('2025-12-12'),
    tipo: 'entrada',
    horario: '08:05',
    localizacao: { latitude: -23.5505, longitude: -46.6333, endereco: 'Av. Paulista, 1000', local: 'Sede Principal' },
    dispositivo: 'Relógio Ponto',
    status: 'aprovado',
    dentroArea: true,
  },
  {
    id: '9',
    data: new Date('2025-12-12'),
    tipo: 'saida',
    horario: '17:00',
    localizacao: { latitude: -23.5505, longitude: -46.6333, endereco: 'Av. Paulista, 1000', local: 'Sede Principal' },
    dispositivo: 'Relógio Ponto',
    status: 'aprovado',
    dentroArea: true,
  },
];

// Simulated map component
function MapaSimulado({ registros }: { registros: RegistroHistorico[] }) {
  const locaisUnicos = registros.reduce((acc, reg) => {
    const key = `${reg.localizacao.latitude},${reg.localizacao.longitude}`;
    if (!acc[key]) {
      acc[key] = {
        ...reg.localizacao,
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
          
          {/* Connection lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <line x1="50%" y1="50%" x2="30%" y2="40%" stroke="hsl(var(--muted-foreground))" strokeWidth="1" strokeDasharray="4" opacity="0.3" />
          </svg>
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
  };

  const config = statusConfig[registro.status];
  const StatusIcon = config.icon;

  return (
    <Card className="p-3 border-0 shadow-card">
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
          registro.tipo === 'entrada' ? 'bg-finance/10' : 'bg-destructive/10'
        }`}>
          {registro.tipo === 'entrada' ? (
            <Navigation className="w-5 h-5 text-finance" />
          ) : (
            <MapPin className="w-5 h-5 text-destructive" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{registro.horario}</span>
              <Badge variant="outline" className={`text-xs ${registro.tipo === 'entrada' ? 'border-finance/30 text-finance' : 'border-destructive/30 text-destructive'}`}>
                {registro.tipo === 'entrada' ? 'Entrada' : 'Saída'}
              </Badge>
            </div>
            <div className={`flex items-center gap-1 text-xs ${config.color}`}>
              <StatusIcon className="w-3 h-3" />
              {config.label}
            </div>
          </div>
          
          <div className="mt-1 space-y-1">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {registro.localizacao.local}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {registro.localizacao.endereco}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{registro.dispositivo}</span>
              {!registro.dentroArea && (
                <Badge variant="outline" className="text-[10px] border-projects/30 text-projects">
                  Fora da área
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function HistoricoPonto() {
  const [selectedTab, setSelectedTab] = useState('lista');

  // Group by date
  const registrosPorData = mockHistorico.reduce((acc, reg) => {
    const dateKey = format(reg.data, 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(reg);
    return acc;
  }, {} as Record<string, RegistroHistorico[]>);

  const totalRegistros = mockHistorico.length;
  const registrosAprovados = mockHistorico.filter(r => r.status === 'aprovado').length;
  const registrosForaArea = mockHistorico.filter(r => !r.dentroArea).length;

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
            <p className="text-xs text-muted-foreground">Fora área</p>
          </Card>
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="lista" className="flex-1">Lista</TabsTrigger>
            <TabsTrigger value="mapa" className="flex-1">Mapa</TabsTrigger>
          </TabsList>

          <TabsContent value="mapa" className="mt-0">
            <MapaSimulado registros={mockHistorico} />
            <p className="text-xs text-center text-muted-foreground mt-2">
              Visualização simulada dos locais de registro
            </p>
          </TabsContent>

          <TabsContent value="lista" className="mt-0">
            <ScrollArea className="h-[calc(85vh-280px)]">
              <div className="space-y-4 pr-4">
                {Object.entries(registrosPorData).map(([dateKey, registros]) => (
                  <div key={dateKey}>
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">
                        {format(new Date(dateKey), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      </span>
                    </div>
                    <div className="space-y-2 ml-6">
                      {registros.map((registro) => (
                        <RegistroItem key={registro.id} registro={registro} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
