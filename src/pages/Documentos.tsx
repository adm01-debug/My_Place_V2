import { useState } from 'react';
import { FileText, Download, FolderOpen, Loader2, AlertCircle, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/portal/PageLayout';
import { MenuItemSkeleton } from '@/components/portal/Skeletons';
import { useDocumentos, type Documento } from '@/hooks/useDocumentos';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const tipoLabels: Record<string, string> = {
  holerite: 'Holerites',
  informe_rendimentos: 'Informe de Rendimentos',
  declaracao_vinculo: 'Declaração de Vínculo',
  carta_referencia: 'Carta de Referência',
  recibo_ferias: 'Recibos de Férias',
  contrato_trabalho: 'Contrato de Trabalho',
  certificado: 'Certificados',
  atestado: 'Atestados',
  advertencia: 'Advertências',
  ferias: 'Documentos de Férias',
  rescisao: 'Rescisão',
  termo_aditivo: 'Termos Aditivos',
  politica: 'Políticas',
  outros: 'Outros',
};

const tipoDescricoes: Record<string, string> = {
  holerite: 'Demonstrativos de pagamento',
  informe_rendimentos: 'Para declaração de IR',
  declaracao_vinculo: 'Comprovante de emprego',
  carta_referencia: 'Para fins de crédito',
  recibo_ferias: 'Comprovantes de férias',
  contrato_trabalho: 'Cópia do seu contrato',
  certificado: 'Treinamentos realizados',
  atestado: 'Atestados médicos',
  politica: 'Regulamentos e políticas',
};

export default function Documentos() {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const { documentos, isLoading, downloadDocumento, refetch } = useDocumentos();
  const { toast } = useToast();

  const handleDownload = async (documento: Documento) => {
    if (!documento.arquivo_url) {
      toast({
        title: 'Documento indisponível',
        description: 'Este documento ainda não foi disponibilizado.',
        variant: 'destructive',
      });
      return;
    }

    setDownloadingId(documento.id);
    
    const result = await downloadDocumento(documento);
    
    if (!result.success) {
      toast({
        title: 'Erro ao baixar',
        description: result.error,
        variant: 'destructive',
      });
    }

    setDownloadingId(null);
  };

  if (isLoading) {
    return (
      <PageLayout title="Meus Documentos" showBack>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => <MenuItemSkeleton key={i} />)}
        </div>
      </PageLayout>
    );
  }

  if (documentos.length === 0) {
    return (
      <PageLayout title="Meus Documentos" showBack onRefresh={refetch}>
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhum documento disponível</p>
          <p className="text-sm text-muted-foreground mt-1">
            Seus documentos aparecerão aqui quando estiverem prontos
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Meus Documentos" showBack onRefresh={refetch}>
      <div className="space-y-3 animate-fade-in-up">
        {documentos.map((doc) => {
          const isDownloading = downloadingId === doc.id;
          const hasFile = !!doc.arquivo_url;
          const isExpired = doc.validade && new Date(doc.validade) < new Date();

          return (
            <Card key={doc.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isExpired ? 'bg-destructive/10' : 'bg-muted'
                  }`}>
                    {isExpired ? (
                      <AlertCircle className="w-5 h-5 text-destructive" />
                    ) : (
                      <FileText className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-foreground truncate">{doc.titulo}</p>
                      {doc.confidencial && (
                        <Badge variant="outline" className="text-xs">🔒</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {doc.descricao || tipoDescricoes[doc.tipo] || tipoLabels[doc.tipo]}
                    </p>
                    {doc.referencia_mes && doc.referencia_ano && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="w-3 h-3" />
                        {String(doc.referencia_mes).padStart(2, '0')}/{doc.referencia_ano}
                      </p>
                    )}
                    {isExpired && (
                      <p className="text-xs text-destructive mt-1">
                        Vencido em {format(new Date(doc.validade!), 'dd/MM/yyyy')}
                      </p>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleDownload(doc)}
                  disabled={isDownloading || !hasFile}
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : doc.tipo === 'holerite' || doc.tipo === 'recibo_ferias' || doc.tipo === 'certificado' ? (
                    <FolderOpen className="w-4 h-4" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </PageLayout>
  );
}
