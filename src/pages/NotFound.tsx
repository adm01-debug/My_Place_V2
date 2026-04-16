import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { createLogger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";

const log = createLogger('NotFound');

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    log.warn("404: User attempted to access:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="relative mx-auto w-32 h-32">
          <div className="absolute inset-0 rounded-full bg-primary/10 animate-pulse" />
          <div className="absolute inset-4 rounded-full bg-primary/5 backdrop-blur-sm border border-border/50 flex items-center justify-center">
            <span className="text-5xl font-bold text-primary">404</span>
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-foreground">Página não encontrada</h1>
          <p className="text-sm text-muted-foreground">
            O endereço <code className="text-xs bg-muted/50 px-1.5 py-0.5 rounded">{location.pathname}</code> não existe.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => navigate('/')}>
            <Home className="w-4 h-4" /> Início
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
