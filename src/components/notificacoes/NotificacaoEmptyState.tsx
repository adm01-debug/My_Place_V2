import { memo } from 'react';
import { Bell } from 'lucide-react';

interface Props {
  filtered: boolean;
}

export const NotificacaoEmptyState = memo(function NotificacaoEmptyState({ filtered }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
        <Bell className="w-8 h-8 text-muted-foreground opacity-20" />
      </div>
      <div className="space-y-1">
        <p className="text-lg font-medium text-foreground">
          {filtered ? 'Nenhum resultado' : 'Tudo em dia!'}
        </p>
        <p className="text-sm text-muted-foreground">
          {filtered
            ? 'Tente ajustar a busca ou os filtros.'
            : 'Você não tem novas notificações no momento.'}
        </p>
      </div>
    </div>
  );
});
