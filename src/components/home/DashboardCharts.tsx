import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { Clock, TrendingUp, Target, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// --- Tooltip ---
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

// --- Hours Chart (from registros_ponto) ---
const DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function computeHoursFromPunches(punches: Array<{ tipo: string; data_hora: string }>) {
  // Group by day
  const byDay = new Map<string, Array<{ tipo: string; data_hora: string }>>();
  punches.forEach((p) => {
    const day = p.data_hora.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, []);
    byDay.get(day)!.push(p);
  });

  const result: Array<{ dia: string; horas: number }> = [];

  byDay.forEach((dayPunches, dateStr) => {
    const date = new Date(dateStr);
    const dayLabel = DAY_LABELS[date.getUTCDay()];
    const sorted = dayPunches.sort((a, b) => a.data_hora.localeCompare(b.data_hora));

    let totalMs = 0;
    const entrada = sorted.find((p) => p.tipo === 'entrada');
    const saidaAlmoco = sorted.find((p) => p.tipo === 'saida_almoco');
    const retornoAlmoco = sorted.find((p) => p.tipo === 'retorno_almoco');
    const saida = sorted.find((p) => p.tipo === 'saida');

    if (entrada && saidaAlmoco) {
      totalMs += new Date(saidaAlmoco.data_hora).getTime() - new Date(entrada.data_hora).getTime();
    }
    if (retornoAlmoco && saida) {
      totalMs += new Date(saida.data_hora).getTime() - new Date(retornoAlmoco.data_hora).getTime();
    }
    // If only entrada and saida (no lunch break)
    if (entrada && saida && !saidaAlmoco && !retornoAlmoco) {
      totalMs = new Date(saida.data_hora).getTime() - new Date(entrada.data_hora).getTime();
    }

    result.push({ dia: dayLabel, horas: Math.round((totalMs / 3600000) * 10) / 10 });
  });

  return result.slice(-5); // last 5 days
}

export function HoursChart() {
  const { user, profile } = useAuth();
  const [data, setData] = useState<Array<{ dia: string; horas: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchHours = async () => {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: punches } = await supabase
        .from('registros_ponto')
        .select('tipo, data_hora')
        .eq('user_id', user.id)
        .gte('data_hora', weekAgo.toISOString())
        .order('data_hora', { ascending: true });

      if (punches && punches.length > 0) {
        setData(computeHoursFromPunches(punches));
      }
      setLoading(false);
    };
    fetchHours();
  }, [user]);

  const totalHours = data.reduce((sum, d) => sum + d.horas, 0);
  const valorExtra = profile?.valor_hora_extra || 0;
  const estimativaExtra = totalHours > 44 ? (totalHours - 44) * valorExtra : 0; // Simplified logic

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-semibold text-foreground">Horas Trabalhadas</h3>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-medium">
              {loading ? '...' : `${totalHours.toFixed(1)}h esta semana`}
            </p>
            {valorExtra > 0 && totalHours > 0 && (
              <p className="text-[10px] text-emerald-600 font-bold">
                Estimativa Extra: R$ {(totalHours * (valorExtra / 160) * 0.5).toFixed(2)}
              </p>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum registro de ponto esta semana.</p>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={data} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis hide domain={[0, 10]} />
              <Tooltip content={<ChartTooltip suffix="h" />} cursor={{ fill: 'hsl(var(--accent))' }} />
              <Bar dataKey="horas" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// --- Salary Chart (from holerites) ---
const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr',
  '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago',
  '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez',
};

export function SalaryChart() {
  const { user } = useAuth();
  const [data, setData] = useState<Array<{ mes: string; valor: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchSalary = async () => {
      const { data: holerites } = await supabase
        .from('holerites')
        .select('competencia, salario_liquido')
        .eq('user_id', user.id)
        .order('competencia', { ascending: true })
        .limit(6);

      if (holerites && holerites.length > 0) {
        setData(
          holerites.map((h) => ({
            mes: MONTH_LABELS[h.competencia.split('-')[1]] || h.competencia,
            valor: Number(h.salario_liquido),
          }))
        );
      }
      setLoading(false);
    };
    fetchSalary();
  }, [user]);

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-semibold text-foreground">Evolução Salarial</h3>
          </div>
          <span className="text-xs text-muted-foreground">
            {loading ? '...' : `Últimos ${data.length} meses`}
          </span>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum holerite cadastrado.</p>
        ) : (
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={data}>
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
              <Area type="monotone" dataKey="valor" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#salaryGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

// --- Goals Progress (from metas_colaborador) ---
export function GoalsProgress() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Array<{ titulo: string; progresso: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchGoals = async () => {
      const { data } = await supabase
        .from('metas_colaborador')
        .select('titulo, progresso')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        setGoals(data);
      }
      setLoading(false);
    };
    fetchGoals();
  }, [user]);

  return (
    <Card className="border-border/50 shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-semibold text-foreground">Progresso de Metas</h3>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pb-4">
        {loading ? (
          <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : goals.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma meta cadastrada.</p>
        ) : (
          goals.map((goal) => (
            <div key={goal.titulo} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-foreground">{goal.titulo}</span>
                <span className="text-xs text-muted-foreground">{goal.progresso}%</span>
              </div>
              <Progress value={goal.progresso} className="h-2" />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
