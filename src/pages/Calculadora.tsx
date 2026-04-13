import { Calculator, Calendar, Gift } from 'lucide-react';
import { PageLayout } from '@/components/portal/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FeriasCalculator } from '@/components/calculadora/FeriasCalculator';
import { DecimoTerceiroCalculator } from '@/components/calculadora/DecimoTerceiroCalculator';

const Calculadora = () => {
  const handleCurrencyInput = (value: string, setter: (v: string) => void) => {
    const numericValue = value.replace(/\D/g, '');
    const formatted = (parseInt(numericValue) / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    setter(numericValue ? formatted : '');
  };

  return (
    <PageLayout title="Calculadora">
      <div className="space-y-6">
        {/* Header */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <Calculator className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Simulador de Valores</h2>
                <p className="text-sm text-muted-foreground">
                  Calcule estimativas de férias e 13º salário antes de fazer sua solicitação
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="ferias" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ferias" className="gap-2">
              <Calendar className="h-4 w-4" />
              Férias
            </TabsTrigger>
            <TabsTrigger value="13salario" className="gap-2">
              <Gift className="h-4 w-4" />
              13º Salário
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ferias">
            <FeriasCalculator handleCurrencyInput={handleCurrencyInput} />
          </TabsContent>

          <TabsContent value="13salario">
            <DecimoTerceiroCalculator handleCurrencyInput={handleCurrencyInput} />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
};

export default Calculadora;
