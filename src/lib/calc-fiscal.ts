// Tabelas fiscais 2025 (Brasil) — valores oficiais vigentes.
// INSS progressivo por faixas (empregado CLT).

export interface FaixaINSS {
  ate: number;
  aliquota: number;
  deducao: number;
}

export const TABELA_INSS_2025: FaixaINSS[] = [
  { ate: 1518.0, aliquota: 0.075, deducao: 0 },
  { ate: 2793.88, aliquota: 0.09, deducao: 22.77 },
  { ate: 4190.83, aliquota: 0.12, deducao: 106.59 },
  { ate: 8157.41, aliquota: 0.14, deducao: 190.4 },
];

export const TETO_INSS_2025 = 8157.41;
export const CONTRIBUICAO_MAX_INSS_2025 = 951.63;

export interface FaixaIRRF {
  ate: number;
  aliquota: number;
  deducao: number;
}

// Tabela IRRF 2025 com desconto simplificado opcional de R$ 607,20
export const TABELA_IRRF_2025: FaixaIRRF[] = [
  { ate: 2428.8, aliquota: 0, deducao: 0 },
  { ate: 2826.65, aliquota: 0.075, deducao: 182.16 },
  { ate: 3751.05, aliquota: 0.15, deducao: 394.16 },
  { ate: 4664.68, aliquota: 0.225, deducao: 675.49 },
  { ate: Infinity, aliquota: 0.275, deducao: 908.73 },
];

export const DEDUCAO_DEPENDENTE_IRRF = 189.59;

export function calcularINSS(salarioBruto: number): number {
  if (salarioBruto <= 0) return 0;
  if (salarioBruto >= TETO_INSS_2025) return CONTRIBUICAO_MAX_INSS_2025;
  const faixa = TABELA_INSS_2025.find((f) => salarioBruto <= f.ate);
  if (!faixa) return CONTRIBUICAO_MAX_INSS_2025;
  return +(salarioBruto * faixa.aliquota - faixa.deducao).toFixed(2);
}

export function calcularIRRF(baseCalculo: number, dependentes = 0): number {
  const base = Math.max(0, baseCalculo - dependentes * DEDUCAO_DEPENDENTE_IRRF);
  const faixa = TABELA_IRRF_2025.find((f) => base <= f.ate);
  if (!faixa || faixa.aliquota === 0) return 0;
  return +Math.max(0, base * faixa.aliquota - faixa.deducao).toFixed(2);
}

export interface ResultadoFerias {
  salarioBase: number;
  dias: number;
  proporcionalFerias: number;
  tercoConstitucional: number;
  bruto: number;
  inss: number;
  baseIRRF: number;
  irrf: number;
  liquido: number;
}

export function calcularFerias(
  salario: number,
  dias = 30,
  dependentes = 0,
  abonoPecuniario = false,
): ResultadoFerias {
  const diasGozo = abonoPecuniario ? Math.max(0, dias - 10) : dias;
  const diasVendidos = abonoPecuniario ? 10 : 0;
  const proporcional = (salario / 30) * diasGozo;
  const terco = proporcional / 3;
  const abono = (salario / 30) * diasVendidos + (salario / 30) * diasVendidos / 3;
  const bruto = proporcional + terco + abono;
  const baseTributavel = proporcional + terco; // abono pecuniário é isento
  const inss = calcularINSS(baseTributavel);
  const baseIRRF = baseTributavel - inss;
  const irrf = calcularIRRF(baseIRRF, dependentes);
  const liquido = bruto - inss - irrf;
  return {
    salarioBase: salario,
    dias,
    proporcionalFerias: +proporcional.toFixed(2),
    tercoConstitucional: +terco.toFixed(2),
    bruto: +bruto.toFixed(2),
    inss,
    baseIRRF: +baseIRRF.toFixed(2),
    irrf,
    liquido: +liquido.toFixed(2),
  };
}

export interface ResultadoDecimo {
  salarioBase: number;
  mesesTrabalhados: number;
  primeiraParcela: number;
  segundaParcelaBruta: number;
  inss: number;
  irrf: number;
  segundaParcelaLiquida: number;
  totalLiquido: number;
}

export function calcularDecimoTerceiro(
  salario: number,
  mesesTrabalhados = 12,
  dependentes = 0,
): ResultadoDecimo {
  const proporcional = (salario / 12) * Math.min(12, Math.max(0, mesesTrabalhados));
  const primeira = +(proporcional / 2).toFixed(2);
  const inss = calcularINSS(proporcional);
  const baseIRRF = proporcional - inss;
  const irrf = calcularIRRF(baseIRRF, dependentes);
  const segundaLiquida = +(proporcional - primeira - inss - irrf).toFixed(2);
  return {
    salarioBase: salario,
    mesesTrabalhados,
    primeiraParcela: primeira,
    segundaParcelaBruta: +(proporcional - primeira).toFixed(2),
    inss,
    irrf,
    segundaParcelaLiquida: segundaLiquida,
    totalLiquido: +(proporcional - inss - irrf).toFixed(2),
  };
}
