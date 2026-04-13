import { useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type TipoJustificativa = 'atestado' | 'falta_justificada' | 'atraso' | 'saida_antecipada' | 'esquecimento' | 'outros';

const tipoLabels: Record<TipoJustificativa, string> = {
  atestado: 'Atestado médico',
  falta_justificada: 'Falta justificada',
  atraso: 'Atraso',
  saida_antecipada: 'Saída antecipada',
  esquecimento: 'Esquecimento de registro',
  outros: 'Outros',
};

interface JustificativaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  onSubmit: (tipo: string, motivo: string, anexo: File | null) => Promise<void>;
  isSubmitting: boolean;
}

export const JustificativaDialog = ({ open, onOpenChange, selectedDate, onSubmit, isSubmitting }: JustificativaDialogProps) => {
  const [tipoJustificativa, setTipoJustificativa] = useState<TipoJustificativa | ''>('');
  const [motivoDescricao, setMotivoDescricao] = useState('');
  const [anexoFile, setAnexoFile] = useState<File | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return;
    setAnexoFile(file);
  };

  const handleSubmit = async () => {
    if (!tipoJustificativa || !motivoDescricao.trim()) return;
    await onSubmit(tipoJustificativa, motivoDescricao, anexoFile);
    setTipoJustificativa('');
    setMotivoDescricao('');
    setAnexoFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            Justificativa — {selectedDate && format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo *</Label>
            <Select value={tipoJustificativa} onValueChange={(v) => setTipoJustificativa(v as TipoJustificativa)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(tipoLabels) as [TipoJustificativa, string][]).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Descrição *</Label>
            <Textarea
              placeholder="Descreva o motivo..."
              value={motivoDescricao}
              onChange={(e) => setMotivoDescricao(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Anexo (opcional)</Label>
            {anexoFile ? (
              <div className="flex items-center gap-2 p-2 bg-muted rounded">
                <span className="text-sm truncate flex-1">{anexoFile.name}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAnexoFile(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="flex items-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50">
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Anexar documento (até 5MB)</span>
                <input type="file" className="hidden" onChange={handleFileSelect} accept=".pdf,.jpg,.jpeg,.png" />
              </label>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !tipoJustificativa || !motivoDescricao.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Justificativa'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
