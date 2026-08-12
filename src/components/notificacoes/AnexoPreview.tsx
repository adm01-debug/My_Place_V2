import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Image as ImageIcon, ExternalLink, Eye } from 'lucide-react';

interface AnexoPreviewProps {
  url: string;
  titulo?: string;
}

type Kind = 'image' | 'pdf' | 'other';

const detectKind = (url: string): Kind => {
  const clean = url.split('?')[0].split('#')[0].toLowerCase();
  if (/\.(png|jpe?g|gif|webp|avif|svg|bmp)$/.test(clean)) return 'image';
  if (/\.pdf$/.test(clean)) return 'pdf';
  return 'other';
};

/**
 * Pré-visualização inline de anexos vinculados a notificações.
 * - Imagens: renderiza thumbnail clicável que abre em Dialog.
 * - PDFs: mostra chip com botão para abrir viewer embutido.
 * - Outros: não renderiza nada (o link "Acessar" já existe no card).
 */
export function AnexoPreview({ url, titulo }: AnexoPreviewProps) {
  const [open, setOpen] = useState(false);
  const kind = detectKind(url);

  if (kind === 'other') return null;

  const handleOpenViewer = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setOpen(true);
  };

  return (
    <>
      <div className="mt-2" onClick={(e) => e.stopPropagation()}>
        {kind === 'image' ? (
          <button
            type="button"
            onClick={handleOpenViewer}
            className="group/preview relative block w-full max-w-[220px] overflow-hidden rounded-md border border-border/60 bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label={`Pré-visualizar imagem${titulo ? `: ${titulo}` : ''}`}
          >
            <img
              src={url}
              alt={titulo ?? 'Anexo'}
              loading="lazy"
              className="h-28 w-full object-cover transition-transform group-hover/preview:scale-[1.02]"
              onError={(e) => {
                // fallback silencioso: esconde o thumbnail se a URL falhar
                (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
              }}
            />
            <span className="absolute inset-0 flex items-center justify-center bg-background/0 text-transparent transition-all group-hover/preview:bg-background/50 group-hover/preview:text-foreground">
              <Eye className="w-5 h-5" />
            </span>
          </button>
        ) : (
          <div className="flex items-center gap-2 rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-xs">
            <FileText className="w-4 h-4 text-red-500 shrink-0" />
            <span className="truncate flex-1 text-foreground">
              {titulo ? `${titulo} · PDF` : 'Documento PDF'}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[11px]"
              onClick={handleOpenViewer}
            >
              <Eye className="w-3.5 h-3.5 mr-1" />
              Ver
            </Button>
          </div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl w-[95vw] p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b">
            <DialogTitle className="flex items-center gap-2 text-sm">
              {kind === 'image' ? (
                <ImageIcon className="w-4 h-4 text-primary" />
              ) : (
                <FileText className="w-4 h-4 text-red-500" />
              )}
              <span className="truncate">{titulo ?? 'Pré-visualização do anexo'}</span>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
              >
                Abrir original <ExternalLink className="w-3 h-3" />
              </a>
            </DialogTitle>
          </DialogHeader>
          <div className="bg-muted/30" style={{ height: '75vh' }}>
            {kind === 'image' ? (
              <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                <img
                  src={url}
                  alt={titulo ?? 'Anexo'}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : (
              <iframe
                src={url}
                title={titulo ?? 'PDF'}
                className="w-full h-full border-0"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
