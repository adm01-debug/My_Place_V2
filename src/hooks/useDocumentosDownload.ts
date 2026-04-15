import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { createLogger } from '@/lib/logger';

const log = createLogger('DocumentosDownload');

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
      // Registrar download na tabela de logs
      await supabase
        .from('documentos')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', documentoId);
    } catch (err) {
      log.error('Erro ao registrar download:', err);
    }
  }, [user?.id]);

  const downloadDocumento = useCallback(async (options: DownloadOptions) => {
    const { documento_id, nome_arquivo } = options;
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
