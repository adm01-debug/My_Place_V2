import { useState } from 'react';
import { 
  Target, Plus, ChevronDown, ChevronRight, TrendingUp, Calendar,
  CheckCircle2, Clock, AlertTriangle, Trash2, Edit2, X, Check
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PageLayout } from '@/components/portal/PageLayout';
import { useMetas, Meta, KeyResult, MetaFormData, KeyResultFormData } from '@/hooks/useMetas';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays, parseISO, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const tipoOptions = [
  { value: 'vendas', label: 'Vendas', cor: 'text-finance' },
  { value: 'produtividade', label: 'Produtividade', cor: 'text-primary' },
  { value: 'desenvolvimento', label: 'Desenvolvimento', cor: 'text-hr' },
  { value: 'qualidade', label: 'Qualidade', cor: 'text-projects' },
  { value: 'outro', label: 'Outro', cor: 'text-muted-foreground' },
];

const statusColors: Record<string, string> = {
  em_andamento: 'bg-blue-500',
  concluida: 'bg-green-500',
  cancelada: 'bg-gray-500',
  pausada: 'bg-yellow-500',
};

const statusLabels: Record<string, string> = {
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
  pausada: 'Pausada',
};

interface MetaCardProps {
  meta: Meta;
  onUpdate: (id: string, valorAtual: number) => void;
  onUpdateKR: (id: string, valorAtual: number) => void;
  onAddKR: (metaId: string, data: KeyResultFormData) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

const MetaCard = ({ meta, onUpdate, onUpdateKR, onAddKR, onDelete, onStatusChange }: MetaCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [novoValor, setNovoValor] = useState(meta.valor_atual);
  const [showKRForm, setShowKRForm] = useState(false);
  const [krForm, setKrForm] = useState<KeyResultFormData>({
    titulo: '',
    valor_meta: 100,
    unidade: '%',
    peso: 1,
  });

  const diasRestantes = differenceInDays(parseISO(meta.data_fim), new Date());
  const isAtrasada = diasRestantes < 0 && meta.status === 'em_andamento';
  const tipoConfig = tipoOptions.find(t => t.value === meta.tipo) || tipoOptions[4];

  const handleSaveProgress = () => {
    onUpdate(meta.id, novoValor);
    setIsEditing(false);
  };

  const handleAddKR = () => {
    if (!krForm.titulo.trim()) return;
    onAddKR(meta.id, krForm);
    setKrForm({ titulo: '', valor_meta: 100, unidade: '%', peso: 1 });
    setShowKRForm(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={cn(
        'overflow-hidden',
        isAtrasada && 'border-destructive/50'
      )}>
        {/* Header */}
        <div 
          className="p-4 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                meta.status === 'concluida' ? 'bg-green-500/10' : 'bg-primary/10'
              )}>
                {meta.status === 'concluida' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <Target className={cn('w-5 h-5', tipoConfig.cor)} />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-sm">{meta.titulo}</h3>
                  <Badge variant="outline" className="text-xs">
                    {tipoConfig.label}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(parseISO(meta.data_fim), 'dd/MM/yyyy')}
                  </span>
                  {isAtrasada ? (
                    <span className="flex items-center gap-1 text-destructive">
                      <AlertTriangle className="w-3 h-3" />
                      {Math.abs(diasRestantes)} dias atrasado
                    </span>
                  ) : diasRestantes <= 7 && meta.status === 'em_andamento' ? (
                    <span className="flex items-center gap-1 text-yellow-500">
                      <Clock className="w-3 h-3" />
                      {diasRestantes} dias restantes
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <span className="text-lg font-bold">{meta.progresso}%</span>
              </div>
              {isExpanded ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
          </div>

          <Progress value={meta.progresso} className="h-2 mt-3" />
        </div>

        {/* Expanded Content */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t"
            >
              <div className="p-4 space-y-4">
                {meta.descricao && (
                  <p className="text-sm text-muted-foreground">{meta.descricao}</p>
                )}

                {/* Valor principal */}
                <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Progresso</p>
                    <p className="font-semibold">
                      {meta.valor_atual} / {meta.valor_meta} {meta.unidade}
                    </p>
                  </div>
                  
                  {meta.status === 'em_andamento' && (
                    <Dialog open={isEditing} onOpenChange={setIsEditing}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Edit2 className="w-4 h-4 mr-1" />
                          Atualizar
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Atualizar Progresso</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label>Valor Atual ({meta.unidade})</Label>
                            <Input
                              type="number"
                              value={novoValor}
                              onChange={(e) => setNovoValor(Number(e.target.value))}
                              max={meta.valor_meta}
                            />
                          </div>
                          <Slider
                            value={[novoValor]}
                            max={meta.valor_meta}
                            step={1}
                            onValueChange={([v]) => setNovoValor(v)}
                          />
                          <Button onClick={handleSaveProgress} className="w-full">
                            Salvar
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {/* Key Results */}
                {meta.key_results && meta.key_results.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Key Results</h4>
                    {meta.key_results.map((kr) => (
                      <KeyResultItem 
                        key={kr.id} 
                        kr={kr} 
                        onUpdate={onUpdateKR}
                        disabled={meta.status !== 'em_andamento'}
                      />
                    ))}
                  </div>
                )}

                {/* Add Key Result */}
                {meta.status === 'em_andamento' && (
                  <div>
                    {showKRForm ? (
                      <Card className="p-3 space-y-3 bg-muted/30">
                        <Input
                          placeholder="Título do Key Result"
                          value={krForm.titulo}
                          onChange={(e) => setKrForm({ ...krForm, titulo: e.target.value })}
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-xs">Meta</Label>
                            <Input
                              type="number"
                              value={krForm.valor_meta}
                              onChange={(e) => setKrForm({ ...krForm, valor_meta: Number(e.target.value) })}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Unidade</Label>
                            <Input
                              value={krForm.unidade}
                              onChange={(e) => setKrForm({ ...krForm, unidade: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleAddKR} className="flex-1">
                            <Check className="w-4 h-4 mr-1" />
                            Adicionar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setShowKRForm(false)}>
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setShowKRForm(true)}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Adicionar Key Result
                      </Button>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  {meta.status === 'em_andamento' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex-1"
                      onClick={() => onStatusChange(meta.id, 'concluida')}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Concluir
                    </Button>
                  )}
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Meta</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDelete(meta.id)}>
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

interface KeyResultItemProps {
  kr: KeyResult;
  onUpdate: (id: string, valorAtual: number) => void;
  disabled?: boolean;
}

const KeyResultItem = ({ kr, onUpdate, disabled }: KeyResultItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [novoValor, setNovoValor] = useState(kr.valor_atual);
  const progresso = Math.min(Math.round((kr.valor_atual / kr.valor_meta) * 100), 100);

  const handleSave = () => {
    onUpdate(kr.id, novoValor);
    setIsEditing(false);
  };

  return (
    <div className="bg-muted/30 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{kr.titulo}</span>
        <span className="text-sm">
          {kr.valor_atual}/{kr.valor_meta} {kr.unidade}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <Progress value={progresso} className="h-1.5 flex-1" />
        <span className="text-xs text-muted-foreground w-10 text-right">{progresso}%</span>
        
        {!disabled && (
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <Edit2 className="w-3 h-3" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Atualizar: {kr.titulo}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Valor Atual ({kr.unidade})</Label>
                  <Input
                    type="number"
                    value={novoValor}
                    onChange={(e) => setNovoValor(Number(e.target.value))}
                    max={kr.valor_meta}
                  />
                </div>
                <Slider
                  value={[novoValor]}
                  max={kr.valor_meta}
                  step={1}
                  onValueChange={([v]) => setNovoValor(v)}
                />
                <Button onClick={handleSave} className="w-full">Salvar</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default function Metas() {
  const { 
    metas, 
    isLoading, 
    stats, 
    refetch, 
    criarMeta, 
    atualizarProgresso, 
    atualizarKeyResult,
    adicionarKeyResult,
    excluirMeta,
    atualizarMeta 
  } = useMetas();
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<MetaFormData>({
    titulo: '',
    descricao: '',
    tipo: 'produtividade',
    data_inicio: format(new Date(), 'yyyy-MM-dd'),
    data_fim: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    valor_meta: 100,
    unidade: '%',
  });

  const handleCreate = async () => {
    if (!formData.titulo.trim()) return;
    const result = await criarMeta(formData);
    if (result) {
      setShowForm(false);
      setFormData({
        titulo: '',
        descricao: '',
        tipo: 'produtividade',
        data_inicio: format(new Date(), 'yyyy-MM-dd'),
        data_fim: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
        valor_meta: 100,
        unidade: '%',
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
            <Target className="w-4 h-4 mx-auto text-primary mb-1" />
            <p className="text-lg font-bold">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </Card>
          <Card className="p-2 text-center">
            <Clock className="w-4 h-4 mx-auto text-blue-500 mb-1" />
            <p className="text-lg font-bold">{stats.emAndamento}</p>
            <p className="text-xs text-muted-foreground">Ativas</p>
          </Card>
          <Card className="p-2 text-center">
            <CheckCircle2 className="w-4 h-4 mx-auto text-green-500 mb-1" />
            <p className="text-lg font-bold">{stats.concluidas}</p>
            <p className="text-xs text-muted-foreground">Concluídas</p>
          </Card>
          <Card className="p-2 text-center">
            <TrendingUp className="w-4 h-4 mx-auto text-finance mb-1" />
            <p className="text-lg font-bold">{stats.progressoMedio}%</p>
            <p className="text-xs text-muted-foreground">Média</p>
          </Card>
        </div>

        {/* Add Button */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Nova Meta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Nova Meta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Título *</Label>
                <Input
                  placeholder="Ex: Aumentar vendas em 20%"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                />
              </div>
              
              <div>
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Descreva os detalhes da meta..."
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                />
              </div>
              
              <div>
                <Label>Tipo</Label>
                <Select 
                  value={formData.tipo} 
                  onValueChange={(v) => setFormData({ ...formData, tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tipoOptions.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={formData.data_inicio}
                    onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={formData.data_fim}
                    onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Valor Meta</Label>
                  <Input
                    type="number"
                    value={formData.valor_meta}
                    onChange={(e) => setFormData({ ...formData, valor_meta: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Unidade</Label>
                  <Input
                    placeholder="%, R$, unidades..."
                    value={formData.unidade}
                    onChange={(e) => setFormData({ ...formData, unidade: e.target.value })}
                  />
                </div>
              </div>
              
              <Button onClick={handleCreate} className="w-full">
                Criar Meta
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Tabs */}
        <Tabs defaultValue="ativas" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="ativas">
              Ativas
              {metasEmAndamento.length > 0 && (
                <Badge variant="secondary" className="ml-2">{metasEmAndamento.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="concluidas">
              Concluídas
              {metasConcluidas.length > 0 && (
                <Badge variant="secondary" className="ml-2">{metasConcluidas.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ativas" className="mt-4 space-y-3">
            {metasEmAndamento.length === 0 ? (
              <Card className="p-8 text-center">
                <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Nenhuma meta ativa</h3>
                <p className="text-sm text-muted-foreground">
                  Crie sua primeira meta para começar a acompanhar seu progresso.
                </p>
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
                <CheckCircle2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium mb-2">Nenhuma meta concluída</h3>
                <p className="text-sm text-muted-foreground">
                  Suas metas concluídas aparecerão aqui.
                </p>
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
