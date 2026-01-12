import { useState, useMemo } from 'react';
import { TrendingUp, Calendar, CheckCircle, DollarSign, Plus, Pencil, Trash2, Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageLayout } from '@/components/portal/PageLayout';
import { StatCardSkeleton, ListItemSkeleton } from '@/components/portal/Skeletons';
import { RemuneracaoVariavelModal } from '@/components/portal/RemuneracaoVariavelModal';
import { DeleteConfirmDialog } from '@/components/portal/ConfirmDialog';
import { useRemuneracaoVariavel, type TipoRemuneracao, type StatusRemuneracao, type RemuneracaoVariavel as RemuneracaoType } from '@/hooks/useRemuneracaoVariavel';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const mesesNome = ['', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

const tipoLabels: Record<TipoRemuneracao, string> = {
  comissao: 'Comissão',
  bonificacao: 'Bonificação',
  premio: 'Prêmio',
  plr: 'PLR',
  outro: 'Outro',
};

const tipoColors: Record<TipoRemuneracao, string> = {
  comissao: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  bonificacao: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  premio: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  plr: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  outro: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

const statusConfig: Record<StatusRemuneracao, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  aprovado: { label: 'Aprovado', color: 'bg-primary/10 text-primary' },
  pago: { label: 'Pago', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  cancelado: { label: 'Cancelado', color: 'bg-muted text-muted-foreground' },
};

export default function RemuneracaoVariavel() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RemuneracaoType | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<RemuneracaoType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [filtroPeriodo, setFiltroPeriodo] = useState<string>('todos');
  
  const { 
    remuneracoes, 
    stats,
    isLoading,
    create,
    update,
    remove,
    refetch 
  } = useRemuneracaoVariavel();

  // Gerar opções de período baseado nos dados
  const periodoOptions = useMemo(() => {
    const periodos = new Set<string>();
    remuneracoes.forEach(rem => {
      periodos.add(`${rem.mes}/${rem.ano}`);
    });
    return Array.from(periodos)
      .map(p => {
        const [mes, ano] = p.split('/').map(Number);
        return { value: p, label: `${mesesNome[mes]}/${ano}`, mes, ano };
      })
      .sort((a, b) => b.ano - a.ano || b.mes - a.mes);
  }, [remuneracoes]);

  // Filtrar remunerações
  const remuneracoesFiltradas = useMemo(() => {
    return remuneracoes.filter(rem => {
      if (filtroTipo !== 'todos' && rem.tipo !== filtroTipo) return false;
      if (filtroStatus !== 'todos' && rem.status !== filtroStatus) return false;
      if (filtroPeriodo !== 'todos') {
        const [mes, ano] = filtroPeriodo.split('/').map(Number);
        if (rem.mes !== mes || rem.ano !== ano) return false;
      }
      return true;
    });
  }, [remuneracoes, filtroTipo, filtroStatus, filtroPeriodo]);

  const hasActiveFilters = filtroTipo !== 'todos' || filtroStatus !== 'todos' || filtroPeriodo !== 'todos';

  const clearFilters = () => {
    setFiltroTipo('todos');
    setFiltroStatus('todos');
    setFiltroPeriodo('todos');
  };

  const handleEdit = (item: RemuneracaoType) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  const handleCloseModal = (open: boolean) => {
    setModalOpen(open);
    if (!open) {
      setEditingItem(null);
    }
  };

  const handleSubmit = async (data: Parameters<typeof create>[0]) => {
    if (editingItem) {
      const result = await update(editingItem.id, data);
      if (result.success) {
        toast.success('Remuneração atualizada com sucesso!');
      }
      return result;
    }
    return create(data);
  };

  const handleDeleteClick = (item: RemuneracaoType) => {
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    const result = await remove(itemToDelete.id);
    setIsDeleting(false);
    
    if (result.success) {
      toast.success('Remuneração excluída com sucesso!');
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } else {
      toast.error(result.error || 'Erro ao excluir remuneração');
    }
  };

  const maxValor = Math.max(...stats.dadosGrafico.map(d => d.valor), 1);

  if (isLoading) {
    return (
      <PageLayout title="Remuneração Variável" showBack>
        <div className="space-y-6">
          <StatCardSkeleton />
          <ListItemSkeleton />
          <ListItemSkeleton />
          <ListItemSkeleton />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout 
      title="Remuneração Variável" 
      showBack 
      onRefresh={refetch}
      action={
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Nova
        </Button>
      }
    >
      <div className="space-y-6 animate-fade-in-up">
        {/* Resumo Anual */}
        <Card className="p-5 bg-gradient-to-br from-primary/5 via-card to-card border-primary/20">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-muted-foreground uppercase">
              Resumo {new Date().getFullYear()}
            </h3>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-display font-bold text-foreground">
                {formatCurrency(stats.totalAno)}
              </p>
              <p className="text-xs text-muted-foreground">Total Ano</p>
            </div>
            <div>
              <p className="text-xl font-display font-bold text-foreground">
                {formatCurrency(stats.totalMes)}
              </p>
              <p className="text-xs text-muted-foreground">Este Mês</p>
            </div>
            <div>
              <p className="text-xl font-display font-bold text-foreground">
                {formatCurrency(stats.mediaMensal)}
              </p>
              <p className="text-xs text-muted-foreground">Média Mensal</p>
            </div>
          </div>
        </Card>

        {/* Gráfico */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-4">
            📈 Evolução Mensal
          </h3>
          <div className="flex items-end justify-between h-24 gap-1">
            {stats.dadosGrafico.map((item, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div 
                  className={`w-full rounded-t transition-all ${item.valor > 0 ? 'bg-primary' : 'bg-muted'}`}
                  style={{ height: `${(item.valor / maxValor) * 100}%`, minHeight: item.valor > 0 ? '4px' : '2px' }}
                />
                <span className="text-[10px] text-muted-foreground">{item.nome}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Por Tipo */}
        {Object.values(stats.porTipo).some(v => v > 0) && (
          <Card className="p-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-3">
              💰 Por Tipo
            </h3>
            <div className="space-y-2">
              {(Object.entries(stats.porTipo) as [TipoRemuneracao, number][])
                .filter(([_, valor]) => valor > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([tipo, valor]) => (
                  <div key={tipo} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={tipoColors[tipo]}>{tipoLabels[tipo]}</Badge>
                    </div>
                    <span className="font-medium text-foreground">{formatCurrency(valor)}</span>
                  </div>
                ))}
            </div>
          </Card>
        )}

        {/* Filtros */}
        {remuneracoes.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-muted-foreground uppercase">
                Filtros
              </h3>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="ml-auto text-xs h-7"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  {(Object.entries(tipoLabels) as [TipoRemuneracao, string][]).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  {(Object.entries(statusConfig) as [StatusRemuneracao, { label: string }][]).map(([value, { label }]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filtroPeriodo} onValueChange={setFiltroPeriodo}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os períodos</SelectItem>
                  {periodoOptions.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>
        )}

        {/* Lista de Remunerações */}
        {remuneracoesFiltradas.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                📋 Histórico
              </h3>
              {hasActiveFilters && (
                <span className="text-xs text-muted-foreground">
                  {remuneracoesFiltradas.length} de {remuneracoes.length} itens
                </span>
              )}
            </div>
            <div className="space-y-3">
              {remuneracoesFiltradas.map((rem) => (
                <Card key={rem.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={tipoColors[rem.tipo as TipoRemuneracao]}>
                          {tipoLabels[rem.tipo as TipoRemuneracao] || rem.tipo}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {mesesNome[rem.mes]}/{rem.ano}
                        </span>
                      </div>
                      <p className="font-medium text-foreground">{rem.descricao}</p>
                      {rem.referencia && (
                        <p className="text-xs text-muted-foreground mt-1">Ref: {rem.referencia}</p>
                      )}
                    </div>
                    <span className="font-bold text-lg text-foreground">
                      {formatCurrency(Number(rem.valor))}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Badge className={statusConfig[rem.status as StatusRemuneracao]?.color || statusConfig.pendente.color}>
                        {statusConfig[rem.status as StatusRemuneracao]?.label || rem.status}
                      </Badge>
                      {rem.status === 'pago' && rem.data_pagamento && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                          Pago em {format(new Date(rem.data_pagamento), 'dd/MM/yyyy')}
                        </span>
                      )}
                      {rem.percentual && (
                        <span className="text-xs text-muted-foreground">
                          {rem.percentual}%
                        </span>
                      )}
                    </div>
                    
                    {rem.status === 'pendente' && (
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(rem)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(rem)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Mensagem quando vazio após filtros */}
        {remuneracoes.length > 0 && remuneracoesFiltradas.length === 0 && (
          <div className="text-center py-8">
            <Filter className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">Nenhuma remuneração encontrada com os filtros selecionados</p>
            <Button variant="outline" onClick={clearFilters}>
              Limpar filtros
            </Button>
          </div>
        )}

        {/* Mensagem quando vazio */}
        {remuneracoes.length === 0 && (
          <div className="text-center py-8">
            <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">Nenhuma remuneração variável encontrada</p>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeira
            </Button>
          </div>
        )}
      </div>

      {/* Modal de criação/edição */}
      <RemuneracaoVariavelModal
        open={modalOpen}
        onOpenChange={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={editingItem ? {
          tipo: editingItem.tipo as any,
          descricao: editingItem.descricao,
          valor: Number(editingItem.valor),
          mes: editingItem.mes,
          ano: editingItem.ano,
          referencia: editingItem.referencia || '',
          percentual: editingItem.percentual,
          observacao: editingItem.observacao || '',
        } : undefined}
        mode={editingItem ? 'edit' : 'create'}
      />

      {/* Dialog de confirmação de exclusão */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        itemName={itemToDelete?.descricao || 'esta remuneração'}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </PageLayout>
  );
}
