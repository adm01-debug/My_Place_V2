import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { Clock, TrendingUp, Target } from 'lucide-react';

const hoursData = [
  { dia: 'Seg', horas: 8.2 },
  { dia: 'Ter', horas: 7.8 },
  { dia: 'Qua', horas: 8.5 },
  { dia: 'Qui', horas: 8.0 },
  { dia: 'Sex', horas: 7.5 },
];

const salaryData = [
  { mes: 'Jan', valor: 4200 },
  { mes: 'Fev', valor: 4200 },
  { mes: 'Mar', valor: 4350 },
  { mes: 'Abr', valor: 4350 },
  { mes: 'Mai', valor: 4500 },
  { mes: 'Jun', valor: 4500 },
];

const goalsData = [
  { name: 'Treinamentos', progress: 75 },
  { name: 'Projetos entregues', progress: 60 },
  { name: 'Avaliação 360°', progress: 40 },
  { name: 'Certificações', progress: 25 },
];

function ChartTooltip({ active, payload, label, suffix }: { active?: boolean; payload?: Array<{ value: number }>; label?: string; suffix?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">
        {suffix === 'R$' ? `R$ ${payload[0].value.toLocaleString('pt-BR')}` : `${payload[0].value}${suffix || ''}`}
      </p>
    </div>
  );
}

export function HoursChart() {
  const totalHours = hoursData.reduce((sum, d) => sum + d.horas, 0);
  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-foreground">Horas Trabalhadas</h3>
          </div>
          <span className="text-xs text-muted-foreground">{totalHours.toFixed(1)}h esta semana</span>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={hoursData} barSize={24}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis hide domain={[0, 10]} />
            <Tooltip content={<ChartTooltip suffix="h" />} cursor={{ fill: 'hsl(var(--accent))' }} />
            <Bar dataKey="horas" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function SalaryChart() {
  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-foreground">Evolução Salarial</h3>
          </div>
          <span className="text-xs text-muted-foreground">Últimos 6 meses</span>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <ResponsiveContainer width="100%" height={140}>
          <AreaChart data={salaryData}>
            <defs>
              <linearGradient id="salaryGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis hide domain={['dataMin - 200', 'dataMax + 200']} />
            <Tooltip content={<ChartTooltip suffix="R$" />} />
            <Area 
              type="monotone" 
              dataKey="valor" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2} 
              fill="url(#salaryGradient)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function GoalsProgress() {
  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-foreground">Progresso de Metas</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pb-4">
        {goalsData.map((goal) => (
          <div key={goal.name} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">{goal.name}</span>
              <span className="text-xs text-muted-foreground">{goal.progress}%</span>
            </div>
            <Progress value={goal.progress} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
