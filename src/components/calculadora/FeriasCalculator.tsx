import { useState, useMemo } from 'react';
import { Calendar, Info, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { formatCurrency } from '@/lib/utils';

function calcularFerias(salarioBruto: string, diasFerias: string, venderAbono: boolean, diasAbono: string, adiantamento13: boolean) {
  const salario = parseFloat(salarioBruto.replace(/\D/g, '')) / 100 || 0;
  const dias = parseInt(diasFerias) || 30;
  const diasAbonoNum = venderAbono ? (parseInt(diasAbono) || 0) : 0;

  if (salario <= 0) return null;

  const valorDiario = salario / 30;
  const valorFerias = valorDiario * dias;
  const tercoConstitucional = valorFerias / 3;
  const valorAbono = venderAbono ? valorDiario * diasAbonoNum : 0;
  const tercoAbono = valorAbono / 3;
  const valorAdiantamento13 = adiantamento13 ? salario / 2 : 0;

  const baseINSS = valorFerias + tercoConstitucional;
  let inss = 0;
  if (baseINSS <= 1412.00) inss = baseINSS * 0.075;
  else if (baseINSS <= 2666.68) inss = baseINSS * 0.09;
  else if (baseINSS <= 4000.03) inss = baseINSS * 0.12;
  else inss = baseINSS * 0.14;
  inss = Math.min(inss, 908.85);

  const baseIRRF = baseINSS - inss;
  let irrf = 0;
  if (baseIRRF > 4664.68) irrf = baseIRRF * 0.275 - 869.36;
  else if (baseIRRF > 3751.06) irrf = baseIRRF * 0.225 - 636.13;
  else if (baseIRRF > 2826.66) irrf = baseIRRF * 0.15 - 354.80;
  else if (baseIRRF > 2259.21) irrf = baseIRRF * 0.075 - 142.80;
  irrf = Math.max(0, irrf);

  const totalBruto = valorFerias + tercoConstitucional + valorAbono + tercoAbono + valorAdiantamento13;
  const totalDescontos = inss + irrf;
  const totalLiquido = totalBruto - totalDescontos;

  return { valorFerias, tercoConstitucional, valorAbono, tercoAbono, valorAdiantamento13, inss, irrf, totalBruto, totalDescontos, totalLiquido, diasDescanso: dias - diasAbonoNum };
}

interface FeriasCalculatorProps {
  handleCurrencyInput: (value: string, setter: (v: string) => void) => void;
}

export const FeriasCalculator = ({ handleCurrencyInput }: FeriasCalculatorProps) => {
  const navigate = useNavigate();
  const [salarioBruto, setSalarioBruto] = useState('');
  const [diasFerias, setDiasFerias] = useState('30');
  const [venderAbono, setVenderAbono] = useState(false);
  const [diasAbono, setDiasAbono] = useState('10');
  const [adiantamento13, setAdiantamento13] = useState(false);

  const calculoFerias = useMemo(
    () => calcularFerias(salarioBruto, diasFerias, venderAbono, diasAbono, adiantamento13),
    [salarioBruto, diasFerias, venderAbono, diasAbono, adiantamento13]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados para Cálculo</CardTitle>
          <CardDescription>Informe seu salário bruto e configure as opções de férias</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="salarioBruto">Salário Bruto Mensal</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
              <Input id="salarioBruto" placeholder="0,00" value={salarioBruto} onChange={(e) => handleCurrencyInput(e.target.value, setSalarioBruto)} className="pl-10" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dias de Férias</Label>
            <Select value={diasFerias} onValueChange={setDiasFerias}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 dias (completo)</SelectItem>
                <SelectItem value="20">20 dias</SelectItem>
                <SelectItem value="15">15 dias</SelectItem>
                <SelectItem value="10">10 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="venderAbono" className="cursor-pointer">Vender dias (Abono Pecuniário)</Label>
              <p className="text-xs text-muted-foreground">Você pode vender até 1/3 das férias</p>
            </div>
            <Switch id="venderAbono" checked={venderAbono} onCheckedChange={setVenderAbono} />
          </div>

          {venderAbono && (
            <div className="space-y-2 pl-4 border-l-2 border-primary/20">
              <Label>Dias a vender</Label>
              <Select value={diasAbono} onValueChange={setDiasAbono}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 dias</SelectItem>
                  <SelectItem value="5">5 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="adiantamento13" className="cursor-pointer">Adiantamento de 13º</Label>
              <p className="text-xs text-muted-foreground">Receber 50% do 13º junto com as férias</p>
            </div>
            <Switch id="adiantamento13" checked={adiantamento13} onCheckedChange={setAdiantamento13} />
          </div>
        </CardContent>
      </Card>

      {calculoFerias && (
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              Resultado da Simulação
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger><Info className="h-4 w-4 text-muted-foreground" /></TooltipTrigger>
                  <TooltipContent className="max-w-xs"><p>Valores estimados com base nas alíquotas vigentes.</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Férias ({diasFerias} dias)</span><span>{formatCurrency(calculoFerias.valorFerias)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">1/3 Constitucional</span><span>{formatCurrency(calculoFerias.tercoConstitucional)}</span></div>
              {venderAbono && (
                <>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Abono ({diasAbono} dias)</span><span>{formatCurrency(calculoFerias.valorAbono)}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">1/3 sobre Abono</span><span>{formatCurrency(calculoFerias.tercoAbono)}</span></div>
                </>
              )}
              {adiantamento13 && (
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Adiant. 13º (50%)</span><span>{formatCurrency(calculoFerias.valorAdiantamento13)}</span></div>
              )}
            </div>
            <Separator />
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium"><span>Total Bruto</span><span>{formatCurrency(calculoFerias.totalBruto)}</span></div>
              <div className="flex justify-between text-sm text-destructive"><span>INSS (estimado)</span><span>- {formatCurrency(calculoFerias.inss)}</span></div>
              <div className="flex justify-between text-sm text-destructive"><span>IRRF (estimado)</span><span>- {formatCurrency(calculoFerias.irrf)}</span></div>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-lg text-primary">{formatCurrency(calculoFerias.totalLiquido)}</p>
                <p className="text-xs text-muted-foreground">Total líquido estimado</p>
              </div>
              <Badge variant="secondary">{calculoFerias.diasDescanso} dias de descanso</Badge>
            </div>
            <Button className="w-full gap-2" onClick={() => navigate('/ferias')}>Solicitar Férias<ArrowRight className="h-4 w-4" /></Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
