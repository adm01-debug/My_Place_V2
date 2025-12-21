import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Loader2, ChevronDown, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

// =====================================================
// TYPES
// =====================================================

interface LoadMoreProps {
  /** Função chamada quando deve carregar mais */
  onLoadMore: () => void | Promise<void>;
  /** Se está carregando */
  isLoading?: boolean;
  /** Se há mais itens para carregar */
  hasMore?: boolean;
  /** Modo de carregamento */
  mode?: 'button' | 'infinite' | 'both';
  /** Threshold para infinite scroll (pixels do final) */
  threshold?: number;
  /** Texto do botão */
  buttonText?: string;
  /** Texto de carregamento */
  loadingText?: string;
  /** Texto quando não há mais */
  noMoreText?: string;
  /** Mostrar texto quando não há mais */
  showNoMoreText?: boolean;
  /** Classe CSS */
  className?: string;
  /** Variant do botão */
  buttonVariant?: 'default' | 'outline' | 'ghost' | 'link';
}

interface UseInfiniteScrollOptions {
  /** Se está habilitado */
  enabled?: boolean;
  /** Threshold em pixels */
  threshold?: number;
  /** Root element (null para viewport) */
  root?: Element | null;
  /** Root margin */
  rootMargin?: string;
}

// =====================================================
// HOOK: useInfiniteScroll
// =====================================================

export function useInfiniteScroll(
  callback: () => void,
  options: UseInfiniteScrollOptions = {}
) {
  const { enabled = true, threshold = 100, root = null, rootMargin = '0px' } = options;
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const setSentinelRef = useCallback((node: HTMLDivElement | null) => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    sentinelRef.current = node;

    if (!enabled || !node) return;

    // Create new observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      {
        root,
        rootMargin: `${threshold}px`,
        threshold: 0,
      }
    );

    observerRef.current.observe(node);
  }, [callback, enabled, threshold, root]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return sentinelRef;
}

// =====================================================
// HOOK: useLoadMore
// =====================================================

interface UseLoadMoreOptions<T> {
  /** Função para buscar dados */
  fetchFn: (page: number) => Promise<T[]>;
  /** Tamanho da página */
  pageSize?: number;
  /** Dados iniciais */
  initialData?: T[];
}

interface UseLoadMoreResult<T> {
  data: T[];
  isLoading: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => Promise<void>;
  reset: () => void;
  refresh: () => Promise<void>;
}

export function useLoadMore<T>(options: UseLoadMoreOptions<T>): UseLoadMoreResult<T> {
  const { fetchFn, pageSize = 10, initialData = [] } = options;
  
  const [data, setData] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const newData = await fetchFn(page);
      
      setData(prev => [...prev, ...newData]);
      setHasMore(newData.length >= pageSize);
      setPage(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, page, pageSize, isLoading, hasMore]);

  const reset = useCallback(() => {
    setData(initialData);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, [initialData]);

  const refresh = useCallback(async () => {
    reset();
    setIsLoading(true);
    
    try {
      const newData = await fetchFn(1);
      setData(newData);
      setHasMore(newData.length >= pageSize);
      setPage(2);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchFn, pageSize, reset]);

  return {
    data,
    isLoading,
    hasMore,
    error,
    loadMore,
    reset,
    refresh,
  };
}

// =====================================================
// COMPONENT: LoadMore
// =====================================================

export const LoadMore: React.FC<LoadMoreProps> = ({
  onLoadMore,
  isLoading = false,
  hasMore = true,
  mode = 'button',
  threshold = 100,
  buttonText = 'Carregar mais',
  loadingText = 'Carregando...',
  noMoreText = 'Não há mais itens',
  showNoMoreText = true,
  className = '',
  buttonVariant = 'outline',
}) => {
  const handleLoadMore = useCallback(async () => {
    if (!isLoading && hasMore) {
      await onLoadMore();
    }
  }, [onLoadMore, isLoading, hasMore]);

  // Infinite scroll sentinel
  const sentinelRef = useInfiniteScroll(handleLoadMore, {
    enabled: (mode === 'infinite' || mode === 'both') && hasMore && !isLoading,
    threshold,
  });

  // Don't render if no more items and shouldn't show text
  if (!hasMore && !showNoMoreText && !isLoading) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center justify-center py-4 ${className}`}>
      {/* Infinite scroll sentinel */}
      {(mode === 'infinite' || mode === 'both') && hasMore && (
        <div ref={sentinelRef} className="h-1 w-full" aria-hidden="true" />
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground" role="status">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>{loadingText}</span>
        </div>
      )}

      {/* Load more button */}
      {!isLoading && hasMore && (mode === 'button' || mode === 'both') && (
        <Button
          variant={buttonVariant}
          onClick={handleLoadMore}
          className="gap-2"
          aria-label={buttonText}
        >
          <ChevronDown className="w-4 h-4" />
          {buttonText}
        </Button>
      )}

      {/* No more items */}
      {!isLoading && !hasMore && showNoMoreText && (
        <p className="text-sm text-muted-foreground">{noMoreText}</p>
      )}
    </div>
  );
};

// =====================================================
// COMPONENT: LoadMoreList
// =====================================================

interface LoadMoreListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  onLoadMore: () => void | Promise<void>;
  isLoading?: boolean;
  hasMore?: boolean;
  mode?: 'button' | 'infinite' | 'both';
  keyExtractor?: (item: T, index: number) => string;
  emptyMessage?: string;
  className?: string;
  listClassName?: string;
  itemClassName?: string;
}

export function LoadMoreList<T>({
  items,
  renderItem,
  onLoadMore,
  isLoading = false,
  hasMore = true,
  mode = 'infinite',
  keyExtractor = (_, index) => String(index),
  emptyMessage = 'Nenhum item encontrado',
  className = '',
  listClassName = '',
  itemClassName = '',
}: LoadMoreListProps<T>) {
  if (items.length === 0 && !isLoading) {
    return (
      <div className={`text-center py-8 text-muted-foreground ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={className}>
      <div className={`space-y-2 ${listClassName}`}>
        {items.map((item, index) => (
          <div key={keyExtractor(item, index)} className={itemClassName}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
      
      <LoadMore
        onLoadMore={onLoadMore}
        isLoading={isLoading}
        hasMore={hasMore}
        mode={mode}
      />
    </div>
  );
}

// =====================================================
// COMPONENT: PullToRefresh (for mobile)
// =====================================================

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
  className = '',
}) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0) {
      setPullDistance(Math.min(diff * 0.5, threshold * 1.5));
    }
  }, [isPulling, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }

    setIsPulling(false);
    setPullDistance(0);
  }, [pullDistance, threshold, onRefresh]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="absolute left-0 right-0 flex items-center justify-center transition-all duration-200"
        style={{
          top: -40,
          transform: `translateY(${pullDistance}px)`,
          opacity: pullDistance / threshold,
        }}
      >
        {isRefreshing ? (
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        ) : (
          <RefreshCw
            className={`w-6 h-6 text-muted-foreground transition-transform ${
              pullDistance >= threshold ? 'rotate-180' : ''
            }`}
          />
        )}
      </div>

      {/* Content */}
      <div
        style={{
          transform: isPulling ? `translateY(${pullDistance}px)` : 'translateY(0)',
          transition: isPulling ? 'none' : 'transform 0.2s',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default LoadMore;
