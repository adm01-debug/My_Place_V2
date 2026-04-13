import { Card } from '@/components/ui/card';

interface PontoStatsProps {
  horasNormais: string;
  horasExtras: string;
  bancoHoras: string;
}

export const PontoStats = ({ horasNormais, horasExtras, bancoHoras }: PontoStatsProps) => (
  <div>
    <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
      Resumo do Mês
    </h3>
    <div className="grid grid-cols-3 gap-3">
      <Card className="p-3 text-center">
        <p className="text-xs text-muted-foreground">Normal</p>
        <p className="text-lg font-bold text-foreground">{horasNormais}</p>
        <p className="text-xs text-muted-foreground">/176h</p>
      </Card>
      <Card className="p-3 text-center">
        <p className="text-xs text-muted-foreground">Extras</p>
        <p className="text-lg font-bold text-primary">{horasExtras}</p>
        <p className="text-xs text-muted-foreground">50%</p>
      </Card>
      <Card className="p-3 text-center">
        <p className="text-xs text-muted-foreground">Banco</p>
        <p className="text-lg font-bold text-finance">{bancoHoras}</p>
        <p className="text-xs text-muted-foreground">saldo</p>
      </Card>
    </div>
  </div>
);
