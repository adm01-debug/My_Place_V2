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
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Meta, KeyResultFormData } from '@/hooks/useMetas';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays, parseISO } from 'date-fns';
import { KeyResultItem } from './KeyResultItem';
import { tipoOptions } from './constants';

interface MetaCardProps {
  meta: Meta;
  onUpdate: (id: string, valorAtual: number) => void;
  onUpdateKR: (id: string, valorAtual: number) => void;
  onAddKR: (metaId: string, data: KeyResultFormData) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}

export const MetaCard = ({ meta, onUpdate, onUpdateKR, onAddKR, onDelete, onStatusChange }: MetaCardProps) => {
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
