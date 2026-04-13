import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MetaFormData } from '@/hooks/useMetas';
import { tipoOptions } from './constants';

interface MetaFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formData: MetaFormData;
  onFormChange: (data: MetaFormData) => void;
  onSubmit: () => void;
}

export const MetaFormDialog = ({ open, onOpenChange, formData, onFormChange, onSubmit }: MetaFormDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-1" />
          Nova Meta
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Meta</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-4 pr-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={formData.titulo}
                onChange={(e) => onFormChange({ ...formData, titulo: e.target.value })}
                placeholder="Ex: Aumentar vendas em 20%"
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => onFormChange({ ...formData, descricao: e.target.value })}
                placeholder="Detalhes da meta..."
              />
            </div>

            <div>
              <Label>Tipo</Label>
              <Select value={formData.tipo} onValueChange={(v) => onFormChange({ ...formData, tipo: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tipoOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Início</Label>
                <Input
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => onFormChange({ ...formData, data_inicio: e.target.value })}
                />
              </div>
              <div>
                <Label>Fim</Label>
                <Input
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) => onFormChange({ ...formData, data_fim: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Valor Meta</Label>
                <Input
                  type="number"
                  value={formData.valor_meta}
                  onChange={(e) => onFormChange({ ...formData, valor_meta: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Unidade</Label>
                <Input
                  value={formData.unidade}
                  onChange={(e) => onFormChange({ ...formData, unidade: e.target.value })}
                  placeholder="%"
                />
              </div>
            </div>

            <Button onClick={onSubmit} className="w-full">
              Criar Meta
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
