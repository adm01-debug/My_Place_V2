import { TrendingUp, Target, DollarSign, Calendar, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageLayout } from '@/components/portal/PageLayout';
import { mockRemuneracaoVariavel, mockMetas } from '@/data/mockData';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const mesesNome = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const tipoLabels: Record<string, string> = {
  comissao_vendas: 'Comissão vendas',
  bonus_meta: 'Bônus meta atingida',
  bonus_produtividade: 'Bônus produtividade',
  plr: 'PLR',
  premio_assiduidade: 'Prêmio assiduidade',
  gratificacao: 'Gratificação',
  outros: 'Outros',
};

const statusConfig = {
  previsto: { label: 'A receber', color: 'bg-projects-light text-projects' },
  confirmado: { label: 'Confirmado', color: 'bg-primary/10 text-primary' },
  pago: { label: 'Pago', color: 'bg-finance-light text-finance' },
};

export default function RemuneracaoVariavel() {
  const remuneracoes = mockRemuneracaoVariavel;
  const metas = mockMetas;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  // Calcular totais do ano
  const totalAno = remuneracoes.reduce((acc, r) => acc + r.total, 0);
  const mediaMensal = totalAno / remuneracoes.length;

  // Dados para gráfico simplificado
  const dadosGrafico = Array.from({ length: 12 }, (_, i) => {
    const mes = i + 1;
    const rem = remuneracoes.find(r => r.mes === mes);
    return rem?.total || 0;
  });
  const maxValor = Math.max(...dadosGrafico, 1);

  return (
    <PageLayout title="Remuneração Variável" showBack>
      <div className="space-y-6 animate-fade-in-up">
        {/* Resumo Anual */}
        <Card className="p-5 bg-gradient-to-br from-finance-light via-card to-card border-finance/20">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-finance" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">
              Resumo 2025
            </h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-display font-bold text-foreground">
                {formatCurrency(totalAno)}
              </p>
              <p className="text-xs text-muted-foreground">Total Acumulado</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold text-foreground">
                {formatCurrency(mediaMensal)}
              </p>
              <p className="text-xs text-muted-foreground">Média Mensal</p>
            </div>
          </div>
        </Card>

        {/* Gráfico Simples */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4">
            📈 Evolução Mensal
          </h3>
          <div className="flex items-end justify-between h-24 gap-1">
            {dadosGrafico.map((valor, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className={`w-full rounded-t transition-all ${valor > 0 ? 'bg-finance' : 'bg-muted'}`}
                  style={{ height: `${(valor / maxValor) * 100}%`, minHeight: valor > 0 ? '4px' : '2px' }}
                />
                <span className="text-[10px] text-muted-foreground">{mesesNome[i + 1]}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Detalhamento por Mês */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            💰 Detalhamento por Mês
          </h3>
          <div className="space-y-3">
            {remuneracoes.map((rem) => (
              <Card key={rem.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-semibold text-foreground">
                      {mesesNome[rem.mes].toUpperCase()}/{rem.ano}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-foreground">
                      {formatCurrency(rem.total)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  {rem.itens.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-finance" />
                        {tipoLabels[item.tipo] || item.descricao}
                      </span>
                      <span className="text-foreground">{formatCurrency(item.valor)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <Badge className={statusConfig[rem.status].color}>
                    {statusConfig[rem.status].label}
                  </Badge>
                  {rem.status === 'pago' && rem.dataPagamento && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-finance" />
                      Pago em {format(rem.dataPagamento, 'dd/MM')}
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Metas */}
        {metas.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
              🎯 Minhas Metas
            </h3>
            {metas.map((meta) => (
              <Card key={meta.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground">{meta.titulo}</span>
                </div>
                <Progress value={meta.percentual} className="h-2 mb-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {formatCurrency(meta.valorAtual)} / {formatCurrency(meta.valorMeta)}
                  </span>
                  <span className="font-medium text-primary">{meta.percentual}%</span>
                </div>
                <p className="text-xs text-finance mt-2">
                  Bônus se atingir: {formatCurrency(meta.bonus)}
                </p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
