import { useState } from 'react';
import { FileText, Upload, Loader2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';

type MotivoJustificativa = 
  | 'esquecimento' 
  | 'problema_sistema' 
  | 'trabalho_externo'
  | 'reuniao_externa' 
  | 'atestado_medico' 
  | 'outros';

const motivoLabels: Record<MotivoJustificativa, string> = {
  esquecimento: 'Esquecimento',
  problema_sistema: 'Problema no sistema',
  trabalho_externo: 'Trabalho externo',
  reuniao_externa: 'Reunião externa',
  atestado_medico: 'Atestado médico',
  outros: 'Outros',
};

interface JustificativaPontoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registroPontoId: string;
  dataRegistro: Date;
  onSuccess?: () => void;
}

export function JustificativaPontoModal({
  open,
  onOpenChange,
  registroPontoId,
  dataRegistro,
  onSuccess,
}: JustificativaPontoModalProps) {
  const [motivo, setMotivo] = useState<MotivoJustificativa | ''>('');
  const [descricao, setDescricao] = useState('');
  const [anexo, setAnexo] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo é 5MB.',
        variant: 'destructive',
      });
      return;
    }

    setAnexo(file);
  };

  const uploadAnexo = async (): Promise<string | null> => {
    if (!anexo || !user) return null;

    setIsUploading(true);

    try {
      const fileExt = anexo.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error } = await supabase.storage
        .from('atestados')
        .upload(fileName, anexo);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('atestados')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar anexo',
        description: error.message,
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user || !motivo || !descricao.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o motivo e a descrição.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let anexoUrl: string | null = null;
      if (anexo) {
        anexoUrl = await uploadAnexo();
      }

      const { error } = await supabase
        .from('justificativas_ponto' as any)
        .insert({
          registro_ponto_id: registroPontoId,
          user_id: user.id,
          motivo,
          descricao,
          anexo_url: anexoUrl,
          status: 'pendente',
        } as any);

      if (error) throw error;

      toast({
        title: 'Justificativa enviada',
        description: 'Sua justificativa será analisada pelo RH.',
      });

      setMotivo('');
      setDescricao('');
      setAnexo(null);
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar justificativa',
        description: error.message,
        variant: 'destructive',
      });
    }

    setIsSubmitting(false);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setMotivo('');
      setDescricao('');
      setAnexo(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Justificar Registro
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Registro de {format(dataRegistro, 'dd/MM/yyyy HH:mm')}
          </p>

          <div className="space-y-2">
            <Label>Motivo *</Label>
            <Select value={motivo} onValueChange={(v) => setMotivo(v as MotivoJustificativa)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o motivo" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(motivoLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Descrição *</Label>
            <Textarea
              placeholder="Descreva o motivo da justificativa..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Anexo (opcional)</Label>
            {anexo ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm flex-1 truncate">{anexo.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setAnexo(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={handleFileSelect}
                />
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Clique para anexar arquivo
                </span>
              </label>
            )}
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: imagens, PDF. Máximo 5MB.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !motivo || !descricao.trim()}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-1" />
            )}
            {isSubmitting ? 'Enviando...' : 'Enviar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
