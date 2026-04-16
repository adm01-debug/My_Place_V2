import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Paperclip, ExternalLink, Eye, FileText, Image as ImageIcon } from 'lucide-react';

interface AttachmentPreviewProps {
  url: string;
  className?: string;
}

function getFileType(url: string): 'image' | 'pdf' | 'other' {
  const lower = url.toLowerCase().split('?')[0];
  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/.test(lower)) return 'image';
  if (/\.pdf$/.test(lower)) return 'pdf';
  return 'other';
}

function getFileName(url: string): string {
  try {
    const path = new URL(url).pathname;
    const name = decodeURIComponent(path.split('/').pop() || 'arquivo');
    // Remove UUID prefix if present (common in Supabase storage)
    return name.replace(/^[a-f0-9-]{36}_?/, '') || name;
  } catch {
    return 'arquivo';
  }
}

export function AttachmentPreview({ url, className = '' }: AttachmentPreviewProps) {
  const [open, setOpen] = useState(false);
  const fileType = getFileType(url);
  const fileName = getFileName(url);

  const icon = fileType === 'image' ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />;

  return (
    <>
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <span className="inline-flex items-center gap-1 text-xs text-primary">
          <Paperclip className="w-3 h-3" />
          <span className="max-w-[120px] truncate">{fileName}</span>
        </span>
        {(fileType === 'image' || fileType === 'pdf') && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-1.5 text-xs gap-1 text-muted-foreground hover:text-primary"
            onClick={() => setOpen(true)}
          >
            <Eye className="w-3 h-3" /> Visualizar
          </Button>
        )}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-primary transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="text-sm truncate">{fileName}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center overflow-auto max-h-[70vh]">
            {fileType === 'image' ? (
              <img
                src={url}
                alt={fileName}
                className="max-w-full max-h-[65vh] rounded-lg object-contain"
              />
            ) : fileType === 'pdf' ? (
              <iframe
                src={url}
                title={fileName}
                className="w-full h-[65vh] rounded-lg border border-border/50"
              />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
