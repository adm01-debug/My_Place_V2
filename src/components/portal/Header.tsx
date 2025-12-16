import { Bell, User } from 'lucide-react';
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
    <header className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border px-4 py-3 z-40">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          {showBack ? (
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              ←
            </Link>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">PB</span>
            </div>
          )}
          <h1 className="font-display font-semibold text-foreground text-lg">{title}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link to="/comunicados">
              <Bell className="w-5 h-5" />
              {alertCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-destructive text-destructive-foreground"
                >
                  {alertCount}
                </Badge>
              )}
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link to="/perfil">
              <User className="w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
