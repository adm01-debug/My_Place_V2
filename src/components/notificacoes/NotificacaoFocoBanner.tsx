import { memo } from 'react';
import { Focus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onSair: () => void;
}

export const NotificacaoFocoBanner = memo(function NotificacaoFocoBanner({ onSair }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-sm">
      <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
        <Focus className="w-4 h-4" />
        <span>
          <strong>Modo Foco ativo</strong> — exibindo apenas não-lidas prioritárias (erros, alertas e alta relevância).
        </span>
      </div>
      <Button size="sm" variant="ghost" onClick={onSair} className="h-7">
        Sair
      </Button>
    </div>
  );
});
