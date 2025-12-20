import { useState, useMemo } from 'react';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Gift, Umbrella, 
  PartyPopper, Flag, Clock, MapPin, Video, ExternalLink, Users
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLayout } from '@/components/portal/PageLayout';
import { useCalendarioCorporativo, EventoCalendario } from '@/hooks/useCalendarioCorporativo';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
  parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

const tipoIcons: Record<string, any> = {
  feriado: Flag,
  evento: CalendarIcon,
  aniversario: Gift,
  ferias: Umbrella,
  confraternizacao: PartyPopper,
  treinamento: Users,
};

const tipoLabels: Record<string, string> = {
  feriado: 'Feriado',
  evento: 'Evento',
  aniversario: 'Aniversário',
  ferias: 'Férias',
  confraternizacao: 'Confraternização',
  treinamento: 'Treinamento',
};

interface DiaCalendarioProps {
  data: Date;
  mesAtual: Date;
  eventos: EventoCalendario[];
  isSelected: boolean;
  onSelect: () => void;
}

const DiaCalendario = ({ data, mesAtual, eventos, isSelected, onSelect }: DiaCalendarioProps) => {
  const isMesAtual = isSameMonth(data, mesAtual);
  const isHoje = isToday(data);
  const temEventos = eventos.length > 0;

  // Agrupar indicadores por tipo
  const tiposUnicos = [...new Set(eventos.map(e => e.tipo))];

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onSelect}
      className={cn(
        'relative flex flex-col items-center justify-center p-1 min-h-[48px] rounded-lg transition-all',
        isMesAtual ? 'text-foreground' : 'text-muted-foreground/40',
        isHoje && 'ring-2 ring-primary ring-offset-1 ring-offset-background',
        isSelected && 'bg-primary text-primary-foreground',
        !isSelected && temEventos && 'bg-muted/50',
        !isSelected && !temEventos && 'hover:bg-muted/30'
      )}
    >
      <span className={cn(
        'text-sm font-medium',
        isHoje && !isSelected && 'text-primary font-bold'
      )}>
        {format(data, 'd')}
      </span>
      
      {temEventos && (
        <div className="flex gap-0.5 mt-0.5">
          {tiposUnicos.slice(0, 3).map((tipo, i) => (
            <span
              key={i}
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                tipo === 'feriado' && 'bg-red-500',
                tipo === 'aniversario' && 'bg-pink-500',
                tipo === 'ferias' && 'bg-teal-500',
                tipo === 'evento' && 'bg-blue-500',
                tipo === 'confraternizacao' && 'bg-orange-500',
                tipo === 'treinamento' && 'bg-purple-500',
                isSelected && 'bg-primary-foreground'
              )}
            />
          ))}
        </div>
      )}
    </motion.button>
  );
};

interface EventoCardProps {
  evento: EventoCalendario;
}

