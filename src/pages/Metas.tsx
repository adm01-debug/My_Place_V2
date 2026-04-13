import { useState } from 'react';
import { Target } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageLayout } from '@/components/portal/PageLayout';
import { useMetas, MetaFormData } from '@/hooks/useMetas';
import { format } from 'date-fns';
import { MetaCard } from '@/components/metas/MetaCard';
import { MetaFormDialog } from '@/components/metas/MetaFormDialog';
import { statusColors, statusLabels } from '@/components/metas/constants';

export default function Metas() {
  const { 
    metas, isLoading, stats, refetch, 
    criarMeta, atualizarProgresso, atualizarKeyResult,
    adicionarKeyResult, excluirMeta, atualizarMeta 
  } = useMetas();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<MetaFormData>({
    titulo: '', descricao: '', tipo: 'produtividade',
    data_inicio: format(new Date(), 'yyyy-MM-dd'),
    data_fim: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    valor_meta: 100, unidade: '%',
  });

  const handleCreate = async () => {
    if (!formData.titulo.trim()) return;
    const result = await criarMeta(formData);
    if (result) {
      setShowForm(false);
      setFormData({
        titulo: '', descricao: '', tipo: 'produtividade',
        data_inicio: format(new Date(), 'yyyy-MM-dd'),
        data_fim: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        valor_meta: 100, unidade: '%',
      });
    }
  };

  const handleStatusChange = (id: string, status: string) => {
    atualizarMeta(id, { status });
  };

  const metasEmAndamento = metas.filter(m => m.status === 'em_andamento');
  const metasConcluidas = metas.filter(m => m.status === 'concluida');

  if (isLoading) {
    return (
      <PageLayout title="Metas & OKRs">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Metas & OKRs" onRefresh={refetch}>
      <div className="space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2">
          <Card className="p-2 text-center">
            <p className="text-xl font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </Card>
          <Card className="p-2 text-center">
            <p className="text-xl font-bold text-primary">{stats.emAndamento}</p>
            <p className="text-xs text-muted-foreground">Ativas</p>
          </Card>
          <Card className="p-2 text-center">
            <p className="text-xl font-bold text-finance">{stats.concluidas}</p>
            <p className="text-xs text-muted-foreground">Concluídas</p>
          </Card>
          <Card className="p-2 text-center">
            <p className="text-xl font-bold">{stats.progressoMedio}%</p>
            <p className="text-xs text-muted-foreground">Progresso</p>
          </Card>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Minhas Metas
          </h2>
          <MetaFormDialog
            open={showForm}
            onOpenChange={setShowForm}
            formData={formData}
            onFormChange={setFormData}
            onSubmit={handleCreate}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="andamento" className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="andamento">
              Em Andamento
              {metasEmAndamento.length > 0 && (
                <Badge variant="secondary" className="ml-2">{metasEmAndamento.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="concluidas">
              Concluídas ({metasConcluidas.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="andamento" className="mt-4 space-y-3">
            {metasEmAndamento.length === 0 ? (
              <Card className="p-8 text-center">
                <Target className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Nenhuma meta em andamento</p>
              </Card>
            ) : (
              metasEmAndamento.map(meta => (
                <MetaCard
                  key={meta.id}
                  meta={meta}
                  onUpdate={atualizarProgresso}
                  onUpdateKR={atualizarKeyResult}
                  onAddKR={adicionarKeyResult}
                  onDelete={excluirMeta}
                  onStatusChange={handleStatusChange}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="concluidas" className="mt-4 space-y-3">
            {metasConcluidas.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">Nenhuma meta concluída ainda</p>
              </Card>
            ) : (
              metasConcluidas.map(meta => (
                <MetaCard
                  key={meta.id}
                  meta={meta}
                  onUpdate={atualizarProgresso}
                  onUpdateKR={atualizarKeyResult}
                  onAddKR={adicionarKeyResult}
                  onDelete={excluirMeta}
                  onStatusChange={handleStatusChange}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  );
}
