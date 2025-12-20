import { useState } from 'react';
import { Smile, Meh, Frown, Heart, TrendingUp, CheckCircle2, Clock, BarChart3, Send, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { PageLayout } from '@/components/portal/PageLayout';
import { StatCard } from '@/components/portal/StatCard';
import { Skeleton } from '@/components/ui/skeleton';
import { usePesquisasClima } from '@/hooks/usePesquisasClima';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Legend } from 'recharts';
import { cn } from '@/lib/utils';

const CORES = {
  satisfacao: 'hsl(var(--primary))',
  engajamento: 'hsl(var(--finance))',
  enps: 'hsl(var(--hr))',
};

const CATEGORIAS_ICONES: Record<string, typeof Heart> = {
  satisfacao: Heart,
  engajamento: TrendingUp,
  comunicacao: MessageSquare,
  ambiente: Smile,
  recursos: CheckCircle2,
  enps: ThumbsUp,
  sugestoes: MessageSquare,
  geral: BarChart3,
};

export default function PesquisasClima() {
  const {
    pesquisas,
    pesquisaAtual,
    respostas,
    historico,
    isLoading,
    isSaving,
    responderPergunta,
    enviarRespostas,
    getEstatisticas,
  } = usePesquisasClima();

  const [activeTab, setActiveTab] = useState('responder');
  const stats = getEstatisticas();

  const EscalaEmoji = ({ perguntaId, valor }: { perguntaId: string; valor: number | undefined }) => {
    const opcoes = [
      { value: 1, icon: Frown, label: 'Muito Insatisfeito', color: 'text-red-500 hover:text-red-600' },
      { value: 2, icon: Frown, label: 'Insatisfeito', color: 'text-orange-500 hover:text-orange-600' },
      { value: 3, icon: Meh, label: 'Neutro', color: 'text-yellow-500 hover:text-yellow-600' },
      { value: 4, icon: Smile, label: 'Satisfeito', color: 'text-lime-500 hover:text-lime-600' },
      { value: 5, icon: Smile, label: 'Muito Satisfeito', color: 'text-green-500 hover:text-green-600' },
    ];

    return (
      <div className="flex items-center justify-center gap-2 md:gap-4 py-4">
        {opcoes.map((opcao) => {
          const Icon = opcao.icon;
          const isSelected = valor === opcao.value;
          return (
            <button
              key={opcao.value}
              type="button"
              onClick={() => responderPergunta(perguntaId, opcao.value)}
              className={cn(
                'flex flex-col items-center gap-1 p-2 md:p-3 rounded-xl transition-all duration-200',
                isSelected 
                  ? 'bg-primary/10 scale-110 ring-2 ring-primary' 
                  : 'hover:bg-muted/50 hover:scale-105',
                opcao.color
              )}
              title={opcao.label}
            >
              <Icon className={cn('h-8 w-8 md:h-10 md:w-10', isSelected && 'fill-current')} />
              <span className="text-[10px] md:text-xs text-muted-foreground">{opcao.value}</span>
            </button>
          );
        })}
      </div>
    );
  };

  const ENPSScale = ({ perguntaId, valor }: { perguntaId: string; valor: number | undefined }) => {
    return (
      <div className="py-4">
        <div className="flex items-center justify-between mb-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ThumbsDown className="h-3 w-3" /> Improvável
          </span>
          <span className="flex items-center gap-1">
            Muito Provável <ThumbsUp className="h-3 w-3" />
          </span>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => {
            const isSelected = valor === n;
            let bgColor = 'bg-red-500/80';
            if (n >= 7 && n <= 8) bgColor = 'bg-yellow-500/80';
            if (n >= 9) bgColor = 'bg-green-500/80';
            
            return (
              <button
                key={n}
                type="button"
                onClick={() => responderPergunta(perguntaId, n)}
                className={cn(
                  'flex-1 py-2 md:py-3 rounded text-xs md:text-sm font-medium transition-all',
                  isSelected
                    ? `${bgColor} text-white scale-110 ring-2 ring-offset-2 ring-primary`
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                )}
              >
                {n}
              </button>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
          <span>Detratores (0-6)</span>
          <span>Neutros (7-8)</span>
          <span>Promotores (9-10)</span>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <PageLayout title="Clima Organizacional">
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
          </div>
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </PageLayout>
    );
  }

  const perguntasRespondidas = pesquisaAtual?.perguntas?.filter(p => respostas[p.id] !== undefined).length || 0;
  const totalPerguntas = pesquisaAtual?.perguntas?.length || 1;
  const progresso = (perguntasRespondidas / totalPerguntas) * 100;

  return (
    <PageLayout title="Clima Organizacional">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="Satisfação"
            value={stats.satisfacaoMedia.toFixed(1)}
            icon={Heart}
            color="primary"
          />
          <StatCard
            label="Engajamento"
            value={stats.engajamentoMedio.toFixed(1)}
            icon={TrendingUp}
            color="finance"
          />
          <StatCard
            label="eNPS"
            value={stats.enps.toString()}
            icon={ThumbsUp}
            color="hr"
          />
          <StatCard
            label="Pesquisas"
            value={`${stats.respondidas}/${stats.total}`}
            icon={CheckCircle2}
            color={stats.pendentes > 0 ? 'warning' : 'projects'}
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="responder">
              Responder
              {stats.pendentes > 0 && <Badge variant="destructive" className="ml-2">{stats.pendentes}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="evolucao">Evolução</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          {/* Tab Responder */}
          <TabsContent value="responder" className="space-y-4">
            {!pesquisaAtual || pesquisaAtual.participacao?.concluida ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" />
                  <h3 className="text-xl font-semibold mb-2">Tudo em dia!</h3>
                  <p className="text-muted-foreground">
                    Você não tem pesquisas pendentes no momento.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Header da Pesquisa */}
                <Card className="bg-gradient-to-r from-primary/10 to-hr/10 border-0">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Badge variant="secondary" className="mb-2">{pesquisaAtual.tipo}</Badge>
                        <h3 className="font-semibold text-lg">{pesquisaAtual.titulo}</h3>
                        <p className="text-sm text-muted-foreground">{pesquisaAtual.descricao}</p>
                      </div>
                      {pesquisaAtual.anonima && (
                        <Badge variant="outline" className="text-xs">
                          🔒 Anônima
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {differenceInDays(new Date(pesquisaAtual.data_fim), new Date())} dias restantes
                      </span>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span>Progresso</span>
                        <span>{perguntasRespondidas}/{totalPerguntas}</span>
                      </div>
                      <Progress value={progresso} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Perguntas */}
                <div className="space-y-4">
                  {pesquisaAtual.perguntas?.map((pergunta, index) => {
                    const CategoriaIcon = CATEGORIAS_ICONES[pergunta.categoria] || BarChart3;
                    const resposta = respostas[pergunta.id];

                    return (
                      <Card key={pergunta.id} className={cn(
                        'transition-all',
                        resposta !== undefined && 'border-primary/30 bg-primary/5'
                      )}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <CategoriaIcon className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground capitalize">{pergunta.categoria}</span>
                                {pergunta.obrigatoria && (
                                  <span className="text-xs text-destructive">*</span>
                                )}
                              </div>
                              <p className="font-medium">{pergunta.texto}</p>
                            </div>
                          </div>

                          {pergunta.tipo === 'escala' && pergunta.categoria !== 'enps' && (
                            <EscalaEmoji 
                              perguntaId={pergunta.id} 
                              valor={typeof resposta === 'number' ? resposta : undefined} 
                            />
                          )}

                          {pergunta.categoria === 'enps' && (
                            <ENPSScale
                              perguntaId={pergunta.id}
                              valor={typeof resposta === 'number' ? resposta : undefined}
                            />
                          )}

                          {pergunta.tipo === 'texto' && (
                            <Textarea
                              placeholder="Digite sua resposta..."
                              value={typeof resposta === 'string' ? resposta : ''}
                              onChange={(e) => responderPergunta(pergunta.id, e.target.value)}
                              className="mt-2"
                            />
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Botão Enviar */}
                <Button
                  onClick={enviarRespostas}
                  disabled={isSaving || progresso < 100}
                  className="w-full"
                  size="lg"
                >
                  {isSaving ? (
                    'Enviando...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Enviar Respostas
                    </>
                  )}
                </Button>
              </>
            )}
          </TabsContent>

          {/* Tab Evolução */}
          <TabsContent value="evolucao" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-finance" />
                  Evolução do Engajamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={historico}>
                      <defs>
                        <linearGradient id="colorSatisfacao" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CORES.satisfacao} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={CORES.satisfacao} stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorEngajamento" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CORES.engajamento} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={CORES.engajamento} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis domain={[0, 5]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="satisfacao"
                        name="Satisfação"
                        stroke={CORES.satisfacao}
                        fill="url(#colorSatisfacao)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="engajamento"
                        name="Engajamento"
                        stroke={CORES.engajamento}
                        fill="url(#colorEngajamento)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ThumbsUp className="h-5 w-5 text-hr" />
                  Evolução do eNPS
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historico}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis domain={[-100, 100]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`${value}`, 'eNPS']}
                      />
                      <Line
                        type="monotone"
                        dataKey="enps"
                        stroke={CORES.enps}
                        strokeWidth={3}
                        dot={{ fill: CORES.enps, strokeWidth: 2 }}
                        activeDot={{ r: 8 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-around mt-4 text-sm">
                  <div className="text-center">
                    <div className="w-3 h-3 rounded-full bg-red-500 mx-auto mb-1" />
                    <span className="text-muted-foreground">Zona Crítica</span>
                    <p className="text-xs">-100 a 0</p>
                  </div>
                  <div className="text-center">
                    <div className="w-3 h-3 rounded-full bg-yellow-500 mx-auto mb-1" />
                    <span className="text-muted-foreground">Zona de Aperfeiçoamento</span>
                    <p className="text-xs">0 a 50</p>
                  </div>
                  <div className="text-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mx-auto mb-1" />
                    <span className="text-muted-foreground">Zona de Excelência</span>
                    <p className="text-xs">50 a 100</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Histórico */}
          <TabsContent value="historico" className="space-y-4">
            {pesquisas.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma pesquisa encontrada</p>
                </CardContent>
              </Card>
            ) : (
              pesquisas.map((pesquisa) => (
                <Card key={pesquisa.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary">{pesquisa.tipo}</Badge>
                          {pesquisa.participacao?.concluida && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Respondida
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium">{pesquisa.titulo}</h4>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(pesquisa.data_inicio), "dd/MM", { locale: ptBR })} - {' '}
                          {format(new Date(pesquisa.data_fim), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      {!pesquisa.participacao?.concluida && (
                        <Button size="sm" onClick={() => setActiveTab('responder')}>
                          Responder
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
