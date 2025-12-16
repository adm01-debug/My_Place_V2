import { CreditCard, Calendar, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageLayout } from '@/components/portal/PageLayout';
import { mockEmprestimos } from '@/data/mockData';
import { format } from 'date-fns';

export default function Emprestimos() {
  const emprestimos = mockEmprestimos;
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const emp = emprestimos[0];
  const progresso = (emp.parcelasPagas / emp.quantidadeParcelas) * 100;

  return (
    <PageLayout title="Meus Empréstimos" showBack>
      <div className="space-y-6 animate-fade-in-up">
        <Card className="p-5 border-primary/20">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Empréstimo Ativo</h3>
            <Badge className="bg-finance-light text-finance ml-auto">Ativo</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{emp.numeroContrato} | {format(emp.dataContratacao, 'dd/MM/yyyy')}</p>
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
            <div><p className="text-muted-foreground">Valor Original</p><p className="font-bold">{formatCurrency(emp.valorOriginal)}</p></div>
            <div><p className="text-muted-foreground">Total c/ Juros</p><p className="font-bold">{formatCurrency(emp.totalComJuros)}</p></div>
            <div><p className="text-muted-foreground">Parcelas</p><p className="font-bold">{emp.quantidadeParcelas}x de {formatCurrency(emp.valorParcela)}</p></div>
            <div><p className="text-muted-foreground">Saldo Devedor</p><p className="font-bold text-destructive">{formatCurrency(emp.saldoDevedor)}</p></div>
          </div>
          <div className="mb-2"><p className="text-sm text-muted-foreground">Pagas: {emp.parcelasPagas}/{emp.quantidadeParcelas}</p></div>
          <Progress value={progresso} className="h-2" />
        </Card>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">📋 Extrato de Parcelas</h3>
          <Card className="divide-y divide-border">
            {emp.parcelas.map((p) => (
              <div key={p.numero} className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {p.status === 'paga' ? <CheckCircle className="w-4 h-4 text-finance" /> : <Clock className="w-4 h-4 text-muted-foreground" />}
                  <div>
                    <p className="text-sm font-medium">Parcela {p.numero}</p>
                    <p className="text-xs text-muted-foreground">{format(p.vencimento, 'MMM/yyyy')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatCurrency(p.valor)}</p>
                  <p className={`text-xs ${p.status === 'paga' ? 'text-finance' : 'text-muted-foreground'}`}>
                    {p.status === 'paga' ? '✅' : '⏳'}
                  </p>
                </div>
              </div>
            ))}
          </Card>
        </div>
        <Button variant="outline" className="w-full">💬 Solicitar Novo Empréstimo</Button>
      </div>
    </PageLayout>
  );
}
