import { useState } from 'react';
import { Umbrella, Calendar, Eye, Plus, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageLayout } from '@/components/portal/PageLayout';
import { StatCardSkeleton, ListItemSkeleton } from '@/components/portal/Skeletons';
import { useLoadingState } from '@/hooks/useLoadingState';
import { mockFerias, mockColaborador } from '@/data/mockData';
import { format, differenceInDays } from 'date-fns';
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

const statusConfig = {
  solicitada: { label: 'Solicitada', color: 'bg-projects-light text-projects' },
  aprovada_gestor: { label: 'Aprovada (Gestor)', color: 'bg-primary/10 text-primary' },
  rejeitada_gestor: { label: 'Rejeitada', color: 'bg-destructive/10 text-destructive' },
  aprovada_dp: { label: 'Aprovada (DP)', color: 'bg-finance-light text-finance' },
  programada: { label: 'Programada', color: 'bg-finance-light text-finance' },
  em_gozo: { label: 'Em gozo', color: 'bg-hr-light text-hr' },
  concluida: { label: 'Concluída', color: 'bg-muted text-muted-foreground' },
  cancelada: { label: 'Cancelada', color: 'bg-destructive/10 text-destructive' },
};

export default function Ferias() {
  const [showSolicitar, setShowSolicitar] = useState(false);
  const [tipoFerias, setTipoFerias] = useState('integral');
  const [dataInicio, setDataInicio] = useState('');
  const [venderDias, setVenderDias] = useState(false);
  const [antecipar13, setAntecipar13] = useState(false);
  const isLoading = useLoadingState(800);
  
  const ferias = mockFerias;
  const saldo = ferias.periodoAquisitivo.saldoDias;
  const vencimento = ferias.periodoAquisitivo.vencimento;
  const diasAteVencimento = differenceInDays(vencimento, new Date());

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Simulação de valores
  const salarioBase = 3500;
  const valorFerias = salarioBase;
  const tercoConstitucional = salarioBase / 3;
  const valorAbono = venderDias ? (salarioBase / 30) * 10 : 0;
  const totalBruto = valorFerias + tercoConstitucional + valorAbono;
  const descontosEst = totalBruto * 0.09;
  const liquidoEst = totalBruto - descontosEst;

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
    <PageLayout title="Minhas Férias" showBack>
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
              <span>Período Aquisitivo:</span>
              <span className="text-foreground">
                {format(ferias.periodoAquisitivo.inicio, 'dd/MM/yyyy')} a {format(ferias.periodoAquisitivo.fim, 'dd/MM/yyyy')}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Vencimento:</span>
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

        {/* Próximas Férias / Solicitar */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Próximas Férias
          </h3>
          {ferias.solicitacoes.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">Nenhuma férias programada</p>
              <Button onClick={() => setShowSolicitar(true)} className="w-full">
                <Umbrella className="w-4 h-4 mr-2" /> Solicitar Férias
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {ferias.solicitacoes.map((sol) => (
                <div key={sol.id} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{sol.dias} dias</span>
                    <Badge className={statusConfig[sol.status].color}>
                      {statusConfig[sol.status].label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(sol.dataInicio, 'dd/MM/yyyy')} a {format(sol.dataFim, 'dd/MM/yyyy')}
                  </p>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={() => setShowSolicitar(true)}>
                <Plus className="w-4 h-4 mr-2" /> Nova Solicitação
              </Button>
            </div>
          )}
        </Card>

        {/* Histórico */}
        {ferias.historico.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              📋 Histórico
            </h3>
            <div className="space-y-3">
              {ferias.historico.map((hist) => (
                <Card key={hist.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Umbrella className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {format(hist.dataInicio, 'MMM/yyyy', { locale: ptBR })} - {hist.dias} dias
                      </span>
                    </div>
                    <Badge className={statusConfig[hist.status].color}>
                      {statusConfig[hist.status].label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(hist.dataInicio, 'dd/MM')} a {format(hist.dataFim, 'dd/MM/yyyy')}
                  </p>
                  <Button variant="link" size="sm" className="p-0 h-auto text-xs mt-1">
                    <Eye className="w-3 h-3 mr-1" /> Ver detalhes
                  </Button>
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
              <RadioGroup value={tipoFerias} onValueChange={setTipoFerias}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="integral" id="integral" />
                  <Label htmlFor="integral" className="font-normal">Integral (30 dias)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="fracionada" id="fracionada" />
                  <Label htmlFor="fracionada" className="font-normal">Fracionada (escolher datas)</Label>
                </div>
              </RadioGroup>
            </div>

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
                    value={dataInicio ? format(new Date(new Date(dataInicio).getTime() + 29 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd') : ''}
                    disabled
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Total: 30 dias</p>
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
                      → Gozo: 20 dias | Pagamento extra: ~{formatCurrency(valorAbono)}
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

            {/* Simulação */}
            <Card className="p-4 bg-finance-light/30 border-finance/20">
              <h4 className="font-semibold text-sm mb-3">💵 Simulação</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Férias ({venderDias ? 20 : 30} dias):</span>
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
                  Pagamento: até {format(new Date(new Date(dataInicio).getTime() - 2 * 24 * 60 * 60 * 1000), 'dd/MM/yyyy')}
                </p>
              )}
            </Card>
          </div>

          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowSolicitar(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setShowSolicitar(false)}>
              ✅ Solicitar
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
