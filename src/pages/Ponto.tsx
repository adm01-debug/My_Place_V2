import { useState, useMemo } from 'react';
import { Clock, AlertTriangle, CheckCircle, TrendingUp, FileText, Upload, X, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/portal/PageLayout';
import { RegistroPonto } from '@/components/portal/RegistroPonto';
import { HistoricoPonto } from '@/components/portal/HistoricoPonto';
import { StatCardSkeleton, ListItemSkeleton } from '@/components/portal/Skeletons';
import { useLoadingState } from '@/hooks/useLoadingState';
import { useRegistrosPonto } from '@/hooks/useRegistrosPonto';
import { useJustificativasPonto } from '@/hooks/useJustificativasPonto';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusConfig = {
  ok: { icon: CheckCircle, color: 'text-finance', bg: 'bg-finance-light', label: 'OK' },
  atraso: { icon: AlertTriangle, color: 'text-projects', bg: 'bg-projects-light', label: 'Atraso' },
  extra: { icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10', label: 'Extra' },
  falta: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Falta' },
  pendente: { icon: Clock, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Pendente' },
  justificado: { icon: FileText, color: 'text-primary', bg: 'bg-primary/10', label: 'Justificado' },
};

type TipoJustificativa = 'atestado' | 'falta_justificada' | 'atraso' | 'saida_antecipada' | 'esquecimento' | 'outros';

const tipoLabels: Record<TipoJustificativa, string> = {
  atestado: 'Atestado médico',
  falta_justificada: 'Falta justificada',
  atraso: 'Atraso',
  saida_antecipada: 'Saída antecipada',
  esquecimento: 'Esquecimento de registro',
  outros: 'Outros',
};

export default function Ponto() {
  const [showJustificativa, setShowJustificativa] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [tipoJustificativa, setTipoJustificativa] = useState<TipoJustificativa | ''>('');
  const [motivoDescricao, setMotivoDescricao] = useState('');
  const [anexoFile, setAnexoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isLoading = useLoadingState(600);
  const { registros, isLoading: isLoadingRegistros, refetch } = useRegistrosPonto();
  const { justificativas, criarJustificativa, uploadAnexo, getJustificativaPorData, refetch: refetchJustificativas } = useJustificativasPonto();
  const { toast } = useToast();

  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate statistics from real data
  const stats = useMemo(() => {
    let totalMinutes = 0;
    let extraMinutes = 0;
    const DAILY_TARGET = 8 * 60; // 8 hours in minutes

    // Group registros by day
    const registrosPorDia = registros.reduce((acc, reg) => {
      const dateKey = format(new Date(reg.data_hora), 'yyyy-MM-dd');
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(reg);
      return acc;
    }, {} as Record<string, typeof registros>);

    // Calculate hours for each day
    Object.values(registrosPorDia).forEach(dayRegs => {
      const entradas = dayRegs.filter(r => r.tipo === 'entrada').sort((a, b) => 
        new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()
      );
      const saidas = dayRegs.filter(r => r.tipo === 'saida').sort((a, b) => 
        new Date(a.data_hora).getTime() - new Date(b.data_hora).getTime()
      );

      for (let i = 0; i < entradas.length; i++) {
        const entrada = new Date(entradas[i].data_hora);
        const saida = saidas[i] ? new Date(saidas[i].data_hora) : null;
        
        if (saida) {
          const dayMinutes = (saida.getTime() - entrada.getTime()) / 60000;
          totalMinutes += dayMinutes;
        }
      }
    });

    // Calculate extra hours (anything over 8h per day, simplified)
    const daysWorked = Object.keys(registrosPorDia).length;
    const expectedMinutes = daysWorked * DAILY_TARGET;
    extraMinutes = Math.max(0, totalMinutes - expectedMinutes);

    const formatHours = (mins: number) => {
      const h = Math.floor(mins / 60);
      const m = Math.floor(mins % 60);
      return `${h}:${String(m).padStart(2, '0')}`;
    };

    return {
      horasNormais: formatHours(Math.min(totalMinutes, daysWorked * DAILY_TARGET)),
      horasExtras: formatHours(extraMinutes),
      bancoHoras: extraMinutes > 0 ? `+${formatHours(extraMinutes)}` : '0:00',
    };
  }, [registros]);

  // Generate espelho data from registros
  const espelhoDias = useMemo(() => {
    const today = new Date();
    
    return daysInMonth
      .filter(day => day <= today)
      .map(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const dayRegs = registros.filter(r => 
          format(new Date(r.data_hora), 'yyyy-MM-dd') === dateKey
        );
        
        const isWeekendDay = isWeekend(day);
        const entradas = dayRegs.filter(r => r.tipo === 'entrada');
        const saidas = dayRegs.filter(r => r.tipo === 'saida');
        
        // Check if there's a justificativa for this day
        const justificativa = getJustificativaPorData(dateKey);
        
        let status: keyof typeof statusConfig = 'pendente';
        let totalHoras = '0:00';
        
        if (justificativa) {
          status = 'justificado';
        } else if (isWeekendDay) {
          status = dayRegs.length > 0 ? 'extra' : 'ok';
        } else if (dayRegs.length === 0) {
          status = isSameDay(day, today) ? 'pendente' : 'falta';
        } else {
          // Calculate total hours
          let totalMinutes = 0;
          for (let i = 0; i < entradas.length; i++) {
            const entrada = new Date(entradas[i].data_hora);
            const saida = saidas[i] ? new Date(saidas[i].data_hora) : (isSameDay(day, today) ? new Date() : null);
            if (saida) {
              totalMinutes += (saida.getTime() - entrada.getTime()) / 60000;
            }
          }
          
          const h = Math.floor(totalMinutes / 60);
          const m = Math.floor(totalMinutes % 60);
          totalHoras = `${h}:${String(m).padStart(2, '0')}`;
          
          if (totalMinutes >= 8 * 60) {
            status = totalMinutes > 8 * 60 ? 'extra' : 'ok';
          } else if (totalMinutes > 0) {
            status = entradas.length > saidas.length ? 'pendente' : 'atraso';
          }
        }
        
        return {
          data: day,
          dateKey,
          status,
          totalHoras,
          batidas: dayRegs.map(r => ({
            horario: format(new Date(r.data_hora), 'HH:mm'),
            tipo: r.tipo,
          })),
          isWeekend: isWeekendDay,
          justificativa,
        };
      })
      .reverse();
  }, [daysInMonth, registros, justificativas, getJustificativaPorData]);

  const diaSemana = (date: Date) => {
    return format(date, 'EEE', { locale: ptBR }).toUpperCase();
  };

  const handleJustificar = (date: Date) => {
    setSelectedDate(date);
    setTipoJustificativa('');
    setMotivoDescricao('');
    setAnexoFile(null);
    setShowJustificativa(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo é 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setAnexoFile(file);
  };

  const handleSubmitJustificativa = async () => {
    if (!selectedDate || !tipoJustificativa || !motivoDescricao.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o tipo e a descrição.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let anexoUrl: string | null = null;
      
      if (anexoFile) {
        anexoUrl = await uploadAnexo(anexoFile);
      }

      const dataFormatted = format(selectedDate, 'yyyy-MM-dd');
      const result = await criarJustificativa(
        dataFormatted,
        tipoJustificativa,
        motivoDescricao,
        undefined,
        anexoUrl || undefined
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: 'Justificativa enviada',
        description: 'Sua justificativa será analisada pelo RH.',
      });

      setShowJustificativa(false);
      setTipoJustificativa('');
      setMotivoDescricao('');
      setAnexoFile(null);
      refetchJustificativas();
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar justificativa',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendencias = espelhoDias.filter(d => d.status === 'falta');

  if (isLoading || isLoadingRegistros) {
    return (
      <PageLayout title="Meu Ponto" showBack>
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(i => <ListItemSkeleton key={i} />)}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Meu Ponto" showBack onRefresh={refetch}>
      <div className="space-y-6 animate-fade-in-up">
        {/* Registro de Ponto */}
        <RegistroPonto />

        {/* Período */}
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            {format(currentMonth, 'MMMM/yyyy', { locale: ptBR }).toUpperCase()}
          </p>
        </div>

        {/* Resumo */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Resumo do Mês
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Normal</p>
              <p className="text-lg font-bold text-foreground">{stats.horasNormais}</p>
              <p className="text-xs text-muted-foreground">/176h</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Extras</p>
              <p className="text-lg font-bold text-primary">{stats.horasExtras}</p>
              <p className="text-xs text-muted-foreground">50%</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Banco</p>
              <p className="text-lg font-bold text-finance">{stats.bancoHoras}</p>
              <p className="text-xs text-muted-foreground">saldo</p>
            </Card>
          </div>
        </div>

        {/* Pendências */}
        {pendencias.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              Pendências ({pendencias.length})
            </h3>
            {pendencias.slice(0, 3).map((dia) => (
              <Card key={dia.data.toString()} className="p-4 border-l-4 border-l-destructive bg-destructive/5 mb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {format(dia.data, 'dd/MM')} ({diaSemana(dia.data)})
                    </p>
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
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            Espelho de Ponto
          </h3>
          <div className="space-y-2">
            {espelhoDias.slice(0, 10).map((dia) => {
              const config = statusConfig[dia.status];
              const Icon = config.icon;
              const isToday = isSameDay(dia.data, new Date());
              
              return (
                <Card 
                  key={dia.data.toString()} 
                  className={`p-3 ${isToday ? 'ring-2 ring-primary' : ''} ${dia.isWeekend ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bg}`}>
                        <Icon className={`w-4 h-4 ${config.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground text-sm">
                            {format(dia.data, 'dd/MM')} ({diaSemana(dia.data)})
                          </p>
                          {isToday && (
                            <Badge variant="outline" className="text-xs">HOJE</Badge>
                          )}
                          {dia.isWeekend && (
                            <Badge variant="secondary" className="text-xs">FDS</Badge>
                          )}
                          {dia.justificativa && (
                            <Badge 
                              variant={dia.justificativa.status === 'aprovado' ? 'default' : 'secondary'} 
                              className="text-xs"
                            >
                              {dia.justificativa.status === 'pendente' ? 'Aguardando' : 
                               dia.justificativa.status === 'aprovado' ? 'Aprovado' : 'Rejeitado'}
                            </Badge>
                          )}
                        </div>
                        {dia.batidas.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {dia.batidas.map(b => b.horario).join(' | ')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${config.color}`}>
                        {dia.totalHoras !== '0:00' ? dia.totalHoras : '-'}
                      </p>
                    </div>
                  </div>
                  {dia.status === 'falta' && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full mt-2 text-xs"
                      onClick={() => handleJustificar(dia.data)}
                    >
                      <FileText className="w-3 h-3 mr-1" /> Justificar
                    </Button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Banco de Horas */}
        <Card className="p-4 bg-finance-light/50">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            Banco de Horas
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-finance">{stats.bancoHoras}</p>
              <p className="text-xs text-muted-foreground">Saldo atual</p>
            </div>
            <HistoricoPonto />
          </div>
        </Card>
      </div>

      {/* Modal Justificativa Funcional */}
      <Dialog open={showJustificativa} onOpenChange={setShowJustificativa}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Justificar Ausência
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Data</p>
              <p className="font-medium">
                {selectedDate && format(selectedDate, "dd/MM/yyyy (EEEE)", { locale: ptBR })}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Justificativa *</Label>
              <Select 
                value={tipoJustificativa} 
                onValueChange={(v) => setTipoJustificativa(v as TipoJustificativa)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(tipoLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descrição / Motivo *</Label>
              <Textarea 
                placeholder="Descreva detalhadamente o motivo..."
                value={motivoDescricao}
                onChange={(e) => setMotivoDescricao(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Anexo (atestado, comprovante)</Label>
              {anexoFile ? (
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm flex-1 truncate">{anexoFile.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setAnexoFile(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*,.pdf"
                    onChange={handleFileSelect}
                  />
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Clique para anexar arquivo
                  </span>
                </label>
              )}
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: imagens, PDF. Máximo 5MB.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowJustificativa(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmitJustificativa}
              disabled={isSubmitting || !tipoJustificativa || !motivoDescricao.trim()}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-1" />
              )}
              {isSubmitting ? 'Enviando...' : 'Enviar'}
            </Button>
          </DialogFooter>
          <p className="text-xs text-muted-foreground text-center">
            Será enviado para aprovação do seu gestor
          </p>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
