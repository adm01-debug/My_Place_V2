import React, { useState, useMemo } from 'react';
import { BookOpen, CheckCircle2, Clock, Zap, Target, Award, Pause, Play, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTrilhas, TrilhaComProgresso } from '@/hooks/useTrilhas';
import { PageLayout, StatCard, EmptyState, SearchInput, Skeleton } from '@/components/portal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { TrilhaCard } from '@/components/trilhas/TrilhaCard';
import { EtapaItem } from '@/components/trilhas/EtapaItem';

const Trilhas: React.FC = () => {
  const {
    trilhas, trilhasEmAndamento, trilhasConcluidas, trilhasDisponiveis,
    totalHorasConcluidas, loading, iniciarTrilha, concluirEtapa,
    pausarTrilha, retornarTrilha, fetchTrilha,
  } = useTrilhas();

  const [selectedTrilha, setSelectedTrilha] = useState<TrilhaComProgresso | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTrilhas = useMemo(() => {
    if (!searchTerm) return trilhas;
    const term = searchTerm.toLowerCase();
    return trilhas.filter(t =>
      t.nome.toLowerCase().includes(term) ||
      t.descricao?.toLowerCase().includes(term) ||
      t.departamento?.toLowerCase().includes(term)
    );
  }, [trilhas, searchTerm]);

  const handleIniciarTrilha = async (trilha: TrilhaComProgresso) => {
    await iniciarTrilha({ trilha_id: trilha.id });
    const detail = await fetchTrilha(trilha.id);
    setSelectedTrilha(detail);
    setIsDetailOpen(true);
  };

  const handleContinuarTrilha = async (trilha: TrilhaComProgresso) => {
    const detail = await fetchTrilha(trilha.id);
    setSelectedTrilha(detail);
    setIsDetailOpen(true);
  };

  const handleConcluirEtapa = async (etapaId: string) => {
    await concluirEtapa({ etapa_id: etapaId });
    if (selectedTrilha) {
      setSelectedTrilha(await fetchTrilha(selectedTrilha.id));
    }
  };

  if (loading) {
    return (
      <PageLayout title="Trilhas de Desenvolvimento">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64" />)}
        </div>
      </PageLayout>
    );
  }

  const renderTrilhaGrid = (list: TrilhaComProgresso[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {list.map(trilha => (
        <TrilhaCard
          key={trilha.id}
          trilha={trilha}
          onIniciar={() => handleIniciarTrilha(trilha)}
          onContinuar={() => handleContinuarTrilha(trilha)}
          onVerDetalhes={() => handleContinuarTrilha(trilha)}
        />
      ))}
    </div>
  );

  return (
    <PageLayout title="Trilhas de Desenvolvimento" showBack>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Em Andamento" value={String(trilhasEmAndamento.length)} icon={Zap} />
        <StatCard label="Concluídas" value={String(trilhasConcluidas.length)} icon={CheckCircle2} />
        <StatCard label="Horas Totais" value={String(totalHorasConcluidas)} icon={Clock} />
        <StatCard label="Disponíveis" value={String(trilhasDisponiveis.length)} icon={Target} />
      </div>

      <Tabs defaultValue="todas" className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="todas" className="gap-2"><BookOpen className="h-4 w-4" />Todas ({trilhas.length})</TabsTrigger>
            <TabsTrigger value="andamento" className="gap-2"><Zap className="h-4 w-4" />Em Andamento ({trilhasEmAndamento.length})</TabsTrigger>
            <TabsTrigger value="concluidas" className="gap-2"><Award className="h-4 w-4" />Concluídas ({trilhasConcluidas.length})</TabsTrigger>
          </TabsList>
          <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="Buscar trilhas..." className="w-64" />
        </div>

        <TabsContent value="todas">
          {filteredTrilhas.length === 0 ? (
            <EmptyState type="search" title="Nenhuma trilha encontrada" description="Tente ajustar os filtros de busca" />
          ) : renderTrilhaGrid(filteredTrilhas)}
        </TabsContent>

        <TabsContent value="andamento">
          {trilhasEmAndamento.length === 0 ? (
            <EmptyState type="generic" title="Nenhuma trilha em andamento" description="Inicie uma trilha para começar seu desenvolvimento" />
          ) : renderTrilhaGrid(trilhasEmAndamento)}
        </TabsContent>

        <TabsContent value="concluidas">
          {trilhasConcluidas.length === 0 ? (
            <EmptyState type="success" title="Nenhuma trilha concluída ainda" description="Complete suas trilhas para ganhar certificados" />
          ) : renderTrilhaGrid(trilhasConcluidas)}
        </TabsContent>
      </Tabs>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          {selectedTrilha && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedTrilha.nome}
                  {selectedTrilha.progresso?.status === 'concluida' && <Badge variant="secondary">✓ Concluída</Badge>}
                </DialogTitle>
                <DialogDescription>{selectedTrilha.descricao}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {selectedTrilha.progresso && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progresso</span>
                      <span className="font-medium">{selectedTrilha.etapas_concluidas}/{selectedTrilha.total_etapas} etapas ({Math.round(selectedTrilha.progresso.progresso_percentual)}%)</span>
                    </div>
                    <Progress value={selectedTrilha.progresso.progresso_percentual} />
                  </div>
                )}
                <Separator />
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
                  <Button variant="outline" onClick={() => pausarTrilha(selectedTrilha.id)}>
                    <Pause className="h-4 w-4 mr-2" />Pausar Trilha
                  </Button>
                )}
                {selectedTrilha.progresso?.status === 'pausada' && (
                  <Button onClick={() => retornarTrilha(selectedTrilha.id)}>
                    <Play className="h-4 w-4 mr-2" />Retomar Trilha
                  </Button>
                )}
                <Button variant="outline" onClick={() => setIsDetailOpen(false)}>Fechar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
};

export default Trilhas;
