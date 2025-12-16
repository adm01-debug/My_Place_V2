import { useState, useRef, useCallback, ReactNode } from 'react';
import { RefreshCw, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh?: () => Promise<void>;
}

export function PullToRefresh({ children, onRefresh }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const isPulling = useRef(false);

  const threshold = 80;
  const maxPull = 120;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      isPulling.current = true;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling.current || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);
    
    if (distance > 0 && containerRef.current?.scrollTop === 0) {
      const dampedDistance = Math.min(maxPull, distance * 0.5);
      setPullDistance(dampedDistance);
    }
  }, [isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling.current) return;
    isPulling.current = false;

    if (pullDistance >= threshold && onRefresh) {
      setIsRefreshing(true);
      setPullDistance(60);
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, onRefresh]);

  const progress = Math.min(1, pullDistance / threshold);
  const shouldTrigger = pullDistance >= threshold;

  return (
    <div
      ref={containerRef}
      className="relative overflow-auto h-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 z-50 flex flex-col items-center justify-center transition-all duration-300",
          pullDistance > 0 || isRefreshing ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        style={{
          top: Math.max(8, pullDistance - 50),
        }}
      >
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg",
            shouldTrigger || isRefreshing
              ? "bg-primary text-primary-foreground scale-110"
              : "bg-card text-muted-foreground border border-border"
          )}
        >
          {isRefreshing ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <ArrowDown
              className={cn(
                "w-5 h-5 transition-transform duration-200",
                shouldTrigger && "rotate-180"
              )}
              style={{
                transform: shouldTrigger
                  ? 'rotate(180deg)'
                  : `rotate(${progress * 180}deg)`,
              }}
            />
          )}
        </div>
        <span className={cn(
          "text-xs mt-2 font-medium transition-colors",
          shouldTrigger || isRefreshing ? "text-primary" : "text-muted-foreground"
        )}>
          {isRefreshing 
            ? "Atualizando..." 
            : shouldTrigger 
              ? "Solte para atualizar" 
              : "Puxe para atualizar"}
        </span>
      </div>

      {/* Content with transform */}
      <div
        className="transition-transform duration-200 ease-out"
        style={{
          transform: `translateY(${pullDistance}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
