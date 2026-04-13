import { useState, useMemo } from 'react';
import { Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrency } from '@/lib/utils';

function calcular13(salario13: string, mesesTrabalhados: string) {
  const salario = parseFloat(salario13.replace(/\D/g, '')) / 100 || 0;
  const meses = parseInt(mesesTrabalhados) || 12;
  if (salario <= 0) return null;

  const valor13Bruto = (salario / 12) * meses;
  let inss = 0;
  if (valor13Bruto <= 1412.00) inss = valor13Bruto * 0.075;
  else if (valor13Bruto <= 2666.68) inss = valor13Bruto * 0.09;
  else if (valor13Bruto <= 4000.03) inss = valor13Bruto * 0.12;
  else inss = valor13Bruto * 0.14;
  inss = Math.min(inss, 908.85);

  const baseIRRF = valor13Bruto - inss;
  let irrf = 0;
  if (baseIRRF > 4664.68) irrf = baseIRRF * 0.275 - 869.36;
  else if (baseIRRF > 3751.06) irrf = baseIRRF * 0.225 - 636.13;
  else if (baseIRRF > 2826.66) irrf = baseIRRF * 0.15 - 354.80;
  else if (baseIRRF > 2259.21) irrf = baseIRRF * 0.075 - 142.80;
  irrf = Math.max(0, irrf);

  const primeiraParcela = valor13Bruto / 2;
  const segundaParcela = valor13Bruto / 2 - inss - irrf;
  const totalLiquido = primeiraParcela + segundaParcela;

  return { valor13Bruto, primeiraParcela, segundaParcela, inss, irrf, totalLiquido, mesesConsiderados: meses };
}

interface DecimoTerceiroCalculatorProps {
  handleCurrencyInput: (value: string, setter: (v: string) => void) => void;
}

export const DecimoTerceiroCalculator = ({ handleCurrencyInput }: DecimoTerceiroCalculatorProps) => {
  const [salario13, setSalario13] = useState('');
  const [mesesTrabalhados, setMesesTrabalhados] = useState('12');

  const calculo13 = useMemo(() => calcular13(salario13, mesesTrabalhados), [salario13, mesesTrabalhados]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados para Cálculo</CardTitle>
          <CardDescription>Informe seu salário bruto e meses trabalhados no ano</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="salario13">Salário Bruto Mensal</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input id="salario13" placeholder="0,00" value={salario13} onChange={(e) => handleCurrencyInput(e.target.value, setSalario13)} className="pl-10" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Meses Trabalhados no Ano</Label>
            <Select value={mesesTrabalhados} onValueChange={setMesesTrabalhados}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((m) => (
                  <SelectItem key={m} value={m.toString()}>{m} {m === 1 ? 'mês' : 'meses'}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Considere meses com 15 dias ou mais trabalhados</p>
          </div>
        </CardContent>
      </Card>

      {calculo13 && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              Resultado da Simulação
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><Info className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs"><p>Valores estimados. O 13º é pago em duas parcelas.</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">13º Bruto ({calculo13.mesesConsiderados}/12)</span><span>{formatCurrency(calculo13.valor13Bruto)}</span></div>
            </div>
            <Separator />
            <div className="space-y-3">
              <div className="p-3 bg-finance/5 rounded-lg">
                <div className="flex justify-between items-center">
                  <div><p className="text-sm font-medium">1ª Parcela</p><p className="text-xs text-muted-foreground">Até 30/11 — sem descontos</p></div>
                  <span className="font-bold text-lg text-finance">{formatCurrency(calculo13.primeiraParcela)}</span>
                </div>
              </div>
              <div className="p-3 bg-primary/5 rounded-lg">
                <div className="flex justify-between items-center">
                  <div><p className="text-sm font-medium">2ª Parcela</p><p className="text-xs text-muted-foreground">Até 20/12 — com descontos</p></div>
                  <span className="font-bold text-lg text-primary">{formatCurrency(calculo13.segundaParcela)}</span>
                </div>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-destructive"><span>INSS</span><span>- {formatCurrency(calculo13.inss)}</span></div>
              <div className="flex justify-between text-sm text-destructive"><span>IRRF</span><span>- {formatCurrency(calculo13.irrf)}</span></div>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <div><p className="font-semibold text-lg text-primary">{formatCurrency(calculo13.totalLiquido)}</p><p className="text-xs text-muted-foreground">Total líquido (1ª + 2ª parcelas)</p></div>
              <Badge variant="secondary">{calculo13.mesesConsiderados} meses</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
