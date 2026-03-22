import { useEffect, useRef, useCallback } from 'react';
import { useNavigateBack } from './useNavigateBack';

interface SwipeBackOptions {
  enabled?: boolean;
  threshold?: number; // px to trigger
  edgeWidth?: number; // px from left edge to start
}

/**
 * Hook to enable swipe-from-left-edge gesture for back navigation.
 * Only activates on touch devices and from the left edge of the screen.
 */
export function useSwipeBack({
  enabled = true,
  threshold = 80,
  edgeWidth = 30,
}: SwipeBackOptions = {}) {
  const goBack = useNavigateBack();
  const startX = useRef(0);
  const startY = useRef(0);
  const swiping = useRef(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;
    const touch = e.touches[0];
    // Only activate from left edge
    if (touch.clientX <= edgeWidth) {
      startX.current = touch.clientX;
      startY.current = touch.clientY;
      swiping.current = true;
    }
  }, [enabled, edgeWidth]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!swiping.current) return;
    swiping.current = false;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startX.current;
    const deltaY = Math.abs(touch.clientY - startY.current);

    // Horizontal swipe must be greater than threshold and more horizontal than vertical
    if (deltaX > threshold && deltaX > deltaY * 1.5) {
      goBack();
    }
  }, [threshold, goBack]);

  useEffect(() => {
    if (!enabled) return;
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchEnd]);
}
