import { useRef, useState, ReactNode, TouchEvent } from 'react';
import { Check, Trash2 } from 'lucide-react';

interface SwipeableRowProps {
  children: ReactNode;
  onSwipeRight?: () => void; // marcar como lida
  onSwipeLeft?: () => void; // excluir
  disabled?: boolean;
  rightLabel?: string;
  leftLabel?: string;
}

const THRESHOLD = 80;
const MAX = 140;

/**
 * Wrapper mobile-first para ações rápidas via swipe.
 * - Arrastar para a direita: ação positiva (ex.: marcar como lida)
 * - Arrastar para a esquerda: ação destrutiva (ex.: excluir)
 * Respeita prefers-reduced-motion evitando animações agressivas.
 */
export function SwipeableRow({
  children,
  onSwipeRight,
  onSwipeLeft,
  disabled,
  rightLabel = 'Marcar lida',
  leftLabel = 'Excluir',
}: SwipeableRowProps) {
  const [dx, setDx] = useState(0);
  const [animating, setAnimating] = useState(false);
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const locked = useRef<'h' | 'v' | null>(null);

  const handleStart = (e: TouchEvent) => {
    if (disabled) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    locked.current = null;
    setAnimating(false);
  };

  const handleMove = (e: TouchEvent) => {
    if (disabled || startX.current == null || startY.current == null) return;
    const cx = e.touches[0].clientX - startX.current;
    const cy = e.touches[0].clientY - startY.current;
    if (!locked.current) {
      if (Math.abs(cx) > 10 || Math.abs(cy) > 10) {
        locked.current = Math.abs(cx) > Math.abs(cy) ? 'h' : 'v';
      }
    }
    if (locked.current === 'h') {
      const clamped = Math.max(-MAX, Math.min(MAX, cx));
      setDx(clamped);
    }
  };

  const handleEnd = () => {
    if (disabled) return;
    setAnimating(true);
    if (dx > THRESHOLD && onSwipeRight) {
      onSwipeRight();
    } else if (dx < -THRESHOLD && onSwipeLeft) {
      onSwipeLeft();
    }
    setDx(0);
    startX.current = null;
    startY.current = null;
    locked.current = null;
  };

  const showRight = dx > 8;
  const showLeft = dx < -8;

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Ação direita (marcar como lida) */}
      <div
        className="absolute inset-y-0 left-0 flex items-center justify-start pl-4 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold text-xs gap-2 pointer-events-none transition-opacity"
        style={{ opacity: showRight ? Math.min(1, dx / THRESHOLD) : 0 }}
        aria-hidden
      >
        <Check className="w-4 h-4" />
        {rightLabel}
      </div>
      {/* Ação esquerda (excluir) */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-end pr-4 bg-destructive/15 text-destructive font-semibold text-xs gap-2 pointer-events-none transition-opacity"
        style={{ opacity: showLeft ? Math.min(1, -dx / THRESHOLD) : 0 }}
        aria-hidden
      >
        <Trash2 className="w-4 h-4" />
        {leftLabel}
      </div>
      <div
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
        onTouchCancel={handleEnd}
        style={{
          transform: `translateX(${dx}px)`,
          transition: animating ? 'transform 180ms ease-out' : 'none',
          willChange: 'transform',
        }}
      >
        {children}
      </div>
    </div>
  );
}
