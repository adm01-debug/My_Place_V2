import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type { Holerite } from '@/hooks/useHolerites';

interface SalaryChartProps {
  holerites: Holerite[];
}

const mesesAbrev = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export function SalaryChart({ holerites }: SalaryChartProps) {
  const chartData = useMemo(() => {
    // Pegar últimos 12 meses ordenados cronologicamente
    const sorted = [...holerites]
      .sort((a, b) => a.ano !== b.ano ? a.ano - b.ano : a.mes - b.mes)
      .slice(-12);

    if (sorted.length === 0) return null;

    const values = sorted.map(h => h.salario_liquido);
    const maxVal = Math.max(...values);
    const minVal = Math.min(...values);
    const range = maxVal - minVal || 1;

    // Tendência: comparar último com penúltimo
    const ultimo = values[values.length - 1];
    const penultimo = values.length > 1 ? values[values.length - 2] : ultimo;
    const variacao = ultimo - penultimo;
    const percentual = penultimo > 0 ? ((variacao / penultimo) * 100).toFixed(1) : '0.0';

    return {
      points: sorted.map((h, i) => ({
        label: mesesAbrev[h.mes - 1],
        value: h.salario_liquido,
        year: h.ano,
        // Normalizar para 0-100% do height
        y: ((h.salario_liquido - minVal) / range) * 100,
      })),
      variacao,
      percentual,
      ultimo,
    };
  }, [holerites]);

  if (!chartData || chartData.points.length < 2) return null;

  const { points, variacao, percentual, ultimo } = chartData;

  // SVG dimensions
  const width = 100;
  const height = 50;
  const padding = 5;

  const pathPoints = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * (width - padding * 2);
    const y = height - padding - (p.y / 100) * (height - padding * 2);
    return { x, y };
  });

  const linePath = pathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${pathPoints[pathPoints.length - 1].x},${height - padding} L${pathPoints[0].x},${height - padding} Z`;

  const TrendIcon = variacao > 0 ? TrendingUp : variacao < 0 ? TrendingDown : Minus;
  const trendColor = variacao > 0 ? 'text-finance' : variacao < 0 ? 'text-destructive' : 'text-muted-foreground';

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Evolução Salarial
        </h3>
        <div className={`flex items-center gap-1 text-sm font-medium ${trendColor}`}>
          <TrendIcon className="w-4 h-4" />
          <span>{variacao >= 0 ? '+' : ''}{percentual}%</span>
        </div>
      </div>

      {/* Mini Chart */}
      <div className="relative mb-3">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24" preserveAspectRatio="none">
          {/* Gradient area */}
          <defs>
            <linearGradient id="salaryGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#salaryGradient)" />
          <path d={linePath} fill="none" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Dot on last point */}
          <circle
            cx={pathPoints[pathPoints.length - 1].x}
            cy={pathPoints[pathPoints.length - 1].y}
            r="2"
            fill="hsl(var(--primary))"
            stroke="hsl(var(--background))"
            strokeWidth="1"
          />
        </svg>
      </div>

      {/* Labels */}
      <div className="flex justify-between text-xs text-muted-foreground">
        {points.filter((_, i) => i === 0 || i === points.length - 1 || i === Math.floor(points.length / 2)).map((p, i) => (
          <span key={i}>{p.label}/{String(p.year).slice(-2)}</span>
        ))}
      </div>

      {/* Current value */}
      <div className="mt-2 text-center">
        <p className="text-lg font-bold text-foreground">{formatCurrency(ultimo)}</p>
        <p className="text-xs text-muted-foreground">Último líquido</p>
      </div>
    </Card>
  );
}