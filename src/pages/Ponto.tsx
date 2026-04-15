import { useState, useMemo } from 'react';
import type { TipoJustificativa } from '@/hooks/useJustificativasPonto';
import { FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/portal/PageLayout';
import { RegistroPonto } from '@/components/portal/RegistroPonto';
import { HistoricoPonto } from '@/components/portal/HistoricoPonto';
import { StatCardSkeleton, ListItemSkeleton } from '@/components/portal/Skeletons';
import { useLoadingState } from '@/hooks/useLoadingState';
import { useRegistrosPonto } from '@/hooks/useRegistrosPonto';
import { useJustificativasPonto } from '@/hooks/useJustificativasPonto';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isSameDay, addMonths, subMonths, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { PontoStats } from '@/components/ponto/PontoStats';
import { EspelhoDiaCard, type EspelhoDia } from '@/components/ponto/EspelhoDiaCard';
import { JustificativaDialog } from '@/components/ponto/JustificativaDialog';
import { ExportarEspelho } from '@/components/ponto/ExportarEspelho';

export default function Ponto() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showJustificativa, setShowJustificativa] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mesAtual, setMesAtual] = useState(new Date());
  const [showAllDays, setShowAllDays] = useState(false);

  const isLoading = useLoadingState(600);
  const { registros, isLoading: isLoadingRegistros, refetch } = useRegistrosPonto();
  const { justificativas, criarJustificativa, uploadAnexo, getJustificativaPorData, refetch: refetchJustificativas } = useJustificativasPonto();
  const { toast } = useToast();

  const isCurrentMonth = isSameMonth(mesAtual, new Date());
  const monthStart = startOfMonth(mesAtual);
  const monthEnd = endOfMonth(mesAtual);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handlePrevMonth = () => setMesAtual(prev => subMonths(prev, 1));
  const handleNextMonth = () => { if (!isCurrentMonth) setMesAtual(prev => addMonths(prev, 1)); };

  const stats = useMemo(() => {
    let totalMinutes = 0;
    let extraMinutes = 0;
    const DAILY_TARGET = 8 * 60;

    const mesRegistros = registros.filter(r => {
      const d = new Date(r.data_hora);
      return d >= monthStart && d <= monthEnd;
    });

    const registrosPorDia = mesRegistros.reduce((acc, reg) => {
      const dateKey = format(new Date(reg.data_hora), 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(reg);
      return acc;
    }, {} as Record<string, typeof registros>);

    Object.values(registrosPorDia).forEach(dayRegs => {
      const entradas = dayRegs.filter(r => r.tipo === 'entrada' || r.tipo === 'intervalo_fim').sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
      const saidas = dayRegs.filter(r => r.tipo === 'saida' || r.tipo === 'intervalo_inicio').sort((a, b) => new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime());
      for (let i = 0; i < entradas.length; i++) {
        const entrada = new Date(entradas[i].data_hora);
        const saida = saidas[i] ? new Date(saidas[i].data_hora) : null;
        if (saida) totalMinutes += (saida.getTime() - entrada.getTime()) / 60000;
      }
    });

    const daysWorked = Object.keys(registrosPorDia).length;
    extraMinutes = Math.max(0, totalMinutes - daysWorked * DAILY_TARGET);
    const formatHours = (mins: number) => { const h = Math.floor(mins / 60); const m = Math.floor(mins % 60); return `${h}:${String(m).padStart(2, '0')}`; };

    return {
      horasNormais: formatHours(Math.min(totalMinutes, daysWorked * DAILY_TARGET)),
      horasExtras: formatHours(extraMinutes),
      bancoHoras: extraMinutes > 0 ? `+${formatHours(extraMinutes)}` : '0:00',
      diasTrabalhados: daysWorked,
    };
  }, [registros, monthStart, monthEnd]);

  const espelhoDias: EspelhoDia[] = useMemo(() => {
    const today = new Date();
    return daysInMonth.filter(day => day <= today).map(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const dayRegs = registros.filter(r => format(new Date(r.data_hora), 'yyyy-MM-dd') === dateKey);
      const isWeekendDay = isWeekend(day);
      const entradas = dayRegs.filter(r => r.tipo === 'entrada' || r.tipo === 'intervalo_fim');
      const saidas = dayRegs.filter(r => r.tipo === 'saida' || r.tipo === 'intervalo_inicio');
      const justificativa = getJustificativaPorData(dateKey);
      let status: EspelhoDia['status'] = 'pendente';
      let totalHoras = '0:00';

      if (justificativa) { status = 'justificado'; }
      else if (isWeekendDay) { status = dayRegs.length > 0 ? 'extra' : 'ok'; }
      else if (dayRegs.length === 0) { status = isSameDay(day, today) ? 'pendente' : 'falta'; }
      else {
        let totalMinutes = 0;
        for (let i = 0; i < entradas.length; i++) {
          const entrada = new Date(entradas[i].data_hora);
          const saida = saidas[i] ? new Date(saidas[i].data_hora) : (isSameDay(day, today) ? new Date() : null);
          if (saida) totalMinutes += (saida.getTime() - entrada.getTime()) / 60000;
        }
        const h = Math.floor(totalMinutes / 60);
        const m = Math.floor(totalMinutes % 60);
        totalHoras = `${h}:${String(m).padStart(2, '0')}`;
        if (totalMinutes >= 8 * 60) { status = totalMinutes > 8 * 60 ? 'extra' : 'ok'; }
        else if (totalMinutes > 0) {
          const allEntradas = dayRegs.filter(r => r.tipo === 'entrada').length;
          const allSaidas = dayRegs.filter(r => r.tipo === 'saida').length;
          status = allEntradas > allSaidas ? 'pendente' : 'atraso';
        }
      }

      return {
        data: day, dateKey, status, totalHoras,
        batidas: dayRegs.map(r => ({ horario: format(new Date(r.data_hora), 'HH:mm'), tipo: r.tipo })),
        isWeekend: isWeekendDay, justificativa,
      };
    }).reverse();
  }, [daysInMonth, registros, justificativas, getJustificativaPorData]);

  const handleJustificar = (date: Date) => {
    setSelectedDate(date);
    setShowJustificativa(true);
  };

  const handleSubmitJustificativa = async (tipo: string, motivo: string, anexo: File | null) => {
    if (!selectedDate) return;
    setIsSubmitting(true);
    try {
      let anexoUrl: string | null = null;
      if (anexo) anexoUrl = await uploadAnexo(anexo);
      const dataFormatted = format(selectedDate, 'yyyy-MM-dd');
      const result = await criarJustificativa(dataFormatted, tipo as TipoJustificativa, motivo, undefined, anexoUrl || undefined);
      if (!result.success) throw new Error(result.error);
      toast({ title: 'Justificativa enviada', description: 'Sua justificativa será analisada pelo RH.' });
      setShowJustificativa(false);
      refetchJustificativas();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({ title: 'Erro ao enviar justificativa', description: message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendencias = espelhoDias.filter(d => d.status === 'falta');
  const INITIAL_DAYS = 15;
  const visibleDias = showAllDays ? espelhoDias : espelhoDias.slice(0, INITIAL_DAYS);

  if (isLoading || isLoadingRegistros) {
    return (
      <PageLayout title="Meu Ponto" showBack>
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3"><StatCardSkeleton /><StatCardSkeleton /><StatCardSkeleton /></div>
          <div className="space-y-2">{[1, 2, 3, 4, 5].map(i => <ListItemSkeleton key={i} />)}</div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Meu Ponto" showBack onRefresh={refetch}>
      <div className="space-y-6 animate-fade-in-up">
        <RegistroPonto />

        {/* Month Selector */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={handlePrevMonth}><ChevronLeft className="w-5 h-5" /></Button>
          <p className="text-sm font-semibold text-foreground uppercase tracking-wide">{format(mesAtual, 'MMMM yyyy', { locale: ptBR })}</p>
          <Button variant="ghost" size="icon" onClick={handleNextMonth} disabled={isCurrentMonth}><ChevronRight className="w-5 h-5" /></Button>
        </div>

        <PontoStats horasNormais={stats.horasNormais} horasExtras={stats.horasExtras} bancoHoras={stats.bancoHoras} />

        {/* Pendências */}
        {pendencias.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Pendências ({pendencias.length})</h3>
            {pendencias.slice(0, 3).map((dia) => (
              <Card key={dia.data.toString()} className="p-4 border-l-4 border-l-destructive bg-destructive/5 mb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{format(dia.data, 'dd/MM')} ({format(dia.data, 'EEE', { locale: ptBR }).toUpperCase()})</p>
                    <p className="text-sm text-muted-foreground">Ponto não registrado</p>
                  </div>
                  <Button size="sm" onClick={() => handleJustificar(dia.data)}>
                    <FileText className="w-4 h-4 mr-1" /> Justificar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Espelho de Ponto */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Espelho de Ponto</h3>
          <div className="space-y-2">
            {visibleDias.map((dia) => (
              <EspelhoDiaCard key={dia.data.toString()} dia={dia} onJustificar={handleJustificar} />
            ))}
          </div>
          {espelhoDias.length > INITIAL_DAYS && (
            <Button variant="ghost" className="w-full mt-3 text-sm" onClick={() => setShowAllDays(!showAllDays)}>
              {showAllDays ? 'Ver menos' : `Ver todos os ${espelhoDias.length} dias`}
            </Button>
          )}
        </div>

        {/* Banco de Horas */}
        <Card className="p-4 bg-finance-light/50">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">Banco de Horas</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-finance">{stats.bancoHoras}</p>
              <p className="text-xs text-muted-foreground">Saldo atual</p>
            </div>
            <HistoricoPonto />
          </div>
        </Card>

        {/* Exportar Espelho de Ponto */}
        <ExportarEspelho mes={mesAtual.getMonth() + 1} ano={mesAtual.getFullYear()} />
      </div>

      <JustificativaDialog
        open={showJustificativa}
        onOpenChange={setShowJustificativa}
        selectedDate={selectedDate}
        onSubmit={handleSubmitJustificativa}
        isSubmitting={isSubmitting}
      />
    </PageLayout>
  );
}
