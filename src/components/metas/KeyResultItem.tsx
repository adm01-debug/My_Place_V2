import { useState } from 'react';
import { Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { KeyResult } from '@/hooks/useMetas';

interface KeyResultItemProps {
  kr: KeyResult;
  onUpdate: (id: string, valorAtual: number) => void;
  disabled?: boolean;
}

export const KeyResultItem = ({ kr, onUpdate, disabled }: KeyResultItemProps) => {
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