const EventoCard = ({ evento }: EventoCardProps) => {
  const Icon = tipoIcons[evento.tipo] || CalendarIcon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card 
        className="p-3 border-l-4"
        style={{ borderLeftColor: evento.cor }}
      >
        <div className="flex items-start gap-3">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${evento.cor}20` }}
          >
            {evento.colaborador_avatar ? (
              <Avatar className="w-8 h-8">
                <AvatarImage src={evento.colaborador_avatar} />
                <AvatarFallback style={{ backgroundColor: evento.cor }} className="text-white text-xs">
                  {evento.colaborador_nome?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <Icon className="w-5 h-5" style={{ color: evento.cor }} />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-sm">{evento.titulo}</p>
                {evento.descricao && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                    {evento.descricao}
                  </p>
                )}
              </div>
              <Badge 
                variant="secondary" 
                className="text-xs shrink-0"
                style={{ backgroundColor: `${evento.cor}15`, color: evento.cor }}
              >
                {tipoLabels[evento.tipo]}
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-2">
              {evento.hora_inicio && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {evento.hora_inicio.slice(0, 5)}
                  {evento.hora_fim && ` - ${evento.hora_fim.slice(0, 5)}`}
                </span>
              )}
              {evento.local && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {evento.local}
                </span>
              )}
              {evento.online && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Video className="w-3 h-3" />
                  Online
                </span>
              )}
              {evento.data_fim && evento.data_fim !== evento.data_inicio && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CalendarIcon className="w-3 h-3" />
                  até {format(parseISO(evento.data_fim), 'dd/MM')}
                </span>
              )}
            </div>
            
            {evento.link_reuniao && (
              <Button variant="link" size="sm" className="p-0 h-auto mt-2 text-xs" asChild>
                <a href={evento.link_reuniao} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Acessar reunião
                </a>
              </Button>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export default function Calendario() {
  const [mesAtual, setMesAtual] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState<Date>(new Date());
  
  const { eventos, isLoading, refetch, getEventosDia, eventosPorTipo } = useCalendarioCorporativo(mesAtual);

  const diasDoMes = useMemo(() => {
    const inicio = startOfWeek(startOfMonth(mesAtual), { weekStartsOn: 0 });
    const fim = endOfWeek(endOfMonth(mesAtual), { weekStartsOn: 0 });
    return eachDayOfInterval({ start: inicio, end: fim });
  }, [mesAtual]);

  const eventosDoDia = useMemo(() => {
    return getEventosDia(diaSelecionado);
  }, [diaSelecionado, getEventosDia]);

  const proximosEventos = useMemo(() => {
    const hoje = new Date();
    return eventos
      .filter(e => parseISO(e.data_inicio) >= hoje)
      .sort((a, b) => parseISO(a.data_inicio).getTime() - parseISO(b.data_inicio).getTime())
      .slice(0, 5);
  }, [eventos]);

  const handlePrevMonth = () => setMesAtual(subMonths(mesAtual, 1));
  const handleNextMonth = () => setMesAtual(addMonths(mesAtual, 1));
  const handleToday = () => {
    setMesAtual(new Date());
    setDiaSelecionado(new Date());
  };

  if (isLoading) {
    return (
      <PageLayout title="Calendário">
        <div className="space-y-4">
          <div className="h-12 bg-muted animate-pulse rounded-lg" />
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Calendário" onRefresh={refetch}>
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <Card className="p-2 text-center bg-red-500/10">
            <Flag className="w-4 h-4 mx-auto text-red-500 mb-1" />
            <p className="text-lg font-bold text-red-500">{eventosPorTipo.feriado.length}</p>
            <p className="text-xs text-muted-foreground">Feriados</p>
          </Card>
          <Card className="p-2 text-center bg-pink-500/10">
            <Gift className="w-4 h-4 mx-auto text-pink-500 mb-1" />
            <p className="text-lg font-bold text-pink-500">{eventosPorTipo.aniversario.length}</p>
            <p className="text-xs text-muted-foreground">Aniversários</p>
          </Card>
          <Card className="p-2 text-center bg-teal-500/10">
            <Umbrella className="w-4 h-4 mx-auto text-teal-500 mb-1" />
            <p className="text-lg font-bold text-teal-500">{eventosPorTipo.ferias.length}</p>
            <p className="text-xs text-muted-foreground">Férias</p>
          </Card>
          <Card className="p-2 text-center bg-blue-500/10">
            <CalendarIcon className="w-4 h-4 mx-auto text-blue-500 mb-1" />
            <p className="text-lg font-bold text-blue-500">{eventosPorTipo.evento.length}</p>
            <p className="text-xs text-muted-foreground">Eventos</p>
          </Card>
        </div>

        {/* Calendar Header */}
        <Card className="p-3">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth}>
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <h2 className="text-lg font-semibold capitalize">
                {format(mesAtual, 'MMMM yyyy', { locale: ptBR })}
              </h2>
              <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={handleToday}>
                Hoje
              </Button>
            </div>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}>
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
              <div key={dia} className="text-center text-xs font-medium text-muted-foreground py-1">
                {dia}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {diasDoMes.map(dia => (
              <DiaCalendario
                key={dia.toISOString()}
                data={dia}
                mesAtual={mesAtual}
                eventos={getEventosDia(dia)}
                isSelected={isSameDay(dia, diaSelecionado)}
                onSelect={() => setDiaSelecionado(dia)}
              />
            ))}
          </div>
        </Card>

        {/* Tabs: Dia / Próximos */}
        <Tabs defaultValue="dia" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="dia">
              {format(diaSelecionado, 'dd/MM')}
              {eventosDoDia.length > 0 && (
                <Badge variant="secondary" className="ml-2 text-xs">
                  {eventosDoDia.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="proximos">Próximos</TabsTrigger>
          </TabsList>

          <TabsContent value="dia" className="mt-3">
            <AnimatePresence mode="wait">
              {eventosDoDia.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Card className="p-6 text-center">
                    <CalendarIcon className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum evento em {format(diaSelecionado, "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-2"
                >
                  {eventosDoDia.map(evento => (
                    <EventoCard key={evento.id} evento={evento} />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="proximos" className="mt-3">
            <ScrollArea className="max-h-80">
              {proximosEventos.length === 0 ? (
                <Card className="p-6 text-center">
                  <CalendarIcon className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum evento programado
                  </p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {proximosEventos.map(evento => (
                    <div key={evento.id}>
                      <p className="text-xs text-muted-foreground mb-1 ml-1">
                        {format(parseISO(evento.data_inicio), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                      </p>
                      <EventoCard evento={evento} />
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Legend */}
        <Card className="p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Legenda</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-xs">Feriado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-500" />
              <span className="text-xs">Aniversário</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
              <span className="text-xs">Férias</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-xs">Evento</span>
            </div>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
