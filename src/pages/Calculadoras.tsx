import { useMemo, useState } from "react";
import { ModuleHeader } from "@/components/layout/ModuleHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, Palmtree, Gift } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import {
  calcularFerias,
  calcularDecimoTerceiro,
  calcularINSS,
  calcularIRRF,
} from "@/lib/calc-fiscal";

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between py-2 border-b border-border/60 last:border-0 ${
        strong ? "text-base font-semibold" : "text-sm"
      }`}
    >
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "text-primary" : "text-foreground"}>{value}</span>
    </div>
  );
}

export default function Calculadoras() {
  const [salario, setSalario] = useState(4500);
  const [dependentes, setDependentes] = useState(0);
  const [dias, setDias] = useState(30);
  const [abono, setAbono] = useState(false);
  const [meses, setMeses] = useState(12);

  const ferias = useMemo(
    () => calcularFerias(salario, dias, dependentes, abono),
    [salario, dias, dependentes, abono],
  );
  const decimo = useMemo(
    () => calcularDecimoTerceiro(salario, meses, dependentes),
    [salario, meses, dependentes],
  );
  const inssMensal = useMemo(() => calcularINSS(salario), [salario]);
  const irrfMensal = useMemo(
    () => calcularIRRF(salario - inssMensal, dependentes),
    [salario, inssMensal, dependentes],
  );
  const liquidoMensal = salario - inssMensal - irrfMensal;

  return (
    <div className="space-y-6">
      <ModuleHeader
        icon={Calculator}
        title="Calculadoras Fiscais"
        description="Estimativas oficiais de Férias, 13º, INSS e IRRF (tabelas 2025)."
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parâmetros base</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="salario">Salário bruto mensal</Label>
            <Input
              id="salario"
              type="number"
              min={0}
              step={100}
              value={salario}
              onChange={(e) => setSalario(Number(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dependentes">Dependentes (IRRF)</Label>
            <Input
              id="dependentes"
              type="number"
              min={0}
              max={20}
              value={dependentes}
              onChange={(e) => setDependentes(Number(e.target.value) || 0)}
            />
          </div>
          <div className="rounded-md border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground mb-1">Prévia mensal</div>
            <Row label="INSS" value={formatCurrency(inssMensal)} />
            <Row label="IRRF" value={formatCurrency(irrfMensal)} />
            <Row label="Líquido" value={formatCurrency(liquidoMensal)} strong />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="ferias">
        <TabsList>
          <TabsTrigger value="ferias" className="gap-2">
            <Palmtree className="h-4 w-4" /> Férias
          </TabsTrigger>
          <TabsTrigger value="decimo" className="gap-2">
            <Gift className="h-4 w-4" /> 13º Salário
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ferias">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Simulador de Férias</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dias">Dias de férias</Label>
                  <Input
                    id="dias"
                    type="number"
                    min={5}
                    max={30}
                    value={dias}
                    onChange={(e) => setDias(Number(e.target.value) || 0)}
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <Label htmlFor="abono" className="cursor-pointer">
                      Abono pecuniário (vender 10 dias)
                    </Label>
                    <p className="text-xs text-muted-foreground">Parcela isenta de IR/INSS.</p>
                  </div>
                  <Switch id="abono" checked={abono} onCheckedChange={setAbono} />
                </div>
              </div>
              <div className="rounded-md border bg-card p-4">
                <Row label="Proporcional aos dias" value={formatCurrency(ferias.proporcionalFerias)} />
                <Row label="1/3 constitucional" value={formatCurrency(ferias.tercoConstitucional)} />
                <Row label="Bruto total" value={formatCurrency(ferias.bruto)} />
                <Row label="INSS" value={`- ${formatCurrency(ferias.inss)}`} />
                <Row label="IRRF" value={`- ${formatCurrency(ferias.irrf)}`} />
                <Row label="Líquido a receber" value={formatCurrency(ferias.liquido)} strong />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="decimo">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Simulador de 13º Salário</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="meses">Meses trabalhados no ano</Label>
                  <Input
                    id="meses"
                    type="number"
                    min={1}
                    max={12}
                    value={meses}
                    onChange={(e) => setMeses(Number(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Frações a partir de 15 dias contam como mês integral.
                  </p>
                </div>
              </div>
              <div className="rounded-md border bg-card p-4">
                <Row label="1ª parcela (até 30/nov)" value={formatCurrency(decimo.primeiraParcela)} />
                <Row label="2ª parcela bruta" value={formatCurrency(decimo.segundaParcelaBruta)} />
                <Row label="INSS (na 2ª parcela)" value={`- ${formatCurrency(decimo.inss)}`} />
                <Row label="IRRF (na 2ª parcela)" value={`- ${formatCurrency(decimo.irrf)}`} />
                <Row
                  label="2ª parcela líquida (até 20/dez)"
                  value={formatCurrency(decimo.segundaParcelaLiquida)}
                />
                <Row label="Total líquido no ano" value={formatCurrency(decimo.totalLiquido)} strong />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <p className="text-xs text-muted-foreground">
        * Valores estimativos com base nas tabelas oficiais vigentes em 2025. Não substituem o cálculo
        formal do RH.
      </p>
    </div>
  );
}
