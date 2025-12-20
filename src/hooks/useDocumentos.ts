import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

type TipoDocumento = 
  | 'holerite' | 'informe_rendimentos' | 'declaracao_vinculo' 
  | 'carta_referencia' | 'recibo_ferias' | 'contrato_trabalho'
  | 'certificado' | 'atestado' | 'advertencia' | 'ferias'
  | 'rescisao' | 'termo_aditivo' | 'politica' | 'outros';

interface Documento {
  id: string;
  tipo: TipoDocumento;
  titulo: string;
  descricao: string | null;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  arquivo_tamanho: number | null;
  arquivo_tipo: string | null;
  disponivel: boolean;
  confidencial: boolean;
  gerado_em: string | null;
  validade: string | null;
  referencia_mes: number | null;
  referencia_ano: number | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface DocumentosAgrupados {
  [key: string]: Documento[];
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
      .from('documentos' as any)
      .select('*')
      .eq('user_id', user.id)
      .eq('disponivel', true)
      .order('gerado_em', { ascending: false }) as { data: any[] | null; error: any };

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

    const docs = (data || []) as Documento[];
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
      // Registrar download para auditoria
      await supabase.from('documentos_downloads' as any).insert({
        documento_id: documento.id,
        user_id: user.id,
        user_agent: navigator.userAgent,
      } as any);

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

    } catch (error: any) {
      console.error('Error downloading documento:', error);
      return { success: false, error: error.message || 'Erro ao baixar documento' };
    }
  };

  const getDocumentosPorTipo = (tipo: TipoDocumento): Documento[] => {
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
