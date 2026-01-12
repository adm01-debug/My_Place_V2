import { Bus, Utensils, Heart, Smile, Apple, Shield, Baby, Dumbbell } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/portal/PageLayout';
import { ListItemSkeleton } from '@/components/portal/Skeletons';
import { useBeneficios } from '@/hooks/useBeneficios';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

const tipoIcons: Record<string, any> = {
  vale_transporte: Bus,
  vale_refeicao: Utensils,
  vale_alimentacao: Apple,
  plano_saude: Heart,
  plano_odonto: Smile,
  seguro_vida: Shield,
  auxilio_creche: Baby,
  gympass: Dumbbell,
};

const tipoLabels: Record<string, string> = {
  vale_transporte: 'Vale Transporte',
  vale_refeicao: 'Vale Refeição',
  vale_alimentacao: 'Vale Alimentação',
  plano_saude: 'Plano de Saúde',
  plano_odonto: 'Plano Odontológico',
  seguro_vida: 'Seguro de Vida',
  auxilio_creche: 'Auxílio Creche',
  gympass: 'Gympass',
  outros: 'Outros',
};

const tipoColors: Record<string, string> = {
  vale_transporte: 'text-primary',
  vale_refeicao: 'text-projects',
  vale_alimentacao: 'text-finance',
  plano_saude: 'text-destructive',
  plano_odonto: 'text-primary',
  seguro_vida: 'text-muted-foreground',
  auxilio_creche: 'text-pink-500',
  gympass: 'text-orange-500',
};

export default function Beneficios() {
  const { 
    beneficios, 
    resumoDescontos, 
    isLoading, 
    refetch 
  } = useBeneficios();

  if (isLoading) {
    return (
      <PageLayout title="Meus Benefícios" showBack>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => <ListItemSkeleton key={i} />)}
        </div>
      </PageLayout>
    );
  }

  if (beneficios.length === 0) {
    return (
      <PageLayout title="Meus Benefícios" showBack onRefresh={refetch}>
        <div className="text-center py-12">
          <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhum benefício cadastrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            Entre em contato com o RH para mais informações
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Meus Benefícios" showBack onRefresh={refetch}>
      <div className="space-y-4 animate-fade-in-up">
        {beneficios.map((beneficio) => {
          const Icon = tipoIcons[beneficio.tipo] || Heart;
          const label = tipoLabels[beneficio.tipo] || beneficio.tipo;
          const color = tipoColors[beneficio.tipo] || 'text-primary';

          return (
            <Card key={beneficio.id} className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-5 h-5 ${color}`} />
                <h3 className="font-semibold">{label}</h3>
                <Badge className="ml-auto bg-finance-light text-finance">
                  {beneficio.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                {beneficio.credito_mensal > 0 && (
                  <div>
                    <p className="text-muted-foreground">Crédito Mensal</p>
                    <p className="font-medium">{formatCurrency(beneficio.credito_mensal)}</p>
                  </div>
                )}
                
                {beneficio.desconto > 0 && (
                  <div>
                    <p className="text-muted-foreground">Desconto</p>
                    <p className="font-medium">{formatCurrency(beneficio.desconto)}</p>
                  </div>
                )}
                
                {beneficio.saldo_cartao !== null && beneficio.saldo_cartao > 0 && (
                  <div>
                    <p className="text-muted-foreground">Saldo Cartão</p>
                    <p className="font-medium">{formatCurrency(beneficio.saldo_cartao)}</p>
                  </div>
                )}
                
                {beneficio.numero_cartao && (
                  <div>
                    <p className="text-muted-foreground">Cartão</p>
                    <p className="font-medium">{beneficio.numero_cartao}</p>
                  </div>
                )}
                
                {beneficio.operadora && (
                  <div>
                    <p className="text-muted-foreground">Operadora</p>
                    <p className="font-medium">
                      {beneficio.operadora}
                      {beneficio.plano && ` - ${beneficio.plano}`}
                    </p>
                  </div>
                )}
                
                {beneficio.numero_carteirinha && (
                  <div>
                    <p className="text-muted-foreground">Carteirinha</p>
                    <p className="font-medium">{beneficio.numero_carteirinha}</p>
                  </div>
                )}
                
                {beneficio.ultima_recarga && (
                  <div>
                    <p className="text-muted-foreground">Última Recarga</p>
                    <p className="font-medium">
                      {format(new Date(beneficio.ultima_recarga), 'dd/MM/yyyy')}
                    </p>
                  </div>
                )}
              </div>

              {beneficio.dependentes && beneficio.dependentes.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground mb-2">Dependentes:</p>
                  <div className="space-y-1">
                    {beneficio.dependentes.map(dep => (
                      <div key={dep.id} className="text-sm flex justify-between">
                        <span>{dep.nome}</span>
                        <span className="text-muted-foreground">{dep.parentesco}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        <Card className="p-4 bg-muted/50">
          <h3 className="font-semibold mb-2">📊 Resumo de Descontos</h3>
          <div className="text-sm space-y-1">
            {resumoDescontos.vt > 0 && (
              <div className="flex justify-between">
                <span>VT:</span><span>{formatCurrency(resumoDescontos.vt)}</span>
              </div>
            )}
            {resumoDescontos.saude > 0 && (
              <div className="flex justify-between">
                <span>Saúde:</span><span>{formatCurrency(resumoDescontos.saude)}</span>
              </div>
            )}
            {resumoDescontos.odonto > 0 && (
              <div className="flex justify-between">
                <span>Odonto:</span><span>{formatCurrency(resumoDescontos.odonto)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t pt-1 mt-1">
              <span>TOTAL:</span><span>{formatCurrency(resumoDescontos.total)}/mês</span>
            </div>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}
