import React from 'react';
import { Home, Wallet, Clock, Umbrella, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: Home, label: 'Início', path: '/' },
  { icon: Wallet, label: 'Salário', path: '/holerites' },
  { icon: Clock, label: 'Ponto', path: '/ponto' },
  { icon: Umbrella, label: 'Férias', path: '/ferias' },
  { icon: Menu, label: 'Mais', path: '/menu' },
];

export const BottomNav = React.memo(function BottomNav() {
  const location = useLocation();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb"
      role="navigation"
      aria-label="Navegação principal"
    >
      <div className="glass-subtle border-t border-border/50 px-2 py-2">
        <div className="flex justify-around items-center max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path === '/' && location.pathname === '/');
            
            return (
              <Link
                key={item.path}
                to={item.path}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-300 min-w-[64px] relative',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isActive 
                    ? 'text-primary' 
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {isActive && (
                  <div className="absolute inset-0 bg-primary/10 rounded-2xl animate-fade-in-scale motion-reduce:animate-none" />
                )}
                <div className={cn(
                  'relative z-10 transition-transform duration-300 motion-reduce:transition-none',
                  isActive && 'scale-110'
                )}>
                  <item.icon className={cn(
                    'w-5 h-5 transition-all duration-300 motion-reduce:transition-none',
                    isActive && 'drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]'
                  )} />
                </div>
                <span className={cn(
                  'text-xs font-medium relative z-10 transition-all duration-300 motion-reduce:transition-none',
                  isActive && 'font-semibold'
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
});
