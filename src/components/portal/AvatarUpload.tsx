import { useState, useRef } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AvatarUploadProps {
  currentUrl?: string | null;
  nome: string;
  onUploadComplete?: (url: string) => void;
  size?: 'sm' | 'md' | 'lg';
}

export function AvatarUpload({ 
  currentUrl, 
  nome, 
  onUploadComplete,
  size = 'lg' 
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const buttonSizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-7 h-7',
    lg: 'w-8 h-8',
  };

  const initials = nome
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Arquivo inválido',
        description: 'Por favor, selecione uma imagem.',
        variant: 'destructive',
      });
      return;
    }

    // Validar tamanho (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo é 2MB.',
        variant: 'destructive',
      });
      return;
    }

    // Criar preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
      setSelectedFile(file);
      setShowPreview(true);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || !user) return;

    setIsUploading(true);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload para Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, selectedFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Adicionar timestamp para cache busting
      const urlWithTimestamp = `${urlData.publicUrl}?t=${Date.now()}`;

      // Atualizar perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlWithTimestamp })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: 'Foto atualizada!',
        description: 'Sua foto de perfil foi alterada com sucesso.',
      });

      onUploadComplete?.(urlWithTimestamp);
      setShowPreview(false);
      setPreviewUrl(null);
      setSelectedFile(null);
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar foto',
        description: error.message,
        variant: 'destructive',
      });
    }

    setIsUploading(false);
  };

  const handleCancel = () => {
    setShowPreview(false);
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className="relative inline-block">
        <Avatar className={`${sizeClasses[size]} border-4 border-card shadow-lg`}>
          <AvatarImage src={currentUrl || undefined} alt={nome} />
          <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        
        <label className={`absolute bottom-0 right-0 cursor-pointer`}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          <Button
            size="icon"
            variant="secondary"
            className={`${buttonSizeClasses[size]} rounded-full shadow-md`}
            asChild
          >
            <span>
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </span>
          </Button>
        </label>
      </div>

      {/* Modal de Preview */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar foto</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            {previewUrl && (
              <Avatar className="w-32 h-32 border-4 border-card shadow-lg">
                <AvatarImage src={previewUrl} alt="Preview" />
              </Avatar>
            )}
            <p className="text-sm text-muted-foreground text-center">
              Deseja usar esta foto como seu avatar?
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
              disabled={isUploading}
            >
              <X className="w-4 h-4 mr-1" />
              Cancelar
            </Button>
            <Button
              className="flex-1"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Camera className="w-4 h-4 mr-1" />
              )}
              {isUploading ? 'Enviando...' : 'Confirmar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
