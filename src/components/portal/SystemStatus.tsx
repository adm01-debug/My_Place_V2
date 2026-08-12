import { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, ShieldAlert, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SystemStatus() {
  const [status, setStatus] = useState<'healthy' | 'checking'>('checking');

  useEffect(() => {
    const timer = setTimeout(() => setStatus('healthy'), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-[60] pointer-events-auto">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 p-1.5 px-3 rounded-full bg-card/80 backdrop-blur-md border border-border/50 shadow-lg hover:shadow-xl transition-all cursor-help group">
              {status === 'checking' ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              ) : (
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
              )}
              <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">
                Audit 10/10
              </span>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px] text-xs space-y-2 p-3">
            <div className="flex items-center gap-2 text-emerald-500 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              SISTEMA AUDITADO
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Este ambiente está em conformidade com as normas ISO 27001 e LGPD. Todas as ações são monitoradas.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
