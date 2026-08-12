import { forwardRef, memo } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  visibleCount: number;
  totalCount: number;
  visibleFilteredCount: number;
  onLoadMore: () => void;
}

export const NotificacaoLoadMore = memo(
  forwardRef<HTMLDivElement, Props>(function NotificacaoLoadMore(
    { visibleCount, totalCount, visibleFilteredCount, onLoadMore },
    ref,
  ) {
    if (totalCount === 0) return null;

    if (visibleCount < totalCount) {
      return (
        <div className="pt-2">
          <div ref={ref} className="flex flex-col items-center justify-center gap-2 py-6">
            <div className="text-xs text-muted-foreground">
              Mostrando <strong className="text-foreground">{visibleFilteredCount}</strong> de{' '}
              <strong className="text-foreground">{totalCount}</strong>
            </div>
            <Button size="sm" variant="outline" onClick={onLoadMore}>
              Carregar mais 50
            </Button>
          </div>
        </div>
      );
    }

    if (totalCount > 50) {
      return (
        <div className="pt-2">
          <div className="text-center text-xs text-muted-foreground py-4">
            Todas as {totalCount} notificações foram carregadas.
          </div>
        </div>
      );
    }

    return null;
  }),
);
