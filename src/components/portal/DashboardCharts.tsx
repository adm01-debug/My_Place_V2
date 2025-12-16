import { Card } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Mock data for salary evolution
const salaryData = [
  { month: 'Jul', value: 3180 },
  { month: 'Ago', value: 3250 },
  { month: 'Set', value: 3320 },
  { month: 'Out', value: 3249 },
  { month: 'Nov', value: 3532 },
  { month: 'Dez', value: 3847 },
];

// Mock data for hours distribution
const hoursData = [
  { type: 'Normais', hours: 156, fill: 'hsl(var(--primary))' },
  { type: 'Extra 50%', hours: 8, fill: 'hsl(var(--finance))' },
  { type: 'Extra 100%', hours: 4.5, fill: 'hsl(var(--projects))' },
  { type: 'Noturno', hours: 10, fill: 'hsl(var(--hr))' },
];

// Mock data for goal progress
const goalData = [
  { name: 'Meta', value: 75, fill: 'hsl(var(--primary))' },
  { name: 'Restante', value: 25, fill: 'hsl(var(--muted))' },
];

const chartConfig = {
  value: {
    label: 'Salário',
    color: 'hsl(var(--primary))',
  },
  hours: {
    label: 'Horas',
    color: 'hsl(var(--primary))',
  },
};

export function SalaryEvolutionChart() {
  return (
    <Card className="p-4 border-0 shadow-card">
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-foreground">Evolução Salarial</h4>
        <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
      </div>
      <ChartContainer config={chartConfig} className="h-[140px] w-full">
        <LineChart data={salaryData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <XAxis 
            dataKey="month" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => `${(value / 1000).toFixed(1)}k`}
          />
          <ChartTooltip 
            content={
              <ChartTooltipContent 
                formatter={(value) => [`R$ ${Number(value).toLocaleString('pt-BR')}`, 'Líquido']}
              />
            } 
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ fill: 'hsl(var(--primary))', strokeWidth: 0, r: 3 }}
            activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
          />
        </LineChart>
      </ChartContainer>
    </Card>
  );
}

export function HoursDistributionChart() {
  return (
    <Card className="p-4 border-0 shadow-card">
      <div className="mb-3">
        <h4 className="text-sm font-semibold text-foreground">Horas Trabalhadas</h4>
        <p className="text-xs text-muted-foreground">Distribuição do mês</p>
      </div>
      <ChartContainer config={chartConfig} className="h-[140px] w-full">
        <BarChart data={hoursData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
          <XAxis type="number" hide />
          <YAxis 
            type="category" 
            dataKey="type" 
            axisLine={false} 
            tickLine={false}
            tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            width={60}
          />
          <ChartTooltip 
            content={
              <ChartTooltipContent 
                formatter={(value) => [`${value}h`, 'Horas']}
              />
            } 
          />
          <Bar 
            dataKey="hours" 
            radius={[0, 4, 4, 0]}
            barSize={16}
          />
        </BarChart>
      </ChartContainer>
    </Card>
  );
}

export function GoalProgressChart() {
  return (
    <Card className="p-4 border-0 shadow-card">
      <div className="mb-2">
        <h4 className="text-sm font-semibold text-foreground">Meta de Vendas</h4>
        <p className="text-xs text-muted-foreground">Dezembro/2025</p>
      </div>
      <div className="flex items-center gap-4">
        <ChartContainer config={chartConfig} className="h-[100px] w-[100px]">
          <PieChart>
            <Pie
              data={goalData}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={45}
              paddingAngle={2}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
            >
              {goalData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <div className="flex-1">
          <p className="text-2xl font-bold text-foreground">75%</p>
          <p className="text-xs text-muted-foreground">R$ 15.000 / R$ 20.000</p>
          <p className="text-xs text-finance font-medium mt-1">+R$ 200 bônus potencial</p>
        </div>
      </div>
    </Card>
  );
}
