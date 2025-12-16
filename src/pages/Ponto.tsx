import { useState } from 'react';
import { Clock, AlertTriangle, CheckCircle, TrendingUp, Calendar, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/portal/PageLayout';
import { StatCard } from '@/components/portal/StatCard';
import { StatCardSkeleton, ListItemSkeleton } from '@/components/portal/Skeletons';
import { useLoadingState } from '@/hooks/useLoadingState';
import { mockEspelhoPonto } from '@/data/mockData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const statusConfig = {
  ok: { icon: CheckCircle, color: 'text-finance', bg: 'bg-finance-light', label: 'OK' },
  atraso: { icon: AlertTriangle, color: 'text-projects', bg: 'bg-projects-light', label: 'Atraso' },
  extra: { icon: TrendingUp, color: 'text-primary', bg: 'bg-primary/10', label: 'Extra' },
  falta: { icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', label: 'Falta' },
  justificado: { icon: CheckCircle, color: 'text-muted-foreground', bg: 'bg-muted', label: 'Justificado' },
};

const tipoConfig = {
  normal: '',
  feriado: '🎉 Feriado',
  dsr: '🔵 DSR',
  ferias: '🏖️ Férias',
  afastamento: '🏥 Afastamento',
};

export default function Ponto() {
  const [showJustificativa, setShowJustificativa] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const isLoading = useLoadingState(800);
  const espelho = mockEspelhoPonto;

  const diaSemana = (date: Date) => {
    return format(date, 'EEE', { locale: ptBR }).toUpperCase();
  };

  const handleJustificar = (date: Date) => {
    setSelectedDate(date);
    setShowJustificativa(true);
  };

  const pendencias = espelho.dias.filter(d => d.status === 'falta' && !d.justificativa);

  if (isLoading) {
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
    <PageLayout title="Meu Ponto" showBack>
      <div className="space-y-6 animate-fade-in-up">
        {/* Período */}
        <div className="text-center">
          <p className="text-muted-foreground text-sm">
            {format(new Date(espelho.ano, espelho.mes - 1), 'MMMM/yyyy', { locale: ptBR }).toUpperCase()}
          </p>
        </div>

        {/* Resumo */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            📊 Resumo do Mês
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Normal</p>
              <p className="text-lg font-bold text-foreground">{espelho.horasNormais}</p>
              <p className="text-xs text-muted-foreground">/176h</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Extras</p>
              <p className="text-lg font-bold text-primary">{espelho.horasExtras50}</p>
              <p className="text-xs text-muted-foreground">50%</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-xs text-muted-foreground">Banco</p>
              <p className="text-lg font-bold text-finance">{espelho.bancoHoras}</p>
              <p className="text-xs text-muted-foreground">saldo</p>
            </Card>
          </div>
        </div>

        {/* Pendências */}
        {pendencias.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              ⚠️ Pendências ({pendencias.length})
            </h3>
            {pendencias.map((dia) => (
              <Card key={dia.data.toString()} className="p-4 border-l-4 border-l-destructive bg-destructive/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {format(dia.data, 'dd/MM')} ({diaSemana(dia.data)})
                    </p>
                    <p className="text-sm text-muted-foreground">Ponto não batido</p>
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
            📅 Espelho de Ponto
          </h3>
          <div className="space-y-2">
            {espelho.dias.map((dia) => {
              const config = statusConfig[dia.status];
              const Icon = config.icon;
              const isToday = format(dia.data, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              
              return (
                <Card 
                  key={dia.data.toString()} 
                  className={`p-3 ${isToday ? 'ring-2 ring-primary' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${config.bg}`}>
                        {dia.tipo !== 'normal' ? (
                          <span className="text-sm">{tipoConfig[dia.tipo]?.slice(0, 2)}</span>
                        ) : (
                          <Icon className={`w-4 h-4 ${config.color}`} />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground text-sm">
                            {format(dia.data, 'dd/MM')} ({diaSemana(dia.data)})
                          </p>
                          {isToday && (
                            <Badge variant="outline" className="text-xs">HOJE</Badge>
                          )}
                        </div>
                        {dia.tipo === 'normal' && dia.batidas.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            ⏰ {dia.batidas.map(b => b.horario).join(' | ')}
                          </p>
                        )}
                        {dia.tipo !== 'normal' && (
                          <p className="text-xs text-muted-foreground">{tipoConfig[dia.tipo]}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${config.color}`}>
                        {dia.tipo === 'normal' ? dia.totalHoras : '-'}
                      </p>
                      {dia.status === 'extra' && (
                        <p className="text-xs text-primary">+{dia.totalHoras.replace(/(\d+):(\d+)/, (_, h, m) => {
                          const total = parseInt(h) * 60 + parseInt(m) - 8 * 60;
                          return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
                        })} extra</p>
                      )}
                    </div>
                  </div>
                  {dia.status === 'falta' && !dia.justificativa && (
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
            📊 Banco de Horas
          </h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-finance">{espelho.bancoHoras}</p>
              <p className="text-xs text-muted-foreground">Saldo atual</p>
            </div>
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-1" /> Ver Histórico
            </Button>
          </div>
        </Card>
      </div>

      {/* Modal Justificativa */}
      <Dialog open={showJustificativa} onOpenChange={setShowJustificativa}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Justificar Ponto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Data</p>
              <p className="font-medium">
                {selectedDate && format(selectedDate, "dd/MM/yyyy (EEEE)", { locale: ptBR })}
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="atestado">Atestado médico</SelectItem>
                  <SelectItem value="transporte">Problema de transporte</SelectItem>
                  <SelectItem value="externo">Trabalho externo</SelectItem>
                  <SelectItem value="esquecimento">Esquecimento</SelectItem>
                  <SelectItem value="equipamento">Problema no equipamento</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Descrição</label>
              <Textarea placeholder="Descreva o motivo..." rows={3} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Anexo (se houver)</label>
              <Button variant="outline" className="w-full">
                📤 Selecionar arquivo
              </Button>
              <p className="text-xs text-muted-foreground">(atestado, comprovante, etc.)</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowJustificativa(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setShowJustificativa(false)}>
              ✅ Enviar
            </Button>
          </DialogFooter>
          <p className="text-xs text-muted-foreground text-center">
            ⚠️ Será enviado para aprovação do seu gestor
          </p>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
