import { useState } from 'react';
import { Bell, Download, Eye, CheckCheck, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageLayout } from '@/components/portal/PageLayout';
import { ListItemSkeleton } from '@/components/portal/Skeletons';
import { useComunicados } from '@/hooks/useComunicados';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function Comunicados() {
  const [selectedComunicado, setSelectedComunicado] = useState<any | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const { 
    comunicados, 
    totalNaoLidos, 
    isLoading, 
    marcarComoLido,
    marcarTodosComoLidos,
    refetch 
  } = useComunicados();
  const { toast } = useToast();

  const handleOpenComunicado = async (comunicado: any) => {
    setSelectedComunicado(comunicado);
    
    // Marcar como lido ao abrir
    if (!comunicado.lido) {
      await marcarComoLido(comunicado.id);
    }
  };

  const handleMarcarTodosLidos = async () => {
    setMarkingAllRead(true);
    const result = await marcarTodosComoLidos();
    setMarkingAllRead(false);
    
    if (result.success) {
      toast({
        title: 'Pronto!',
        description: 'Todos os comunicados foram marcados como lidos.',
      });
    } else {
      toast({
        title: 'Erro',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleDownloadAnexo = (url: string | null) => {
    if (url) {
      window.open(url, '_blank');
    } else {
      toast({
        title: 'Anexo indisponível',
        description: 'Este comunicado não possui anexo.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <PageLayout title="Comunicados" showBack>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => <ListItemSkeleton key={i} />)}
        </div>
      </PageLayout>
    );
  }

  if (comunicados.length === 0) {
    return (
      <PageLayout title="Comunicados" showBack onRefresh={refetch}>
        <div className="text-center py-12">
          <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhum comunicado disponível</p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Comunicados" showBack onRefresh={refetch}>
      <div className="space-y-4 animate-fade-in-up">
        {/* Botão marcar todos como lidos */}
        {totalNaoLidos > 0 && (
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {totalNaoLidos} não {totalNaoLidos === 1 ? 'lido' : 'lidos'}
            </p>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleMarcarTodosLidos}
              disabled={markingAllRead}
            >
              {markingAllRead ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <CheckCheck className="w-4 h-4 mr-1" />
              )}
              Marcar todos como lidos
            </Button>
          </div>
        )}

        {/* Lista de comunicados */}
        <div className="space-y-3">
          {comunicados.map((com) => (
            <Card 
              key={com.id} 
              className={`p-4 cursor-pointer transition-colors hover:bg-muted/50 ${
                !com.lido ? 'border-l-4 border-l-primary' : ''
              }`}
              onClick={() => handleOpenComunicado(com)}
            >
              <div className="flex items-start gap-2 mb-2">
                {com.importante && !com.lido && (
                  <Badge variant="destructive" className="text-xs">NOVO</Badge>
                )}
                {com.importante && com.lido && (
                  <Badge variant="outline" className="text-xs">Importante</Badge>
                )}
                <div className="flex-1">
                  <p className={`font-semibold text-foreground ${!com.lido ? '' : 'opacity-80'}`}>
                    {com.titulo}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(com.data_publicacao), 'dd/MM/yyyy')} | {com.categoria}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {com.resumo || com.conteudo.substring(0, 100)}...
              </p>
              <div className="flex gap-2 mt-3">
                <Button variant="link" size="sm" className="p-0 h-auto">
                  <Eye className="w-3 h-3 mr-1" /> Ler completo
                </Button>
                {com.anexo_url && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadAnexo(com.anexo_url);
                    }}
                  >
                    <Download className="w-3 h-3 mr-1" /> Baixar
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Modal de detalhe do comunicado */}
      <Dialog open={!!selectedComunicado} onOpenChange={() => setSelectedComunicado(null)}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          {selectedComunicado && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline">{selectedComunicado.categoria}</Badge>
                  {selectedComunicado.importante && (
                    <Badge variant="destructive">Importante</Badge>
                  )}
                </div>
                <DialogTitle className="text-lg">
                  {selectedComunicado.titulo}
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Publicado em {format(new Date(selectedComunicado.data_publicacao), 'dd/MM/yyyy HH:mm')}
                </p>
              </DialogHeader>

              <div className="py-4">
                <div className="prose prose-sm max-w-none">
                  <p className="text-foreground whitespace-pre-wrap">
                    {selectedComunicado.conteudo}
                  </p>
                </div>
              </div>

              {selectedComunicado.anexo_url && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleDownloadAnexo(selectedComunicado.anexo_url)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar anexo
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}
