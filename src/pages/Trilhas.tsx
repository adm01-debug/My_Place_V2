import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, GraduationCap, Clock, CheckCircle2, Play, Pause,
  FileText, Video, HelpCircle, ClipboardList, Users, Award,
  ChevronRight, Filter, Search, TrendingUp, Target, Zap
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTrilhas, TrilhaComProgresso, TrilhaEtapa } from '@/hooks/useTrilhas';
import { PageLayout, StatCard, EmptyState, SearchInput, Skeleton } from '@/components/portal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// =====================================================
// COMPONENTES AUXILIARES
// =====================================================

interface TrilhaCardProps {
  trilha: TrilhaComProgresso;
  onIniciar: () => void;
  onContinuar: () => void;
  onVerDetalhes: () => void;
}

const TrilhaCard: React.FC<TrilhaCardProps> = ({ trilha, onIniciar, onContinuar, onVerDetalhes }) => {
  const getNivelColor = (nivel: string) => {
    const colors: Record<string, string> = {
      iniciante: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
      intermediario: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
      avancado: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100',
      especialista: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
    };
    return colors[nivel] || 'bg-gray-100 text-gray-800';
  };

  const getNivelIcon = (nivel: string) => {
    const icons: Record<string, string> = {
      iniciante: '🌱',
      intermediario: '🌿',
      avancado: '🌳',
      especialista: '🏆',
    };
    return icons[nivel] || '📚';
  };

  const getStatusBadge = () => {
    if (!trilha.progresso) return null;
    
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      em_andamento: { label: 'Em Andamento', variant: 'default' },
      concluida: { label: 'Concluída', variant: 'secondary' },
      pausada: { label: 'Pausada', variant: 'outline' },
    };
    
    const config = statusConfig[trilha.progresso.status];
    if (!config) return null;
    
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getNivelIcon(trilha.nivel)}</span>
              <div>
                <CardTitle className="text-lg">{trilha.nome}</CardTitle>
                {trilha.departamento && (
                  <p className="text-xs text-muted-foreground">{trilha.departamento}</p>
                )}
              </div>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {trilha.descricao}
          </p>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {trilha.carga_horaria_total}h
            </div>
            <div className="flex items-center gap-1">
              <BookOpen className="h-3 w-3" />
              {trilha.total_etapas} etapas
            </div>
            <Badge variant="outline" className={getNivelColor(trilha.nivel)}>
              {trilha.nivel}
            </Badge>
          </div>

          {trilha.progresso && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>{trilha.etapas_concluidas}/{trilha.total_etapas} etapas</span>
                <span>{Math.round(trilha.progresso.progresso_percentual)}%</span>
              </div>
              <Progress value={trilha.progresso.progresso_percentual} className="h-2" />
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-0">
          {!trilha.progresso ? (
            <Button className="w-full" onClick={onIniciar}>
              <Play className="h-4 w-4 mr-2" />
              Iniciar Trilha
            </Button>
          ) : trilha.progresso.status === 'concluida' ? (
            <Button variant="outline" className="w-full" onClick={onVerDetalhes}>
              <Award className="h-4 w-4 mr-2" />
              Ver Certificado
            </Button>
          ) : (
            <Button className="w-full" onClick={onContinuar}>
              <ChevronRight className="h-4 w-4 mr-2" />
              Continuar
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
};

interface EtapaItemProps {
  etapa: TrilhaEtapa;
  onConcluir: () => void;
  disabled?: boolean;
}

const EtapaItem: React.FC<EtapaItemProps> = ({ etapa, onConcluir, disabled }) => {
  const getTipoIcon = (tipo: string) => {
    const icons: Record<string, React.ReactNode> = {
      video: <Video className="h-4 w-4" />,
      documento: <FileText className="h-4 w-4" />,
      quiz: <HelpCircle className="h-4 w-4" />,
      tarefa: <ClipboardList className="h-4 w-4" />,
      treinamento: <GraduationCap className="h-4 w-4" />,
      mentoria: <Users className="h-4 w-4" />,
    };
    return icons[tipo] || <BookOpen className="h-4 w-4" />;
  };

  return (
    <div className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
      etapa.concluida 
        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
        : 'hover:bg-muted/50'
    }`}>
      <div className={`p-2 rounded-full ${
        etapa.concluida 
          ? 'bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-200' 
          : 'bg-muted text-muted-foreground'
      }`}>
        {etapa.concluida ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : (
          getTipoIcon(etapa.tipo)
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-sm truncate">{etapa.titulo}</h4>
          {etapa.obrigatoria && (
            <Badge variant="outline" className="text-xs">Obrigatória</Badge>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            {getTipoIcon(etapa.tipo)}
            {etapa.tipo.charAt(0).toUpperCase() + etapa.tipo.slice(1)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {etapa.duracao_minutos} min
          </span>
        </div>
        {etapa.concluida && etapa.data_conclusao && (
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            ✓ Concluído em {format(new Date(etapa.data_conclusao), "dd/MM/yyyy", { locale: ptBR })}
          </p>
        )}
      </div>

      {!etapa.concluida && (
        <Button 
          size="sm" 
          onClick={onConcluir}
          disabled={disabled}
        >
          Concluir
        </Button>
      )}
    </div>
  );
};

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

const Trilhas: React.FC = () => {
  const { user } = useAuth();
  const {
    trilhas,
    trilhaAtual,
    trilhasEmAndamento,
    trilhasConcluidas,
    trilhasDisponiveis,
    totalHorasConcluidas,
    loading,
    iniciarTrilha,
    concluirEtapa,
    pausarTrilha,
    retornarTrilha,
    fetchTrilha,
    getNivelLabel,
    getTipoLabel,
    refresh,
  } = useTrilhas();

  const [selectedTrilha, setSelectedTrilha] = useState<TrilhaComProgresso | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterNivel, setFilterNivel] = useState<string>('todos');

  const filteredTrilhas = useMemo(() => {
    let result = trilhas;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.nome.toLowerCase().includes(term) ||
        t.descricao?.toLowerCase().includes(term) ||
        t.departamento?.toLowerCase().includes(term)
      );
    }
    
    if (filterNivel !== 'todos') {
      result = result.filter(t => t.nivel === filterNivel);
    }
    
    return result;
  }, [trilhas, searchTerm, filterNivel]);

  const handleIniciarTrilha = async (trilha: TrilhaComProgresso) => {
    await iniciarTrilha({ trilha_id: trilha.id });
    await fetchTrilha(trilha.id);
    setSelectedTrilha(await fetchTrilha(trilha.id));
    setIsDetailOpen(true);
  };

  const handleContinuarTrilha = async (trilha: TrilhaComProgresso) => {
    const trilhaDetalhada = await fetchTrilha(trilha.id);
    setSelectedTrilha(trilhaDetalhada);
    setIsDetailOpen(true);
  };

  const handleConcluirEtapa = async (etapaId: string) => {
    await concluirEtapa({ etapa_id: etapaId });
    if (selectedTrilha) {
      const updated = await fetchTrilha(selectedTrilha.id);
      setSelectedTrilha(updated);
    }
  };

  if (loading) {
    return (
      <PageLayout title="Trilhas de Desenvolvimento">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Trilhas de Desenvolvimento"
      showBack
    >
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Em Andamento"
          value={String(trilhasEmAndamento.length)}
          icon={Zap}
        />
        <StatCard
          label="Concluídas"
          value={String(trilhasConcluidas.length)}
          icon={CheckCircle2}
        />
        <StatCard
          label="Horas Totais"
          value={String(totalHorasConcluidas)}
          icon={Clock}
        />
        <StatCard
          label="Disponíveis"
          value={String(trilhasDisponiveis.length)}
          icon={Target}
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="todas" className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="todas" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Todas ({trilhas.length})
            </TabsTrigger>
            <TabsTrigger value="andamento" className="gap-2">
              <Zap className="h-4 w-4" />
              Em Andamento ({trilhasEmAndamento.length})
            </TabsTrigger>
            <TabsTrigger value="concluidas" className="gap-2">
              <Award className="h-4 w-4" />
              Concluídas ({trilhasConcluidas.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar trilhas..."
              className="w-64"
            />
          </div>
        </div>

        {/* Todas Tab */}
        <TabsContent value="todas">
          {filteredTrilhas.length === 0 ? (
            <EmptyState
              type="search"
              title="Nenhuma trilha encontrada"
              description="Tente ajustar os filtros de busca"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTrilhas.map(trilha => (
                <TrilhaCard
                  key={trilha.id}
                  trilha={trilha}
                  onIniciar={() => handleIniciarTrilha(trilha)}
                  onContinuar={() => handleContinuarTrilha(trilha)}
                  onVerDetalhes={() => handleContinuarTrilha(trilha)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Em Andamento Tab */}
        <TabsContent value="andamento">
          {trilhasEmAndamento.length === 0 ? (
            <EmptyState
              type="generic"
              title="Nenhuma trilha em andamento"
              description="Inicie uma trilha para começar seu desenvolvimento"
              action={{
                label: 'Ver Trilhas Disponíveis',
                onClick: () => {},
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trilhasEmAndamento.map(trilha => (
                <TrilhaCard
                  key={trilha.id}
                  trilha={trilha}
                  onIniciar={() => {}}
                  onContinuar={() => handleContinuarTrilha(trilha)}
                  onVerDetalhes={() => handleContinuarTrilha(trilha)}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Concluídas Tab */}
        <TabsContent value="concluidas">
          {trilhasConcluidas.length === 0 ? (
            <EmptyState
              type="success"
              title="Nenhuma trilha concluída ainda"
              description="Complete suas trilhas para ganhar certificados"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trilhasConcluidas.map(trilha => (
                <TrilhaCard
                  key={trilha.id}
                  trilha={trilha}
                  onIniciar={() => {}}
                  onContinuar={() => handleContinuarTrilha(trilha)}
                  onVerDetalhes={() => handleContinuarTrilha(trilha)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de Detalhes da Trilha */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          {selectedTrilha && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedTrilha.nome}
                  {selectedTrilha.progresso?.status === 'concluida' && (
                    <Badge variant="secondary">✓ Concluída</Badge>
                  )}
                </DialogTitle>
                <DialogDescription>
                  {selectedTrilha.descricao}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Progress */}
                {selectedTrilha.progresso && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progresso</span>
                      <span className="font-medium">
                        {selectedTrilha.etapas_concluidas}/{selectedTrilha.total_etapas} etapas
                        ({Math.round(selectedTrilha.progresso.progresso_percentual)}%)
                      </span>
                    </div>
                    <Progress value={selectedTrilha.progresso.progresso_percentual} />
                  </div>
                )}

                <Separator />

                {/* Etapas */}
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {selectedTrilha.etapas.map((etapa, index) => (
                      <EtapaItem
                        key={etapa.id}
                        etapa={etapa}
                        onConcluir={() => handleConcluirEtapa(etapa.id)}
                        disabled={index > 0 && !selectedTrilha.etapas[index - 1]?.concluida}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>

              <DialogFooter>
                {selectedTrilha.progresso?.status === 'em_andamento' && (
                  <Button 
                    variant="outline" 
                    onClick={() => pausarTrilha(selectedTrilha.id)}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar Trilha
                  </Button>
                )}
                {selectedTrilha.progresso?.status === 'pausada' && (
                  <Button 
                    onClick={() => retornarTrilha(selectedTrilha.id)}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Retomar Trilha
                  </Button>
                )}
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
                  Fechar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default Trilhas;
