import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface DownloadOptions {
  documento_id: string;
  nome_arquivo: string;
  tipo: string;
}

export function useDocumentosDownload() {
  const { user } = useAuth();
  const { toast } = useToast();

  const registrarDownload = useCallback(async (documentoId: string) => {
    if (!user?.id) return;
    try {
      await supabase.rpc('fn_registrar_download_documento', {
        p_usuario_id: user.id,
        p_documento_id: documentoId,
        p_ip: '',
        p_user_agent: navigator.userAgent,
      });
    } catch (err) {
      console.error('Erro ao registrar download:', err);
    }
  }, [user?.id]);

  const downloadDocumento = useCallback(async (options: DownloadOptions) => {
    const { documento_id, nome_arquivo, tipo } = options;
    try {
      const { data } = supabase.storage.from('documentos').getPublicUrl(nome_arquivo);
      if (data?.publicUrl) {
        await registrarDownload(documento_id);
        window.open(data.publicUrl, '_blank');
        toast({ title: 'Download iniciado', description: nome_arquivo });
      }
    } catch (err) {
      toast({ title: 'Erro no download', variant: 'destructive' });
    }
  }, [registrarDownload, toast]);

  return { downloadDocumento, registrarDownload };
}

export default useDocumentosDownload;
