import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, Minus, Star, Award, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MediaCompetencia {
  competencia_id: string;
  nome: string;
  categoria: string;
  media: number;
  mediaEquipe: number;
}

interface EvolucaoCiclo {
  ciclo_id: string;
  titulo: string;
  media: number;
  data_fim: string;
}

interface FeedbackDashboardProps {
  mediasCompetencias: MediaCompetencia[];
  evolucaoCiclos: EvolucaoCiclo[];
  mediaGeral: number;
  totalAvaliacoes: number;
}

const CORES = {
  primary: 'hsl(var(--primary))',
  hr: 'hsl(var(--hr))',
  finance: 'hsl(var(--finance))',
  projects: 'hsl(var(--projects))',
};

export function FeedbackDashboard({ 
  mediasCompetencias, 
  evolucaoCiclos, 
  mediaGeral,
  totalAvaliacoes 
}: FeedbackDashboardProps) {
  // Preparar dados para o radar chart
  const radarData = mediasCompetencias.map(comp => ({
    competencia: comp.nome.length > 12 ? comp.nome.substring(0, 12) + '...' : comp.nome,
    voce: comp.media,
    equipe: comp.mediaEquipe,
    fullMax: 5,
  }));

  // Preparar dados para o gráfico de barras
  const barData = mediasCompetencias.map(comp => ({
    nome: comp.nome.length > 10 ? comp.nome.substring(0, 10) + '...' : comp.nome,
    'Sua Nota': comp.media,
    'Média Equipe': comp.mediaEquipe,
  }));

  // Preparar dados para evolução
  const lineData = evolucaoCiclos.map(ciclo => ({
    ciclo: ciclo.titulo.length > 8 ? ciclo.titulo.substring(0, 8) + '...' : ciclo.titulo,
    media: ciclo.media,
    data: format(new Date(ciclo.data_fim), 'MMM/yy', { locale: ptBR }),
  }));

  // Calcular tendência
  const getTendencia = () => {
    if (evolucaoCiclos.length < 2) return 'neutro';
    const ultimo = evolucaoCiclos[evolucaoCiclos.length - 1]?.media || 0;
    const penultimo = evolucaoCiclos[evolucaoCiclos.length - 2]?.media || 0;
    if (ultimo > penultimo + 0.1) return 'alta';
    if (ultimo < penultimo - 0.1) return 'baixa';
    return 'neutro';
  };

  const tendencia = getTendencia();

  // Agrupar competências por categoria
  const categorias = mediasCompetencias.reduce((acc, comp) => {
    if (!acc[comp.categoria]) acc[comp.categoria] = [];
    acc[comp.categoria].push(comp);
    return acc;
  }, {} as Record<string, MediaCompetencia[]>);

  // Top e pontos de melhoria
  const sortedComps = [...mediasCompetencias].sort((a, b) => b.media - a.media);
  const topCompetencias = sortedComps.slice(0, 3);
  const melhorar = sortedComps.slice(-3).reverse();

  if (mediasCompetencias.length === 0 || totalAvaliacoes === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium">Nenhum resultado disponível</p>
          <p className="text-sm mt-2">Você precisa receber avaliações para ver seus resultados.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/20 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Média Geral</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-3xl font-bold">{mediaGeral.toFixed(1)}</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${star <= Math.round(mediaGeral) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/30'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              {tendencia === 'alta' && <TrendingUp className="h-8 w-8 text-green-500" />}
              {tendencia === 'baixa' && <TrendingDown className="h-8 w-8 text-red-500" />}
              {tendencia === 'neutro' && <Minus className="h-8 w-8 text-muted-foreground" />}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-finance/20 to-finance/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total de Avaliações</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-3xl font-bold">{totalAvaliacoes}</span>
              <Users className="h-6 w-6 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-hr/20 to-hr/5">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Ciclos Avaliados</p>
            <span className="text-3xl font-bold">{evolucaoCiclos.length}</span>
          </CardContent>
        </Card>
      </div>

      {/* Radar Chart - Comparativo */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Comparativo por Competência
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis 
                  dataKey="competencia" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <PolarRadiusAxis 
                  domain={[0, 5]} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                />
                <Radar
                  name="Você"
                  dataKey="voce"
                  stroke={CORES.primary}
                  fill={CORES.primary}
                  fillOpacity={0.4}
                />
                <Radar
                  name="Média Equipe"
                  dataKey="equipe"
                  stroke={CORES.hr}
                  fill={CORES.hr}
                  fillOpacity={0.2}
                />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Gráfico de Barras - Detalhado */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Notas por Competência</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" domain={[0, 5]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis 
                  type="category" 
                  dataKey="nome" 
                  width={80} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="Sua Nota" fill={CORES.primary} radius={[0, 4, 4, 0]} />
                <Bar dataKey="Média Equipe" fill={CORES.hr} radius={[0, 4, 4, 0]} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Evolução entre Ciclos */}
      {evolucaoCiclos.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-finance" />
              Evolução entre Ciclos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="data" 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    domain={[0, 5]} 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [value.toFixed(2), 'Média']}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="media" 
                    stroke={CORES.finance}
                    strokeWidth={3}
                    dot={{ fill: CORES.finance, strokeWidth: 2 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Competências e Pontos de Melhoria */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-green-600 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Seus Pontos Fortes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {topCompetencias.map((comp, index) => (
              <div key={comp.competencia_id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-green-600">#{index + 1}</span>
                  <span className="font-medium">{comp.nome}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={(comp.media / 5) * 100} className="w-20 h-2" />
                  <span className="font-semibold text-green-600">{comp.media.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg text-amber-600 flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Áreas para Desenvolver
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {melhorar.map((comp, index) => (
              <div key={comp.competencia_id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-amber-600">#{index + 1}</span>
                  <span className="font-medium">{comp.nome}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={(comp.media / 5) * 100} className="w-20 h-2" />
                  <span className="font-semibold text-amber-600">{comp.media.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Detalhamento por Categoria */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Detalhamento por Categoria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(categorias).map(([categoria, comps]) => {
              const mediaCategoria = comps.reduce((acc, c) => acc + c.media, 0) / comps.length;
              return (
                <div key={categoria}>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="capitalize">{categoria}</Badge>
                    <span className="text-sm font-medium">Média: {mediaCategoria.toFixed(1)}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {comps.map(comp => (
                      <div 
                        key={comp.competencia_id} 
                        className="p-2 rounded-lg bg-muted/50 flex items-center justify-between"
                      >
                        <span className="text-sm truncate">{comp.nome}</span>
                        <span className="text-sm font-semibold">{comp.media.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
