import React, { useEffect, useState, useCallback } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// =====================================================
// TYPES
// =====================================================

type Theme = 'light' | 'dark' | 'system';

interface ThemeSwitcherProps {
  mode?: 'toggle' | 'dropdown' | 'buttons';
  showLabel?: boolean;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

// =====================================================
// HOOK: useTheme
// =====================================================

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  useEffect(() => {
    const resolved = theme === 'system' ? getSystemTheme() : theme;
    setResolvedTheme(resolved);

    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);

    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', resolved === 'dark' ? '#1f2937' : '#ffffff');
    }
  }, [theme, getSystemTheme]);

  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => setResolvedTheme(getSystemTheme());

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme, getSystemTheme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  return {
    theme,
    setTheme,
    resolvedTheme,
    toggleTheme,
    isDark: resolvedTheme === 'dark',
  };
}

// =====================================================
// COMPONENT: ThemeSwitcher
// =====================================================

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
  mode = 'dropdown',
  showLabel = false,
  className = '',
  size = 'default',
}) => {
  const { theme, setTheme, resolvedTheme, toggleTheme, isDark } = useTheme();

  const iconSize = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';
  const buttonSize = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-12 w-12' : 'h-10 w-10';

  const ThemeIcon = isDark ? Moon : Sun;

  // Toggle mode
  if (mode === 'toggle') {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className={`${buttonSize} ${className}`}
        aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      >
        <Sun className={`${iconSize} rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0`} />
        <Moon className={`absolute ${iconSize} rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100`} />
      </Button>
    );
  }

  // Buttons mode
  if (mode === 'buttons') {
    return (
      <div className={`flex items-center gap-1 p-1 bg-muted rounded-lg ${className}`}>
        <Button
          variant={theme === 'light' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTheme('light')}
          className="gap-2"
          aria-pressed={theme === 'light'}
        >
          <Sun className="w-4 h-4" />
          {showLabel && 'Claro'}
        </Button>
        <Button
          variant={theme === 'dark' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTheme('dark')}
          className="gap-2"
          aria-pressed={theme === 'dark'}
        >
          <Moon className="w-4 h-4" />
          {showLabel && 'Escuro'}
        </Button>
        <Button
          variant={theme === 'system' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setTheme('system')}
          className="gap-2"
          aria-pressed={theme === 'system'}
        >
          <Monitor className="w-4 h-4" />
          {showLabel && 'Sistema'}
        </Button>
      </div>
    );
  }

  // Dropdown mode (default)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`${buttonSize} ${className}`}
          aria-label="Alterar tema"
        >
          <Sun className={`${iconSize} rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0`} />
          <Moon className={`absolute ${iconSize} rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100`} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="gap-2"
        >
          <Sun className="w-4 h-4" />
          Claro
          {theme === 'light' && <span className="ml-auto text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="gap-2"
        >
          <Moon className="w-4 h-4" />
          Escuro
          {theme === 'dark' && <span className="ml-auto text-primary">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="gap-2"
        >
          <Monitor className="w-4 h-4" />
          Sistema
          {theme === 'system' && <span className="ml-auto text-primary">✓</span>}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeSwitcher;
