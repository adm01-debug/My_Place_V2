import { useState } from 'react';
import { CreditCard, Calendar, CheckCircle, Clock, Plus, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageLayout } from '@/components/portal/PageLayout';
import { StatCardSkeleton, TableSkeleton } from '@/components/portal/Skeletons';
import { useEmprestimos } from '@/hooks/useEmprestimos';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const statusConfig: Record<string, { label: string; color: string }> = {
  ativo: { label: 'Ativo', color: 'bg-finance-light text-finance' },
  quitado: { label: 'Quitado', color: 'bg-muted text-muted-foreground' },
  cancelado: { label: 'Cancelado', color: 'bg-destructive/10 text-destructive' },
};

export default function Emprestimos() {
  const [showSolicitar, setShowSolicitar] = useState(false);
  const [valor, setValor] = useState('');
  const [parcelas, setParcelas] = useState('12');
  const [motivo, setMotivo] = useState('');
  const [observacao, setObservacao] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { emprestimos, isLoading, solicitarEmprestimo, refetch } = useEmprestimos();
  const { toast } = useToast();

  const formatCurrency = (v: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  const empAtivo = emprestimos.find(e => e.status === 'ativo');
  const empHistorico = emprestimos.filter(e => e.status !== 'ativo');

  // Cálculo simulação
  const valorNum = parseFloat(valor.replace(/\D/g, '')) / 100 || 0;
  const parcelasNum = parseInt(parcelas) || 12;
  const taxaJuros = 1.5;
  const totalComJuros = valorNum * Math.pow(1 + taxaJuros / 100, parcelasNum);
  const valorParcela = parcelasNum > 0 ? totalComJuros / parcelasNum : 0;

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const numValue = parseInt(rawValue) / 100;
    if (!isNaN(numValue)) {
      setValor(numValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
    } else {
      setValor('');
    }
  };

  const handleSubmit = async () => {
    if (!valorNum || !motivo) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o valor e motivo do empréstimo.',
        variant: 'destructive',
      });
      return;
    }

    if (valorNum < 500) {
      toast({
        title: 'Valor mínimo',
        description: 'O valor mínimo para empréstimo é R$ 500,00.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    const result = await solicitarEmprestimo(valorNum, parcelasNum, motivo, observacao || undefined);
    setIsSubmitting(false);

    if (result.success) {
      toast({
        title: 'Solicitação enviada!',
        description: 'Seu pedido de empréstimo foi registrado e será analisado.',
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
    setValor('');
    setParcelas('12');
    setMotivo('');
    setObservacao('');
  };

  if (isLoading) {
    return (
      <PageLayout title="Meus Empréstimos" showBack>
        <div className="space-y-6">
          <StatCardSkeleton />
          <TableSkeleton rows={4} />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Meus Empréstimos" showBack onRefresh={refetch}>
      <div className="space-y-6 animate-fade-in-up">
        {empAtivo ? (
          <>
            <Card className="p-5 border-primary/20">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Empréstimo Ativo</h3>
                <Badge className={statusConfig[empAtivo.status]?.color || statusConfig.ativo.color} >
                  {statusConfig[empAtivo.status]?.label || empAtivo.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {empAtivo.numero_contrato} | {format(new Date(empAtivo.data_contratacao), 'dd/MM/yyyy')}
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <p className="text-muted-foreground">Valor Original</p>
                  <p className="font-bold">{formatCurrency(empAtivo.valor_original)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total c/ Juros</p>
                  <p className="font-bold">{formatCurrency(empAtivo.total_com_juros)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Parcelas</p>
                  <p className="font-bold">
                    {empAtivo.quantidade_parcelas}x de {formatCurrency(empAtivo.valor_parcela)}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Saldo Devedor</p>
                  <p className="font-bold text-destructive">{formatCurrency(empAtivo.saldo_devedor)}</p>
                </div>
              </div>
              {empAtivo.motivo && (
                <p className="text-sm text-muted-foreground mb-4">
                  <span className="font-medium">Motivo:</span> {empAtivo.motivo}
                </p>
              )}
              <div className="mb-2">
                <p className="text-sm text-muted-foreground">
                  Pagas: {empAtivo.parcelas_pagas}/{empAtivo.quantidade_parcelas}
                </p>
              </div>
              <Progress 
                value={(empAtivo.parcelas_pagas / empAtivo.quantidade_parcelas) * 100} 
                className="h-2" 
              />
            </Card>

            {empAtivo.parcelas && empAtivo.parcelas.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">
                  📋 Extrato de Parcelas
                </h3>
                <Card className="divide-y divide-border">
                  {empAtivo.parcelas.map((p) => (
                    <div key={p.id} className="p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {p.status === 'paga' ? (
                          <CheckCircle className="w-4 h-4 text-finance" />
                        ) : p.status === 'atrasada' ? (
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                        ) : (
                          <Clock className="w-4 h-4 text-muted-foreground" />
                        )}
                        <div>
                          <p className="text-sm font-medium">Parcela {p.numero}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(p.vencimento), 'MMM/yyyy', { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatCurrency(p.valor)}</p>
                        <p className={`text-xs ${
                          p.status === 'paga' ? 'text-finance' : 
                          p.status === 'atrasada' ? 'text-destructive' : 
                          'text-muted-foreground'
                        }`}>
                          {p.status === 'paga' ? '✅ Paga' : 
                           p.status === 'atrasada' ? '⚠️ Atrasada' : 
                           '⏳ Pendente'}
                        </p>
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            )}
          </>
        ) : (
          <Card className="p-6 text-center">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold text-foreground mb-2">Nenhum empréstimo ativo</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Você não possui empréstimos em andamento no momento.
            </p>
            <Button onClick={() => setShowSolicitar(true)}>
              <Plus className="w-4 h-4 mr-2" /> Solicitar Empréstimo
            </Button>
          </Card>
        )}

        {empHistorico.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">
              📜 Histórico
            </h3>
            <div className="space-y-3">
              {empHistorico.map((emp) => (
                <Card key={emp.id} className="p-4 opacity-75">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">{emp.numero_contrato}</span>
                    <Badge className={statusConfig[emp.status]?.color}>
                      {statusConfig[emp.status]?.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(emp.valor_original)} em {emp.quantidade_parcelas}x
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {empAtivo && (
          <Button variant="outline" className="w-full" disabled>
            💬 Solicitar Novo (já possui empréstimo ativo)
          </Button>
        )}
        
        {!empAtivo && emprestimos.length > 0 && (
          <Button variant="outline" className="w-full" onClick={() => setShowSolicitar(true)}>
            <Plus className="w-4 h-4 mr-2" /> Solicitar Novo Empréstimo
          </Button>
        )}
      </div>

      {/* Modal Solicitar Empréstimo */}
      <Dialog open={showSolicitar} onOpenChange={setShowSolicitar}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Solicitar Empréstimo</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-muted/50 rounded-lg text-sm">
              <p className="text-muted-foreground">Taxa de juros: <span className="font-bold">1,5% a.m.</span></p>
              <p className="text-muted-foreground">Valor mínimo: <span className="font-bold">R$ 500,00</span></p>
              <p className="text-muted-foreground">Desconto em folha</p>
            </div>

            <div className="space-y-2">
              <Label>Valor do Empréstimo *</Label>
              <Input
                placeholder="R$ 0,00"
                value={valor ? `R$ ${valor}` : ''}
                onChange={handleValorChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Quantidade de Parcelas *</Label>
              <Select value={parcelas} onValueChange={setParcelas}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6x</SelectItem>
                  <SelectItem value="12">12x</SelectItem>
                  <SelectItem value="18">18x</SelectItem>
                  <SelectItem value="24">24x</SelectItem>
                  <SelectItem value="36">36x</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Motivo *</Label>
              <Select value={motivo} onValueChange={setMotivo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o motivo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="emergencia">Emergência</SelectItem>
                  <SelectItem value="saude">Saúde</SelectItem>
                  <SelectItem value="educacao">Educação</SelectItem>
                  <SelectItem value="reforma">Reforma/Construção</SelectItem>
                  <SelectItem value="veiculo">Veículo</SelectItem>
                  <SelectItem value="dividas">Quitação de Dívidas</SelectItem>
                  <SelectItem value="outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Observação (opcional)</Label>
              <Textarea
                placeholder="Detalhe sua necessidade..."
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                rows={2}
              />
            </div>

            {valorNum > 0 && (
              <Card className="p-4 bg-finance-light/30 border-finance/20">
                <h4 className="font-semibold text-sm mb-3">💰 Simulação</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Valor solicitado:</span>
                    <span>{formatCurrency(valorNum)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Taxa ({taxaJuros}% a.m.):</span>
                    <span>{formatCurrency(totalComJuros - valorNum)}</span>
                  </div>
                  <div className="border-t border-border my-2" />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total a pagar:</span>
                    <span className="font-bold">{formatCurrency(totalComJuros)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>Parcela:</span>
                    <span className="text-finance">{parcelasNum}x de {formatCurrency(valorParcela)}</span>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSolicitar(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Solicitar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
