import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Gift, Umbrella, Flag } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLayout } from '@/components/portal/PageLayout';
import { useCalendarioCorporativo } from '@/hooks/useCalendarioCorporativo';
import { AnimatePresence, motion } from 'framer-motion';
import { DiaCalendario } from '@/components/calendario/DiaCalendario';
import { EventoCard } from '@/components/calendario/EventoCard';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay,
  addMonths, subMonths, startOfWeek, endOfWeek, parseISO
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Calendario() {
  const [mesAtual, setMesAtual] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState<Date>(new Date());
  const { eventos, isLoading, refetch, getEventosDia, eventosPorTipo } = useCalendarioCorporativo(mesAtual);

  const diasDoMes = useMemo(() => {
    const inicio = startOfWeek(startOfMonth(mesAtual), { weekStartsOn: 0 });
    const fim = endOfWeek(endOfMonth(mesAtual), { weekStartsOn: 0 });
    return eachDayOfInterval({ start: inicio, end: fim });
  }, [mesAtual]);

  const eventosDoDia = useMemo(() => getEventosDia(diaSelecionado), [diaSelecionado, getEventosDia]);

  const proximosEventos = useMemo(() => {
    const hoje = new Date();
    return eventos
      .filter(e => parseISO(e.data_inicio) >= hoje)
      .sort((a, b) => parseISO(a.data_inicio).getTime() - parseISO(b.data_inicio).getTime())
      .slice(0, 5);
  }, [eventos]);

  const handleToday = () => { setMesAtual(new Date()); setDiaSelecionado(new Date()); };

  if (isLoading) {
    return (
      <PageLayout title="Calendário">
        <div className="space-y-4">
          <div className="h-12 bg-muted animate-pulse rounded-lg" />
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => <div key={i} className="h-12 bg-muted animate-pulse rounded-lg" />)}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Calendário" onRefresh={refetch}>
      <div className="space-y-4">
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

        <Card className="p-3">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => setMesAtual(subMonths(mesAtual, 1))}><ChevronLeft className="w-5 h-5" /></Button>
            <div className="text-center">
              <h2 className="text-lg font-semibold capitalize">{format(mesAtual, 'MMMM yyyy', { locale: ptBR })}</h2>
              <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={handleToday}>Hoje</Button>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setMesAtual(addMonths(mesAtual, 1))}><ChevronRight className="w-5 h-5" /></Button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
              <div key={dia} className="text-center text-xs font-medium text-muted-foreground py-1">{dia}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {diasDoMes.map(dia => (
              <DiaCalendario key={dia.toISOString()} data={dia} mesAtual={mesAtual}
                eventos={getEventosDia(dia)} isSelected={isSameDay(dia, diaSelecionado)} onSelect={() => setDiaSelecionado(dia)} />
            ))}
          </div>
        </Card>

        <Tabs defaultValue="dia" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="dia">
              {format(diaSelecionado, 'dd/MM')}
              {eventosDoDia.length > 0 && <Badge variant="secondary" className="ml-2 text-xs">{eventosDoDia.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="proximos">Próximos</TabsTrigger>
          </TabsList>

          <TabsContent value="dia" className="mt-3">
            <AnimatePresence mode="wait">
              {eventosDoDia.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Card className="p-6 text-center">
                    <CalendarIcon className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground">Nenhum evento em {format(diaSelecionado, "dd 'de' MMMM", { locale: ptBR })}</p>
                  </Card>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
                  {eventosDoDia.map(evento => <EventoCard key={evento.id} evento={evento} />)}
                </motion.div>
              )}
            </AnimatePresence>
          </TabsContent>

          <TabsContent value="proximos" className="mt-3">
            <ScrollArea className="max-h-80">
              {proximosEventos.length === 0 ? (
                <Card className="p-6 text-center">
                  <CalendarIcon className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">Nenhum evento programado</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {proximosEventos.map(evento => (
                    <div key={evento.id}>
                      <p className="text-xs text-muted-foreground mb-1 ml-1">{format(parseISO(evento.data_inicio), "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
                      <EventoCard evento={evento} />
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <Card className="p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Legenda</p>
          <div className="flex flex-wrap gap-3">
            {[['bg-red-500', 'Feriado'], ['bg-pink-500', 'Aniversário'], ['bg-teal-500', 'Férias'], ['bg-blue-500', 'Evento']].map(([cor, label]) => (
              <div key={label} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${cor}`} />
                <span className="text-xs">{label}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
