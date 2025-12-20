import { useState, useMemo } from 'react';
import { Calculator, Calendar, Gift, Info, ArrowRight } from 'lucide-react';
import { PageLayout } from '@/components/portal/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const Calculadora = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Estado para calculadora de férias
  const [salarioBruto, setSalarioBruto] = useState<string>('');
  const [diasFerias, setDiasFerias] = useState<string>('30');
  const [venderAbono, setVenderAbono] = useState(false);
  const [diasAbono, setDiasAbono] = useState<string>('10');
  const [adiantamento13, setAdiantamento13] = useState(false);

  // Estado para calculadora de 13º
  const [salario13, setSalario13] = useState<string>('');
  const [mesesTrabalhados, setMesesTrabalhados] = useState<string>('12');

  // Cálculo de férias
  const calculoFerias = useMemo(() => {
    const salario = parseFloat(salarioBruto.replace(/\D/g, '')) / 100 || 0;
    const dias = parseInt(diasFerias) || 30;
    const diasAbonoNum = venderAbono ? (parseInt(diasAbono) || 0) : 0;

    if (salario <= 0) return null;

    // Férias proporcionais
    const valorDiario = salario / 30;
    const valorFerias = valorDiario * dias;
    
    // 1/3 constitucional
    const tercoConstitucional = valorFerias / 3;
    
    // Abono pecuniário (venda de dias)
    const valorAbono = venderAbono ? valorDiario * diasAbonoNum : 0;
    const tercoAbono = valorAbono / 3;
    
    // Adiantamento 13º (50% do salário)
    const valorAdiantamento13 = adiantamento13 ? salario / 2 : 0;

    // Descontos estimados (INSS e IRRF simplificados)
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

    return {
      valorFerias,
      tercoConstitucional,
      valorAbono,
      tercoAbono,
      valorAdiantamento13,
      inss,
      irrf,
      totalBruto,
      totalDescontos,
      totalLiquido,
      diasDescanso: dias - diasAbonoNum
    };
  }, [salarioBruto, diasFerias, venderAbono, diasAbono, adiantamento13]);

  // Cálculo de 13º salário
  const calculo13 = useMemo(() => {
    const salario = parseFloat(salario13.replace(/\D/g, '')) / 100 || 0;
    const meses = parseInt(mesesTrabalhados) || 12;

    if (salario <= 0) return null;

    // 13º proporcional
    const valor13Bruto = (salario / 12) * meses;

    // Descontos estimados (INSS e IRRF)
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

    // Primeira parcela (50% sem descontos)
    const primeiraParcela = valor13Bruto / 2;
    
    // Segunda parcela (50% - descontos)
    const segundaParcela = valor13Bruto / 2 - inss - irrf;

    const totalLiquido = primeiraParcela + segundaParcela;

    return {
      valor13Bruto,
      primeiraParcela,
      segundaParcela,
      inss,
      irrf,
      totalLiquido,
      mesesConsiderados: meses
    };
  }, [salario13, mesesTrabalhados]);

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

        {/* Tabs de calculadora */}
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

          {/* Calculadora de Férias */}
          <TabsContent value="ferias" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dados para Cálculo</CardTitle>
                <CardDescription>
                  Informe seu salário bruto e configure as opções de férias
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="salarioBruto">Salário Bruto Mensal</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      R$
                    </span>
                    <Input
                      id="salarioBruto"
                      placeholder="0,00"
                      value={salarioBruto}
                      onChange={(e) => handleCurrencyInput(e.target.value, setSalarioBruto)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="diasFerias">Dias de Férias</Label>
                  <Select value={diasFerias} onValueChange={setDiasFerias}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
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
                    <Label htmlFor="venderAbono" className="cursor-pointer">
                      Vender dias (Abono Pecuniário)
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Você pode vender até 1/3 das férias
                    </p>
                  </div>
                  <Switch
                    id="venderAbono"
                    checked={venderAbono}
                    onCheckedChange={setVenderAbono}
                  />
                </div>

                {venderAbono && (
                  <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                    <Label htmlFor="diasAbono">Dias a vender</Label>
                    <Select value={diasAbono} onValueChange={setDiasAbono}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10 dias</SelectItem>
                        <SelectItem value="5">5 dias</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="adiantamento13" className="cursor-pointer">
                      Adiantamento de 13º
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Receber 50% do 13º junto com as férias
                    </p>
                  </div>
                  <Switch
                    id="adiantamento13"
                    checked={adiantamento13}
                    onCheckedChange={setAdiantamento13}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Resultado Férias */}
            {calculoFerias && (
              <Card className="border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    Resultado da Simulação
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Valores estimados com base nas alíquotas vigentes. O cálculo final pode variar conforme sua situação específica.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Férias ({diasFerias} dias)</span>
                      <span>{formatCurrency(calculoFerias.valorFerias)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">1/3 Constitucional</span>
                      <span>{formatCurrency(calculoFerias.tercoConstitucional)}</span>
                    </div>
                    {venderAbono && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Abono ({diasAbono} dias)</span>
                          <span>{formatCurrency(calculoFerias.valorAbono)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">1/3 sobre Abono</span>
                          <span>{formatCurrency(calculoFerias.tercoAbono)}</span>
                        </div>
                      </>
                    )}
                    {adiantamento13 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Adiant. 13º (50%)</span>
                        <span>{formatCurrency(calculoFerias.valorAdiantamento13)}</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Total Bruto</span>
                      <span>{formatCurrency(calculoFerias.totalBruto)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-destructive">
                      <span>INSS (estimado)</span>
                      <span>- {formatCurrency(calculoFerias.inss)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-destructive">
                      <span>IRRF (estimado)</span>
                      <span>- {formatCurrency(calculoFerias.irrf)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-lg text-primary">
                        {formatCurrency(calculoFerias.totalLiquido)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total líquido estimado
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {calculoFerias.diasDescanso} dias de descanso
                    </Badge>
                  </div>

                  <Button 
                    className="w-full gap-2" 
                    onClick={() => navigate('/ferias')}
                  >
                    Solicitar Férias
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Calculadora de 13º */}
          <TabsContent value="13salario" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dados para Cálculo</CardTitle>
                <CardDescription>
                  Informe seu salário bruto e meses trabalhados no ano
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="salario13">Salário Bruto Mensal</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                      R$
                    </span>
                    <Input
                      id="salario13"
                      placeholder="0,00"
                      value={salario13}
                      onChange={(e) => handleCurrencyInput(e.target.value, setSalario13)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mesesTrabalhados">Meses Trabalhados no Ano</Label>
                  <Select value={mesesTrabalhados} onValueChange={setMesesTrabalhados}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((m) => (
                        <SelectItem key={m} value={m.toString()}>
                          {m} {m === 1 ? 'mês' : 'meses'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Considere meses com 15 dias ou mais trabalhados
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Resultado 13º */}
            {calculo13 && (
              <Card className="border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    Resultado da Simulação
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>Valores estimados. O 13º é pago em duas parcelas: a primeira até 30/11 e a segunda até 20/12.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>13º Bruto ({calculo13.mesesConsiderados}/12 avos)</span>
                      <span>{formatCurrency(calculo13.valor13Bruto)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-muted/50">
                      <CardContent className="pt-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">1ª Parcela (Nov)</p>
                        <p className="font-semibold text-primary">
                          {formatCurrency(calculo13.primeiraParcela)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Sem descontos</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-muted/50">
                      <CardContent className="pt-4 text-center">
                        <p className="text-xs text-muted-foreground mb-1">2ª Parcela (Dez)</p>
                        <p className="font-semibold text-primary">
                          {formatCurrency(calculo13.segundaParcela)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Com descontos</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-destructive">
                      <span>INSS (2ª parcela)</span>
                      <span>- {formatCurrency(calculo13.inss)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-destructive">
                      <span>IRRF (2ª parcela)</span>
                      <span>- {formatCurrency(calculo13.irrf)}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-lg text-primary">
                        {formatCurrency(calculo13.totalLiquido)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Total líquido estimado (soma das parcelas)
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {calculo13.mesesConsiderados} meses
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Aviso */}
        <Card className="bg-muted/50 border-muted">
          <CardContent className="pt-4">
            <div className="flex gap-3 text-sm text-muted-foreground">
              <Info className="h-5 w-5 shrink-0" />
              <p>
                Os valores apresentados são <strong>estimativas</strong> baseadas nas alíquotas vigentes de INSS e IRRF. 
                O cálculo final pode variar de acordo com sua situação específica, descontos adicionais e políticas da empresa.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Calculadora;
