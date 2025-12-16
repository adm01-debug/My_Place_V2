import { Bell, User, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  alertCount?: number;
}

export function Header({ title = 'Portal do Colaborador', showBack = false, alertCount = 0 }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 safe-area-pt">
      <div className="glass-subtle border-b border-border/50">
        <div className="flex items-center justify-between max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            {showBack ? (
              <Link 
                to="/" 
                className="w-8 h-8 rounded-full bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                ←
              </Link>
            ) : (
              <div className="relative">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                  <span className="text-primary-foreground font-bold text-sm">PB</span>
                </div>
                <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-projects animate-bounce-subtle" />
              </div>
            )}
            <div>
              <h1 className="font-display font-bold text-foreground text-lg leading-tight">{title}</h1>
              {!showBack && (
                <p className="text-xs text-muted-foreground">Promo Brindes</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="relative hover-scale" asChild>
              <Link to="/comunicados">
                <Bell className="w-5 h-5" />
                {alertCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center font-medium animate-bounce-subtle">
                    {alertCount}
                  </span>
                )}
              </Link>
            </Button>
            <Button variant="ghost" size="icon" className="hover-scale" asChild>
              <Link to="/perfil">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-hr flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
