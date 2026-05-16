import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show back button on the home page or login
  const isHome = location.pathname === '/';
  const isLogin = location.pathname === '/login';

  if (isHome || isLogin) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => navigate(-1)}
      className="gap-1 px-2 h-8 text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Voltar para a tela anterior"
    >
      <ChevronLeft className="w-4 h-4" />
      <span className="text-xs font-medium">Voltar</span>
    </Button>
  );
}
