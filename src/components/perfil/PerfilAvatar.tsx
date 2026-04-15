import { useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PerfilAvatarProps {
  userId: string;
  nome: string;
  avatarUrl: string | null;
  matricula: string | null;
}

export function PerfilAvatar({ userId, nome, avatarUrl, matricula }: PerfilAvatarProps) {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const initials = nome
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleUploadFoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: urlData.publicUrl })
        .eq('id', userId);
      if (updateError) throw updateError;

      toast({ title: 'Foto atualizada!', description: 'Recarregue a página para ver a nova foto.' });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({ title: 'Erro ao enviar foto', description: msg, variant: 'destructive' });
    }
    setIsUploading(false);
  };

  return (
    <div className="text-center">
      <div className="relative inline-block">
        <Avatar className="w-24 h-24 border-4 border-card shadow-lg">
          <AvatarImage src={avatarUrl || undefined} alt={nome} />
          <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <label className="absolute bottom-0 right-0">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUploadFoto}
            disabled={isUploading}
          />
          <Button
            size="icon"
            variant="secondary"
            className="w-8 h-8 rounded-full shadow-md cursor-pointer"
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
      <h2 className="text-xl font-display font-bold text-foreground mt-4">{nome}</h2>
      {matricula && (
        <p className="text-sm text-muted-foreground">Matrícula: {matricula}</p>
      )}
    </div>
  );
}
