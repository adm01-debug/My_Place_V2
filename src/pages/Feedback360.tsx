import { useState } from 'react';
import { Send, Users, TrendingUp, MessageSquare, Target, ChevronRight, User, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageLayout } from '@/components/portal/PageLayout';
import { StatCard } from '@/components/portal/StatCard';
import { FeedbackDashboard } from '@/components/portal/FeedbackDashboard';
import { Skeleton } from '@/components/ui/skeleton';
import { StarRating } from '@/components/feedback/StarRating';
import { useFeedback360 } from '@/hooks/useFeedback360';
import { useOrganograma } from '@/hooks/useOrganograma';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export default function Feedback360() {
  const { ciclos, competencias, avaliacoesEnviadas, avaliacoesRecebidas, mediasCompetencias, evolucaoCiclos, isLoading, criarAvaliacao, enviarAvaliacao, getEstatisticas } = useFeedback360();
  const { colaboradores } = useOrganograma();

  const [selectedAvaliacao, setSelectedAvaliacao] = useState<string | null>(null);
  const [novaAvaliacaoOpen, setNovaAvaliacaoOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [notas, setNotas] = useState<Record<string, number>>({});
  const [comentarios, setComentarios] = useState<Record<string, string>>({});
  const [notaGeral, setNotaGeral] = useState(0);
  const [comentarioGeral, setComentarioGeral] = useState('');
  const [pontosFortes, setPontosFortes] = useState('');
  const [pontosMelhoria, setPontosMelhoria] = useState('');
  const [cicloSelecionado, setCicloSelecionado] = useState('');
  const [avaliadoSelecionado, setAvaliadoSelecionado] = useState('');
  const [tipoAvaliacao, setTipoAvaliacao] = useState<'par' | 'gestor' | 'auto'>('par');

  const stats = getEstatisticas();

  const handleCriarAvaliacao = async () => {
    if (!cicloSelecionado || !avaliadoSelecionado) { toast.error('Selecione o ciclo e o colaborador'); return; }
    await criarAvaliacao(cicloSelecionado, avaliadoSelecionado, tipoAvaliacao);
    setNovaAvaliacaoOpen(false);
    setCicloSelecionado('');
    setAvaliadoSelecionado('');
  };

  const handleEnviarAvaliacao = async () => {
    if (!selectedAvaliacao) return;
    const notasArray = Object.entries(notas).map(([competencia_id, nota]) => ({ competencia_id, nota, comentario: comentarios[competencia_id] }));
    if (notasArray.length < competencias.length) { toast.error('Avalie todas as competências'); return; }
    if (notaGeral === 0) { toast.error('Informe a nota geral'); return; }
    const success = await enviarAvaliacao(selectedAvaliacao, { nota_geral: notaGeral, comentario_geral: comentarioGeral, pontos_fortes: pontosFortes, pontos_melhoria: pontosMelhoria, notas_competencias: notasArray });
    if (success) { setFormOpen(false); setSelectedAvaliacao(null); setNotas({}); setComentarios({}); setNotaGeral(0); setComentarioGeral(''); setPontosFortes(''); setPontosMelhoria(''); }
  };

  if (isLoading) {
    return (<PageLayout title="Feedback 360°"><div className="space-y-6"><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div></div></PageLayout>);
  }

  const avaliacaoPendente = avaliacoesEnviadas.find(a => a.id === selectedAvaliacao);

  return (
    <PageLayout title="Feedback 360°">
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Pendentes" value={stats.pendentes.toString()} icon={Target} color={stats.pendentes > 0 ? 'warning' : 'primary'} />
          <StatCard label="Enviadas" value={stats.enviadas.toString()} icon={Send} color="finance" />
          <StatCard label="Recebidas" value={stats.recebidas.toString()} icon={MessageSquare} color="hr" />
          <StatCard label="Média Geral" value={stats.media.toFixed(1)} icon={TrendingUp} color="primary" />
        </div>

        {ciclos.length > 0 && (
          <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ciclo Ativo</p>
                  <h3 className="font-semibold text-lg">{ciclos[0].titulo}</h3>
                  <p className="text-sm text-muted-foreground">{format(new Date(ciclos[0].data_inicio), "dd/MM", { locale: ptBR })} até {format(new Date(ciclos[0].data_fim), "dd/MM/yyyy", { locale: ptBR })}</p>
                </div>
                <Dialog open={novaAvaliacaoOpen} onOpenChange={setNovaAvaliacaoOpen}>
                  <DialogTrigger asChild><Button><Users className="h-4 w-4 mr-2" />Nova Avaliação</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Iniciar Nova Avaliação</DialogTitle></DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div><Label>Ciclo</Label><Select value={cicloSelecionado} onValueChange={setCicloSelecionado}><SelectTrigger><SelectValue placeholder="Selecione o ciclo" /></SelectTrigger><SelectContent>{ciclos.map(c => <SelectItem key={c.id} value={c.id}>{c.titulo}</SelectItem>)}</SelectContent></Select></div>
                      <div><Label>Tipo de Avaliação</Label><Select value={tipoAvaliacao} onValueChange={(v) => setTipoAvaliacao(v as typeof tipoAvaliacao)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="par">Par (Colega)</SelectItem><SelectItem value="gestor">Gestor</SelectItem><SelectItem value="auto">Autoavaliação</SelectItem></SelectContent></Select></div>
                      <div><Label>Colaborador</Label><Select value={avaliadoSelecionado} onValueChange={setAvaliadoSelecionado}><SelectTrigger><SelectValue placeholder="Selecione quem avaliar" /></SelectTrigger><SelectContent>{colaboradores.map(c => <SelectItem key={c.id} value={c.id}>{c.nome} - {c.cargo || 'Sem cargo'}</SelectItem>)}</SelectContent></Select></div>
                      <Button onClick={handleCriarAvaliacao} className="w-full">Criar Avaliação</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="pendentes" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="pendentes">Pendentes {stats.pendentes > 0 && <Badge variant="destructive" className="ml-2">{stats.pendentes}</Badge>}</TabsTrigger>
            <TabsTrigger value="enviadas">Enviadas</TabsTrigger>
            <TabsTrigger value="recebidas">Recebidas</TabsTrigger>
            <TabsTrigger value="resultados" className="gap-1"><BarChart3 className="h-4 w-4" />Resultados</TabsTrigger>
          </TabsList>

          <TabsContent value="pendentes" className="space-y-4">
            {avaliacoesEnviadas.filter(a => a.status === 'pendente').length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground"><Target className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Nenhuma avaliação pendente</p></CardContent></Card>
            ) : avaliacoesEnviadas.filter(a => a.status === 'pendente').map(av => (
              <Card key={av.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar><AvatarImage src={av.avaliado?.avatar_url || undefined} /><AvatarFallback>{av.avaliado?.nome?.charAt(0) || <User className="h-4 w-4" />}</AvatarFallback></Avatar>
                      <div><h4 className="font-medium">{av.avaliado?.nome || 'Colaborador'}</h4><p className="text-sm text-muted-foreground">{av.avaliado?.cargo}</p></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{av.tipo === 'par' ? 'Par' : av.tipo === 'gestor' ? 'Gestor' : 'Auto'}</Badge>
                      <Dialog open={formOpen && selectedAvaliacao === av.id} onOpenChange={(open) => { setFormOpen(open); if (open) setSelectedAvaliacao(av.id); }}>
                        <DialogTrigger asChild><Button size="sm">Avaliar <ChevronRight className="h-4 w-4 ml-1" /></Button></DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader><DialogTitle>Avaliação de {avaliacaoPendente?.avaliado?.nome}</DialogTitle></DialogHeader>
                          <div className="space-y-6 mt-4">
                            <div className="space-y-4">
                              <h4 className="font-medium">Competências</h4>
                              {competencias.map(comp => (
                                <div key={comp.id} className="p-3 rounded-lg border bg-card">
                                  <div className="flex items-center justify-between mb-2">
                                    <div><span className="font-medium">{comp.nome}</span><Badge variant="secondary" className="ml-2 text-xs">{comp.categoria}</Badge></div>
                                    <StarRating value={notas[comp.id] || 0} onChange={(v) => setNotas(prev => ({ ...prev, [comp.id]: v }))} />
                                  </div>
                                  <p className="text-sm text-muted-foreground mb-2">{comp.descricao}</p>
                                  <Textarea placeholder="Comentário (opcional)" value={comentarios[comp.id] || ''} onChange={(e) => setComentarios(prev => ({ ...prev, [comp.id]: e.target.value }))} className="text-sm" />
                                </div>
                              ))}
                            </div>
                            <div className="p-4 rounded-lg border bg-primary/5"><div className="flex items-center justify-between mb-2"><span className="font-semibold">Nota Geral</span><StarRating value={notaGeral} onChange={setNotaGeral} /></div></div>
                            <div><Label>Pontos Fortes</Label><Textarea placeholder="Destaque os pontos fortes..." value={pontosFortes} onChange={(e) => setPontosFortes(e.target.value)} /></div>
                            <div><Label>Pontos de Melhoria</Label><Textarea placeholder="Sugira áreas de desenvolvimento..." value={pontosMelhoria} onChange={(e) => setPontosMelhoria(e.target.value)} /></div>
                            <div><Label>Comentário Geral</Label><Textarea placeholder="Adicione observações gerais..." value={comentarioGeral} onChange={(e) => setComentarioGeral(e.target.value)} /></div>
                            <Button onClick={handleEnviarAvaliacao} className="w-full"><Send className="h-4 w-4 mr-2" />Enviar Avaliação</Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="enviadas" className="space-y-4">
            {avaliacoesEnviadas.filter(a => a.status === 'enviado').length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground"><Send className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Nenhuma avaliação enviada</p></CardContent></Card>
            ) : avaliacoesEnviadas.filter(a => a.status === 'enviado').map(av => (
              <Card key={av.id}><CardContent className="p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><Avatar><AvatarImage src={av.avaliado?.avatar_url || undefined} /><AvatarFallback>{av.avaliado?.nome?.charAt(0) || <User className="h-4 w-4" />}</AvatarFallback></Avatar><div><h4 className="font-medium">{av.avaliado?.nome || 'Colaborador'}</h4><p className="text-sm text-muted-foreground">Enviado em {av.data_envio ? format(new Date(av.data_envio), "dd/MM/yyyy", { locale: ptBR }) : '-'}</p></div></div><div className="flex items-center gap-3"><StarRating value={av.nota_geral || 0} size="sm" /><Badge variant="secondary">Enviada</Badge></div></div></CardContent></Card>
            ))}
          </TabsContent>

          <TabsContent value="recebidas" className="space-y-4">
            {avaliacoesRecebidas.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground"><MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>Nenhuma avaliação recebida</p></CardContent></Card>
            ) : avaliacoesRecebidas.map(av => (
              <Card key={av.id}><CardContent className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3"><Avatar><AvatarImage src={av.avaliador?.avatar_url || undefined} /><AvatarFallback>{av.avaliador?.nome?.charAt(0) || <User className="h-4 w-4" />}</AvatarFallback></Avatar><div><h4 className="font-medium">{av.avaliador?.nome || 'Anônimo'}</h4><p className="text-sm text-muted-foreground">{av.data_envio ? format(new Date(av.data_envio), "dd/MM/yyyy", { locale: ptBR }) : '-'}</p></div></div>
                  <div className="flex items-center gap-2"><StarRating value={av.nota_geral || 0} size="sm" /><span className="font-semibold">{av.nota_geral?.toFixed(1)}</span></div>
                </div>
                {av.pontos_fortes && <div className="mb-3 p-3 rounded bg-green-500/10 border border-green-500/20"><p className="text-xs font-medium text-green-600 mb-1">Pontos Fortes</p><p className="text-sm">{av.pontos_fortes}</p></div>}
                {av.pontos_melhoria && <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20"><p className="text-xs font-medium text-amber-600 mb-1">Pontos de Melhoria</p><p className="text-sm">{av.pontos_melhoria}</p></div>}
              </CardContent></Card>
            ))}
          </TabsContent>

          <TabsContent value="resultados">
            <FeedbackDashboard mediasCompetencias={mediasCompetencias} evolucaoCiclos={evolucaoCiclos} mediaGeral={stats.media} totalAvaliacoes={stats.recebidas} />
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
