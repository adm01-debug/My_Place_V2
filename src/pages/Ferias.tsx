import { useState } from 'react';
import { Umbrella, Calendar, Plus, Info, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/portal/PageLayout';
import { StatCardSkeleton, ListItemSkeleton } from '@/components/portal/Skeletons';
import { useFerias } from '@/hooks/useFerias';
import { format, differenceInDays, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const statusConfig: Record<string, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'bg-projects-light text-projects' },
  aprovado: { label: 'Aprovado', color: 'bg-finance-light text-finance' },
  rejeitado: { label: 'Rejeitado', color: 'bg-destructive/10 text-destructive' },
  cancelado: { label: 'Cancelado', color: 'bg-muted text-muted-foreground' },
};

const tipoConfig: Record<string, string> = {
  ferias: 'Férias',
  abono: 'Abono Pecuniário',
  venda: 'Venda de Dias',
};

export default function Ferias() {
  const [showSolicitar, setShowSolicitar] = useState(false);
  const [tipoFerias, setTipoFerias] = useState('integral');
  const [dataInicio, setDataInicio] = useState('');
  const [diasSolicitados, setDiasSolicitados] = useState(30);
  const [venderDias, setVenderDias] = useState(false);
  const [antecipar13, setAntecipar13] = useState(false);
  const [observacao, setObservacao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  
  const { ferias, isLoading, solicitarFerias, cancelarFerias, refetch } = useFerias();
  const { toast } = useToast();
  
  // Calcular saldo (simplificado - em produção viria do backend)
  const saldoTotal = 30;
  const diasUsados = ferias
    .filter(f => f.status === 'aprovado')
    .reduce((acc, f) => acc + f.dias_solicitados, 0);
  const saldo = saldoTotal - diasUsados;
  
  // Simulação de vencimento (em produção viria do perfil do colaborador)
  const vencimento = addDays(new Date(), 180);
  const diasAteVencimento = differenceInDays(vencimento, new Date());

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Simulação de valores
  const salarioBase = 3500;
  const diasEfetivos = venderDias ? diasSolicitados - 10 : diasSolicitados;
  const valorFerias = (salarioBase / 30) * diasEfetivos;
  const tercoConstitucional = valorFerias / 3;
  const valorAbono = venderDias ? (salarioBase / 30) * 10 : 0;
  const totalBruto = valorFerias + tercoConstitucional + valorAbono;
  const descontosEst = totalBruto * 0.09;
  const liquidoEst = totalBruto - descontosEst;

  // Separar férias pendentes/aprovadas das concluídas
  const feriasPendentes = ferias.filter(f => ['pendente', 'aprovado'].includes(f.status));
  const feriasHistorico = ferias.filter(f => ['rejeitado', 'cancelado'].includes(f.status));

  const handleSolicitar = async () => {
    if (!dataInicio) {
      toast({
        title: 'Data obrigatória',
        description: 'Selecione a data de início das férias.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    const dataFim = format(addDays(new Date(dataInicio), diasSolicitados - 1), 'yyyy-MM-dd');
    const obs = [
      observacao,
      venderDias ? 'Venda de 10 dias (abono pecuniário)' : '',
      antecipar13 ? 'Antecipação da 1ª parcela do 13º' : '',
    ].filter(Boolean).join('. ');

    const result = await solicitarFerias(
      dataInicio,
      dataFim,
      diasSolicitados,
      'ferias',
      obs || undefined
    );

    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: 'Férias solicitadas!',
        description: 'Sua solicitação foi enviada para aprovação.',
      });
      setShowSolicitar(false);
      resetForm();
    } else {
      toast({
        title: 'Erro ao solicitar',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setTipoFerias('integral');
    setDataInicio('');
    setDiasSolicitados(30);
    setVenderDias(false);
    setAntecipar13(false);
    setObservacao('');
  };

  if (isLoading) {
    return (
      <PageLayout title="Minhas Férias" showBack>
        <div className="space-y-6">
          <StatCardSkeleton />
          <ListItemSkeleton />
          <ListItemSkeleton />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Minhas Férias" showBack onRefresh={refetch}>
      <div className="space-y-6 animate-fade-in-up">
        {/* Saldo Disponível */}
        <Card className="p-5 bg-gradient-to-br from-projects-light via-card to-card border-projects/20">
          <div className="flex items-center gap-2 mb-4">
            <Umbrella className="w-5 h-5 text-projects" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">
              Saldo Disponível
            </h3>
          </div>
          
          <div className="text-center py-4">
            <p className="text-5xl font-display font-bold text-foreground">
              {saldo}
            </p>
            <p className="text-lg text-muted-foreground">DIAS</p>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Dias já utilizados:</span>
              <span className="text-foreground">{diasUsados} dias</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Vencimento estimado:</span>
              <span className={diasAteVencimento < 90 ? 'text-projects font-medium' : 'text-foreground'}>
                {format(vencimento, 'dd/MM/yyyy')} 
                {diasAteVencimento > 0 ? ` (${diasAteVencimento} dias)` : ' (vencido!)'}
              </span>
            </div>
          </div>

          {diasAteVencimento > 180 && (
            <p className="text-xs text-finance mt-3 flex items-center gap-1">
              ✅ Ainda tem tempo!
            </p>
          )}
        </Card>

        {/* Solicitações Pendentes/Aprovadas */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Minhas Solicitações
          </h3>
          {feriasPendentes.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">Nenhuma férias solicitada</p>
              <Button onClick={() => setShowSolicitar(true)} className="w-full">
                <Umbrella className="w-4 h-4 mr-2" /> Solicitar Férias
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {feriasPendentes.map((sol) => (
                <div key={sol.id} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{sol.dias_solicitados} dias</span>
                    <Badge className={statusConfig[sol.status]?.color || statusConfig.pendente.color}>
                      {statusConfig[sol.status]?.label || sol.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(sol.data_inicio), 'dd/MM/yyyy')} a {format(new Date(sol.data_fim), 'dd/MM/yyyy')}
                  </p>
                  {sol.observacao && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      {sol.observacao}
                    </p>
                  )}
                  {sol.status === 'pendente' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={async () => {
                        setCancelingId(sol.id);
                        const result = await cancelarFerias(sol.id);
                        setCancelingId(null);
                        if (result.success) {
                          toast({
                            title: 'Solicitação cancelada',
                            description: 'Sua solicitação de férias foi cancelada.',
                          });
                        } else {
                          toast({
                            title: 'Erro ao cancelar',
                            description: result.error,
                            variant: 'destructive',
                          });
                        }
                      }}
                      disabled={cancelingId === sol.id}
                    >
                      <X className="w-4 h-4 mr-1" />
                      {cancelingId === sol.id ? 'Cancelando...' : 'Cancelar solicitação'}
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={() => setShowSolicitar(true)}>
                <Plus className="w-4 h-4 mr-2" /> Nova Solicitação
              </Button>
            </div>
          )}
        </Card>

        {/* Histórico */}
        {feriasHistorico.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              📋 Histórico
            </h3>
            <div className="space-y-3">
              {feriasHistorico.map((hist) => (
                <Card key={hist.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Umbrella className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {format(new Date(hist.data_inicio), 'MMM/yyyy', { locale: ptBR })} - {hist.dias_solicitados} dias
                      </span>
                    </div>
                    <Badge className={statusConfig[hist.status]?.color || statusConfig.pendente.color}>
                      {statusConfig[hist.status]?.label || hist.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(hist.data_inicio), 'dd/MM')} a {format(new Date(hist.data_fim), 'dd/MM/yyyy')}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Informações */}
        <Card className="p-4 bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Info className="w-4 h-4" /> Informações
          </h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Você pode fracionar em até 3 períodos (mín. 14 + 5 + 5)</li>
            <li>• Pode vender até 10 dias (abono pecuniário)</li>
            <li>• Solicite com 30 dias de antecedência</li>
          </ul>
        </Card>
      </div>

      {/* Modal Solicitar Férias */}
      <Dialog open={showSolicitar} onOpenChange={setShowSolicitar}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Solicitar Férias</DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Info */}
            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-sm">
                <span className="text-muted-foreground">Saldo:</span>{' '}
                <span className="font-bold">{saldo} dias</span>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Vencimento:</span>{' '}
                {format(vencimento, 'dd/MM/yyyy')}
              </p>
            </div>

            {/* Tipo */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">🏖️ Tipo de Férias</Label>
              <RadioGroup value={tipoFerias} onValueChange={(v) => {
                setTipoFerias(v);
                setDiasSolicitados(v === 'integral' ? 30 : 14);
              }}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="integral" id="integral" />
                  <Label htmlFor="integral" className="font-normal">Integral (30 dias)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fracionada" id="fracionada" />
                  <Label htmlFor="fracionada" className="font-normal">Fracionada</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Dias (se fracionada) */}
            {tipoFerias === 'fracionada' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Quantidade de dias</Label>
                <Input
                  type="number"
                  min={5}
                  max={saldo}
                  value={diasSolicitados}
                  onChange={(e) => setDiasSolicitados(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">Mínimo: 5 dias | Máximo: {saldo} dias</p>
              </div>
            )}

            {/* Datas */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">📆 Período Solicitado</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Data Início</Label>
                  <Input 
                    type="date" 
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Data Fim</Label>
                  <Input 
                    type="date" 
                    value={dataInicio ? format(addDays(new Date(dataInicio), diasSolicitados - 1), 'yyyy-MM-dd') : ''}
                    disabled
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Total: {diasSolicitados} dias</p>
            </div>

            {/* Opções */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">💰 Opções</Label>
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="abono" 
                    checked={venderDias}
                    onCheckedChange={(checked) => setVenderDias(checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label htmlFor="abono" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Vender 10 dias (abono)
                    </label>
                    <p className="text-xs text-muted-foreground">
                      → Gozo: {diasSolicitados - 10} dias | Pagamento extra: ~{formatCurrency(valorAbono)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Checkbox 
                    id="13" 
                    checked={antecipar13}
                    onCheckedChange={(checked) => setAntecipar13(checked as boolean)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label htmlFor="13" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Antecipar 1ª parcela do 13º
                    </label>
                    <p className="text-xs text-muted-foreground">
                      → Valor adicional: ~{formatCurrency(1750)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Observação */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">📝 Observação (opcional)</Label>
              <Textarea
                placeholder="Alguma observação para o RH..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows={2}
              />
            </div>

            {/* Simulação */}
            <Card className="p-4 bg-finance-light/30 border-finance/20">
              <h4 className="font-semibold text-sm mb-3">💵 Simulação</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Férias ({diasEfetivos} dias):</span>
                  <span>{formatCurrency(valorFerias)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">1/3 Constitucional:</span>
                  <span>{formatCurrency(tercoConstitucional)}</span>
                </div>
                {venderDias && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Abono (10 dias):</span>
                    <span>{formatCurrency(valorAbono)}</span>
                  </div>
                )}
                <div className="border-t border-border my-2" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Bruto:</span>
                  <span>{formatCurrency(totalBruto)}</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>Descontos (est.):</span>
                  <span>-{formatCurrency(descontosEst)}</span>
                </div>
                <div className="border-t border-border my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Líquido (est.):</span>
                  <span className="text-finance">{formatCurrency(liquidoEst)}</span>
                </div>
              </div>
              {dataInicio && (
                <p className="text-xs text-muted-foreground mt-3">
                  Pagamento: até {format(addDays(new Date(dataInicio), -2), 'dd/MM/yyyy')}
                </p>
              )}
            </Card>
          </div>

          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowSolicitar(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button onClick={handleSolicitar} disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : '✅ Solicitar'}
            </Button>
          </DialogFooter>
          <p className="text-xs text-muted-foreground text-center">
            ⚠️ Será enviado para aprovação do gestor e DP
          </p>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
