// =====================================================
// ACCESSIBILITY UTILITIES
// =====================================================

import { useCallback, useEffect, useRef } from 'react';

// =====================================================
// ARIA LIVE ANNOUNCER
// =====================================================

let announcer: HTMLDivElement | null = null;

/**
 * Anuncia uma mensagem para leitores de tela
 * @param message - Mensagem a ser anunciada
 * @param priority - 'polite' (espera) ou 'assertive' (imediato)
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  if (typeof window === 'undefined') return;

  // Criar announcer se não existir
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.setAttribute('role', 'status');
    announcer.className = 'sr-only';
    announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    `;
    document.body.appendChild(announcer);
  }

  // Atualizar prioridade
  announcer.setAttribute('aria-live', priority);

  // Limpar e anunciar
  announcer.textContent = '';
  setTimeout(() => {
    if (announcer) {
      announcer.textContent = message;
    }
  }, 100);
}

// =====================================================
// FOCUS TRAP HOOK
// =====================================================

interface FocusTrapOptions {
  enabled?: boolean;
  initialFocus?: boolean;
  returnFocus?: boolean;
}

export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement>,
  options: FocusTrapOptions = {}
) {
  const { enabled = true, initialFocus = true, returnFocus = true } = options;
  const previousActiveElement = useRef<Element | null>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    
    // Salvar elemento focado anteriormente
    previousActiveElement.current = document.activeElement;

    // Encontrar elementos focáveis
    const getFocusableElements = () => {
      const focusable = container.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      return Array.from(focusable) as HTMLElement[];
    };

    // Focus inicial
    if (initialFocus) {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }

    // Handler para trap de foco
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      
      // Retornar foco
      if (returnFocus && previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [enabled, containerRef, initialFocus, returnFocus]);
}

// =====================================================
// SKIP LINK HOOK
// =====================================================

export function useSkipLink(targetId: string) {
  const handleClick = useCallback(() => {
    const target = document.getElementById(targetId);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus();
      target.removeAttribute('tabindex');
    }
  }, [targetId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  return { onClick: handleClick, onKeyDown: handleKeyDown };
}

// =====================================================
// KEYBOARD NAVIGATION HOOK
// =====================================================

interface UseKeyboardNavigationOptions {
  orientation?: 'horizontal' | 'vertical' | 'both';
  loop?: boolean;
  onSelect?: (index: number) => void;
}

export function useKeyboardNavigation(
  itemCount: number,
  options: UseKeyboardNavigationOptions = {}
) {
  const { orientation = 'vertical', loop = true, onSelect } = options;
  const currentIndex = useRef(0);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const isVertical = orientation === 'vertical' || orientation === 'both';
    const isHorizontal = orientation === 'horizontal' || orientation === 'both';

    let newIndex = currentIndex.current;
    let handled = false;

    switch (e.key) {
      case 'ArrowDown':
        if (isVertical) {
          newIndex = currentIndex.current + 1;
          handled = true;
        }
        break;
      case 'ArrowUp':
        if (isVertical) {
          newIndex = currentIndex.current - 1;
          handled = true;
        }
        break;
      case 'ArrowRight':
        if (isHorizontal) {
          newIndex = currentIndex.current + 1;
          handled = true;
        }
        break;
      case 'ArrowLeft':
        if (isHorizontal) {
          newIndex = currentIndex.current - 1;
          handled = true;
        }
        break;
      case 'Home':
        newIndex = 0;
        handled = true;
        break;
      case 'End':
        newIndex = itemCount - 1;
        handled = true;
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect?.(currentIndex.current);
        return;
    }

    if (handled) {
      e.preventDefault();
      
      if (loop) {
        if (newIndex < 0) newIndex = itemCount - 1;
        if (newIndex >= itemCount) newIndex = 0;
      } else {
        newIndex = Math.max(0, Math.min(newIndex, itemCount - 1));
      }
      
      currentIndex.current = newIndex;
    }
  }, [itemCount, orientation, loop, onSelect]);

  const setCurrentIndex = useCallback((index: number) => {
    currentIndex.current = index;
  }, []);

  return {
    currentIndex: currentIndex.current,
    handleKeyDown,
    setCurrentIndex,
  };
}

// =====================================================
// ARIA PROPS HELPERS
// =====================================================

export interface AriaButtonProps {
  'aria-label'?: string;
  'aria-pressed'?: boolean;
  'aria-expanded'?: boolean;
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  'aria-controls'?: string;
  'aria-describedby'?: string;
}

export interface AriaInputProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
  'aria-autocomplete'?: 'none' | 'inline' | 'list' | 'both';
}

export interface AriaDialogProps {
  role: 'dialog' | 'alertdialog';
  'aria-modal': boolean;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
}

export interface AriaListProps {
  role: 'list' | 'listbox' | 'menu' | 'menubar' | 'tree' | 'grid';
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-activedescendant'?: string;
  'aria-multiselectable'?: boolean;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Gera um ID único para ARIA
 */
export function generateAriaId(prefix: string = 'aria'): string {
  return `${prefix}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Verifica se deve reduzir movimento
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Verifica se deve usar alto contraste
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-contrast: more)').matches;
}

/**
 * Verifica preferência de tema escuro
 */
export function prefersDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

// =====================================================
// SCREEN READER ONLY STYLES
// =====================================================

export const srOnlyStyles = {
  position: 'absolute' as const,
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap' as const,
  borderWidth: '0',
};

// =====================================================
// COMPONENT: VisuallyHidden
// =====================================================

import React from 'react';

interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: keyof React.JSX.IntrinsicElements;
}

export const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({ 
  children, 
  as = 'span' 
}) => {
  return React.createElement(as, { style: srOnlyStyles }, children);
};

// =====================================================
// COMPONENT: SkipLink
// =====================================================

interface SkipLinkProps {
  targetId: string;
  children?: React.ReactNode;
}

export const SkipLink: React.FC<SkipLinkProps> = ({ 
  targetId, 
  children = 'Pular para conteúdo principal' 
}) => {
  const { onClick, onKeyDown } = useSkipLink(targetId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick();
  };

  return React.createElement('a', {
    href: `#${targetId}`,
    onClick: handleClick,
    onKeyDown: onKeyDown,
    className: 'sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md focus:shadow-lg'
  }, children);
};

export default {
  announce,
  useFocusTrap,
  useSkipLink,
  useKeyboardNavigation,
  generateAriaId,
  prefersReducedMotion,
  prefersHighContrast,
  prefersDarkMode,
  VisuallyHidden,
  SkipLink,
};
