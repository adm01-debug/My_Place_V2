import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type DocumentoRow = Database['public']['Tables']['documentos']['Row'];

export type TipoDocumento = DocumentoRow['tipo'];

export interface Documento {
  id: string;
  tipo: string;
  titulo: string; // mapped from DB's `nome`
  descricao: string | null;
  arquivo_url: string;
  validade: string | null; // mapped from DB's `data_validade`
  referencia_mes: number | null;
  referencia_ano: number | null;
  confidencial: boolean;
  created_at: string;
}

interface DocumentosAgrupados {
  [key: string]: Documento[];
}

/**
 * Map DB row to our Documento interface
 */
function mapRowToDocumento(row: DocumentoRow): Documento {
  return {
    id: row.id,
    tipo: row.tipo,
    titulo: row.nome,
    descricao: row.descricao,
    arquivo_url: row.arquivo_url,
    validade: row.data_validade,
    referencia_mes: null, // not in DB schema
    referencia_ano: null, // not in DB schema
    confidencial: false, // not in DB schema
    created_at: row.created_at,
  };
}

export function useDocumentos() {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [documentosAgrupados, setDocumentosAgrupados] = useState<DocumentosAgrupados>({});
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchDocumentos = async () => {
    if (!user) return;

    setIsLoading(true);

    const { data, error } = await supabase
      .from('documentos')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documentos:', error);
      toast({
        title: 'Erro ao carregar documentos',
        description: error.message,
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    const docs = (data ?? []).map(mapRowToDocumento);
    setDocumentos(docs);

    // Agrupar por tipo
    const agrupados = docs.reduce((acc, doc) => {
      const tipo = doc.tipo;
      if (!acc[tipo]) {
        acc[tipo] = [];
      }
      acc[tipo].push(doc);
      return acc;
    }, {} as DocumentosAgrupados);

    setDocumentosAgrupados(agrupados);
    setIsLoading(false);
  };

  const downloadDocumento = async (documento: Documento) => {
    if (!user) return { success: false, error: 'Usuário não autenticado' };

    if (!documento.arquivo_url) {
      return { success: false, error: 'Documento não possui arquivo disponível' };
    }

    try {
      // Note: documentos_downloads table doesn't exist in schema
      // Audit logging should be implemented server-side or via RLS trigger

      // Se é URL do Supabase Storage, gerar URL assinada
      if (documento.arquivo_url.includes('supabase')) {
        const path = documento.arquivo_url.split('/').pop();
        if (path) {
          const { data, error } = await supabase.storage
            .from('documentos')
            .createSignedUrl(path, 3600); // 1 hora

          if (error) throw error;

          window.open(data.signedUrl, '_blank');
          return { success: true };
        }
      }

      // URL externa, abrir diretamente
      window.open(documento.arquivo_url, '_blank');
      return { success: true };

    } catch (err: unknown) {
      console.error('Error downloading documento:', err);
      const message = err instanceof Error ? err.message : 'Erro ao baixar documento';
      return { success: false, error: message };
    }
  };

  const getDocumentosPorTipo = (tipo: string): Documento[] => {
    return documentosAgrupados[tipo] || [];
  };

  const getDocumentosRecentes = (limite: number = 5): Documento[] => {
    return documentos.slice(0, limite);
  };

  const getInformesRendimentos = (): Documento[] => {
    return documentos
      .filter(d => d.tipo === 'informe_rendimentos')
      .sort((a, b) => (b.referencia_ano || 0) - (a.referencia_ano || 0));
  };

  const getHoleritesDisponiveis = (): Documento[] => {
    return documentos
      .filter(d => d.tipo === 'holerite')
      .sort((a, b) => {
        const anoA = a.referencia_ano || 0;
        const anoB = b.referencia_ano || 0;
        const mesA = a.referencia_mes || 0;
        const mesB = b.referencia_mes || 0;
        return anoB - anoA || mesB - mesA;
      });
  };

  useEffect(() => {
    fetchDocumentos();
  }, [user]);

  return {
    documentos,
    documentosAgrupados,
    isLoading,
    downloadDocumento,
    getDocumentosPorTipo,
    getDocumentosRecentes,
    getInformesRendimentos,
    getHoleritesDisponiveis,
    refetch: fetchDocumentos,
  };
}
