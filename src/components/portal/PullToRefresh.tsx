import { useState, useRef, useCallback, type ReactNode, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pulling, setPulling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isAtTop = useRef(true);
  
  const THRESHOLD = 70;
  const MAX_PULL = 100;

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        isAtTop.current = containerRef.current.scrollTop <= 0;
      }
    };

    const el = containerRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll, { passive: true });
    }
    return () => {
      if (el) el.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isAtTop.current && !refreshing) {
      startY.current = e.touches[0].clientY;
      setPulling(true);
    }
  }, [refreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pulling || refreshing) return;
    
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    
    if (diff > 0 && isAtTop.current) {
      // Resistance factor that increases with distance
      const resistance = 0.4;
      const distance = Math.min(diff * resistance, MAX_PULL);
      setPullDistance(distance);
      
      // Prevent browser default pull-to-refresh if possible
      if (diff > 10 && e.cancelable) {
        e.preventDefault();
      }
    } else if (diff < 0) {
      setPulling(false);
      setPullDistance(0);
    }
  }, [pulling, refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!pulling) return;
    
    if (pullDistance >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDistance(40); // Stay at mid-height while refreshing
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    
    setPulling(false);
  }, [pullDistance, refreshing, onRefresh, pulling]);

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-full overflow-y-auto"
    >
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-300 ease-out bg-muted/5 border-b border-border/10"
        style={{ 
          height: pullDistance > 0 || refreshing ? Math.max(pullDistance, refreshing ? 40 : 0) : 0,
          opacity: Math.min((pullDistance || (refreshing ? 40 : 0)) / THRESHOLD, 1)
        }}
      >
        <div className="flex flex-col items-center gap-1 py-2">
          <Loader2
            className={`w-5 h-5 text-primary ${refreshing ? 'animate-spin' : ''}`}
            style={{ 
              transform: !refreshing ? `rotate(${pullDistance * 4}deg)` : undefined,
              transition: refreshing ? 'none' : 'transform 0.1s linear'
            }}
          />
          {pullDistance >= THRESHOLD && !refreshing && (
            <span className="text-[10px] font-medium text-muted-foreground animate-pulse">Solte para atualizar</span>
          )}
        </div>
      </div>
      <div className="relative">
        {children}
      </div>
    </div>
  );
}
