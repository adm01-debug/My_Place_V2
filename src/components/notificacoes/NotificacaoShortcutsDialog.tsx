import { memo } from 'react';
import { Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface NotificacaoShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SHORTCUTS: ReadonlyArray<readonly [string, string]> = [
  ['/', 'Focar campo de busca'],
  ['j', 'Ir para a próxima notificação'],
  ['k', 'Ir para a notificação anterior'],
  ['Enter', 'Abrir a notificação em foco'],
  ['x', 'Selecionar/desselecionar em foco'],
  ['e', 'Marcar em foco como lida'],
  ['u', 'Alternar lida/não lida em foco'],
  ['#', 'Excluir a em foco'],
  ['Shift + A', 'Marcar todas como lidas'],
  ['Esc', 'Limpar seleção / foco'],
  ['?', 'Mostrar esta ajuda'],
];

function NotificacaoShortcutsDialogImpl({ open, onOpenChange }: NotificacaoShortcutsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" /> Atalhos de teclado
          </DialogTitle>
          <DialogDescription>
            Navegue e gerencie suas notificações sem tirar as mãos do teclado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          {SHORTCUTS.map(([k, desc]) => (
            <div
              key={k}
              className="flex items-center justify-between gap-4 px-3 py-2 rounded-md bg-muted/40"
            >
              <span className="text-muted-foreground">{desc}</span>
              <kbd className="px-2 py-0.5 rounded border border-border bg-background text-xs font-mono">
                {k}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const NotificacaoShortcutsDialog = memo(NotificacaoShortcutsDialogImpl);
