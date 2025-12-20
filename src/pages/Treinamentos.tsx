import { useMemo } from 'react';
import { BookOpen, AlertTriangle, CheckCircle, Download, Play, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageLayout } from '@/components/portal/PageLayout';
import { StatCardSkeleton, ListItemSkeleton } from '@/components/portal/Skeletons';
import { FilterBar } from '@/components/portal/FilterBar';
import { useTreinamentos } from '@/hooks/useTreinamentos';
import { useFilters, FilterConfig } from '@/hooks/useFilters';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const filterConfigs: FilterConfig[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'all', label: 'Todos' },
      { value: 'pendente', label: 'Pendente' },
      { value: 'em_andamento', label: 'Em Andamento' },
      { value: 'concluido', label: 'Concluído' },
    ],
  },
  {
    key: 'tipo',
    label: 'Tipo',
    type: 'select',
    options: [
      { value: 'all', label: 'Todos' },
      { value: 'obrigatorio', label: 'Obrigatório' },
      { value: 'opcional', label: 'Opcional' },
    ],
  },
];

export default function Treinamentos() {
  const { 
    pendentes: rawPendentes, 
    emAndamento: rawEmAndamento,
    realizados: rawRealizados, 
    totalRealizados, 
    totalPendentes, 
    horasTotal,
    trilha, 
    isLoading,
    iniciarTreinamento,
    refetch 
  } = useTreinamentos();
  const { toast } = useToast();

  // Combine all trainings for filtering
  const allTreinamentos = useMemo(() => [
    ...rawPendentes.map(t => ({ ...t, status: 'pendente' })),
    ...rawEmAndamento.map(t => ({ ...t, status: 'em_andamento' })),
    ...rawRealizados.map(t => ({ ...t, status: 'concluido' })),
  ], [rawPendentes, rawEmAndamento, rawRealizados]);

  const {
    filteredItems,
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    clearFilters,
    activeFilterCount,
  } = useFilters(allTreinamentos, filterConfigs);

  const { pendentes, emAndamento, realizados } = useMemo(() => ({
    pendentes: filteredItems.filter(t => t.status === 'pendente'),
    emAndamento: filteredItems.filter(t => t.status === 'em_andamento'),
    realizados: filteredItems.filter(t => t.status === 'concluido'),
  }), [filteredItems]);

  const handleIniciar = async (id: string, url?: string | null) => {
    const result = await iniciarTreinamento(id);
    
    if (result.success) {
      toast({
        title: 'Treinamento iniciado!',
        description: 'Bom estudo!',
      });
      
      // Se tiver URL, abrir em nova aba
      if (url) {
        window.open(url, '_blank');
      }
    } else {
      toast({
        title: 'Erro ao iniciar',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleDownloadCertificado = (url?: string | null) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      toast({
        title: 'Certificado indisponível',
        description: 'O certificado ainda não foi gerado.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <PageLayout title="Meus Treinamentos" showBack>
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => <ListItemSkeleton key={i} />)}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Meus Treinamentos" showBack onRefresh={refetch}>
      <div className="space-y-6 animate-fade-in-up">
        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-finance">{totalRealizados}</p>
            <p className="text-xs text-muted-foreground">Realizados</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-projects">{totalPendentes}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </Card>
          <Card className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{horasTotal}h</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </Card>
        </div>

        {/* Filtros */}
        <FilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filters}
          onFilterChange={setFilter}
          onClearFilters={clearFilters}
          filterConfigs={filterConfigs}
          activeFilterCount={activeFilterCount}
          searchPlaceholder="Buscar treinamentos..."
        />

        {/* Em Andamento */}
        {emAndamento.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">
              🔄 Em Andamento
            </h3>
            <div className="space-y-3">
              {emAndamento.map((tr) => (
                <Card key={tr.id} className="p-4 border-l-4 border-l-primary">
                  <div className="flex justify-between mb-2">
                    <Badge variant="secondary">Em progresso</Badge>
                    <span className="text-xs text-muted-foreground">
                      {tr.treinamento?.carga_horaria}h
                    </span>
                  </div>
                  <p className="font-semibold text-foreground">{tr.treinamento?.titulo}</p>
                  <Progress value={tr.progresso} className="h-2 mt-2" />
                  <p className="text-xs text-muted-foreground mt-1">{tr.progresso}% concluído</p>
                  {tr.treinamento?.url_treinamento && (
                    <Button 
                      size="sm" 
                      className="w-full mt-3"
                      onClick={() => window.open(tr.treinamento?.url_treinamento!, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-1" /> Continuar
                    </Button>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Pendentes */}
        {pendentes.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">
              ⚠️ Pendentes
            </h3>
            <div className="space-y-3">
              {pendentes.map((tr) => (
                <Card key={tr.id} className="p-4 border-l-4 border-l-projects">
                  <div className="flex justify-between mb-2">
                    <Badge variant={tr.treinamento?.tipo === 'obrigatorio' ? 'destructive' : 'secondary'}>
                      {tr.treinamento?.tipo === 'obrigatorio' ? '🔴 Obrigatório' : '🟡 Recomendado'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {tr.treinamento?.carga_horaria}h
                    </span>
                  </div>
                  <p className="font-semibold text-foreground">{tr.treinamento?.titulo}</p>
                  {tr.treinamento?.descricao && (
                    <p className="text-xs text-muted-foreground mt-1">{tr.treinamento.descricao}</p>
                  )}
                  {tr.prazo && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Prazo: {format(new Date(tr.prazo), 'dd/MM/yyyy')}
                    </p>
                  )}
                  <Button 
                    size="sm" 
                    className="w-full mt-3"
                    onClick={() => handleIniciar(tr.id, tr.treinamento?.url_treinamento)}
                  >
                    <Play className="w-4 h-4 mr-1" /> Iniciar
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Realizados */}
        {realizados.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase">
              ✅ Realizados
            </h3>
            <div className="space-y-3">
              {realizados.map((tr) => (
                <Card key={tr.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">{tr.treinamento?.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {tr.data_conclusao && format(new Date(tr.data_conclusao), 'dd/MM/yyyy')} 
                        {' | '}{tr.treinamento?.carga_horaria}h
                        {tr.nota && ` | Nota: ${tr.nota}`}
                      </p>
                      {tr.validade && (
                        <p className="text-xs text-muted-foreground">
                          Válido até: {format(new Date(tr.validade), 'dd/MM/yyyy')}
                        </p>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDownloadCertificado(tr.certificado_url)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Trilha de Desenvolvimento */}
        {trilha && (
          <Card className="p-4 bg-hr-light/30">
            <h3 className="font-semibold mb-2">📈 Trilha de Desenvolvimento</h3>
            <p className="text-sm mb-2">
              Nível: <span className="font-medium">{trilha.nivel_atual}</span>
              {trilha.proximo_nivel && ` → ${trilha.proximo_nivel}`}
            </p>
            <Progress value={trilha.progresso_percentual} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {trilha.treinamentos_faltantes > 0 
                ? `Faltam ${trilha.treinamentos_faltantes} treinamentos`
                : 'Trilha concluída! 🎉'}
            </p>
          </Card>
        )}

        {/* Mensagem quando não há treinamentos */}
        {pendentes.length === 0 && emAndamento.length === 0 && realizados.length === 0 && (
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Nenhum treinamento encontrado</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
