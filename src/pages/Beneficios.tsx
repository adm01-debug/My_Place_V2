import { Bus, Utensils, Heart, Smile } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/portal/PageLayout';
import { mockBeneficios } from '@/data/mockData';
import { format } from 'date-fns';

export default function Beneficios() {
  const b = mockBeneficios;
  const formatCurrency = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);

  return (
    <PageLayout title="Meus Benefícios" showBack>
      <div className="space-y-4 animate-fade-in-up">
        {b.valeTransporte && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3"><Bus className="w-5 h-5 text-primary" /><h3 className="font-semibold">Vale Transporte</h3><Badge className="ml-auto bg-finance-light text-finance">Ativo</Badge></div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><p className="text-muted-foreground">Crédito Mensal</p><p className="font-medium">{formatCurrency(b.valeTransporte.creditoMensal)}</p></div>
              <div><p className="text-muted-foreground">Desconto (6%)</p><p className="font-medium">{formatCurrency(b.valeTransporte.desconto)}</p></div>
              <div><p className="text-muted-foreground">Saldo Cartão</p><p className="font-medium">{formatCurrency(b.valeTransporte.saldoCartao!)}</p></div>
              <div><p className="text-muted-foreground">Cartão</p><p className="font-medium">{b.valeTransporte.numeroCartao}</p></div>
            </div>
          </Card>
        )}
        {b.valeRefeicao && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3"><Utensils className="w-5 h-5 text-projects" /><h3 className="font-semibold">Vale Refeição</h3><Badge className="ml-auto bg-finance-light text-finance">Ativo</Badge></div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><p className="text-muted-foreground">Crédito Mensal</p><p className="font-medium">{formatCurrency(b.valeRefeicao.creditoMensal)}</p></div>
              <div><p className="text-muted-foreground">Saldo Cartão</p><p className="font-medium">{formatCurrency(b.valeRefeicao.saldoCartao!)}</p></div>
            </div>
          </Card>
        )}
        {b.planoSaude && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3"><Heart className="w-5 h-5 text-destructive" /><h3 className="font-semibold">Plano de Saúde</h3><Badge className="ml-auto bg-finance-light text-finance">Ativo</Badge></div>
            <div className="text-sm space-y-1">
              <p><span className="text-muted-foreground">Operadora:</span> {b.planoSaude.operadora} - {b.planoSaude.plano}</p>
              <p><span className="text-muted-foreground">Você paga:</span> <span className="font-medium">{formatCurrency(b.planoSaude.valorDesconto)}</span>/mês</p>
            </div>
          </Card>
        )}
        {b.planoOdonto && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3"><Smile className="w-5 h-5 text-primary" /><h3 className="font-semibold">Plano Odontológico</h3><Badge className="ml-auto bg-finance-light text-finance">Ativo</Badge></div>
            <p className="text-sm"><span className="text-muted-foreground">Você paga:</span> <span className="font-medium">{formatCurrency(b.planoOdonto.valorDesconto)}</span>/mês</p>
          </Card>
        )}
        <Card className="p-4 bg-muted/50">
          <h3 className="font-semibold mb-2">📊 Resumo de Descontos</h3>
          <div className="text-sm space-y-1">
            <div className="flex justify-between"><span>VT:</span><span>{formatCurrency(b.resumoDescontos.vt)}</span></div>
            <div className="flex justify-between"><span>Saúde:</span><span>{formatCurrency(b.resumoDescontos.saude)}</span></div>
            <div className="flex justify-between"><span>Odonto:</span><span>{formatCurrency(b.resumoDescontos.odonto)}</span></div>
            <div className="flex justify-between font-bold border-t pt-1 mt-1"><span>TOTAL:</span><span>{formatCurrency(b.resumoDescontos.total)}/mês</span></div>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
