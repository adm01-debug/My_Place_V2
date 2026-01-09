import { ReactNode, useCallback, useState } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { PullToRefresh } from '@/components/PullToRefresh';
import { AssistenteVirtual, AssistenteButton } from './AssistenteVirtual';
import { useToast } from '@/hooks/use-toast';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  alertCount?: number;
  onRefresh?: () => Promise<void>;
  action?: ReactNode;
}

export function PageLayout({ children, title, showBack = false, alertCount = 0, onRefresh, action }: PageLayoutProps) {
  const { toast } = useToast();
  const [showAssistente, setShowAssistente] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      await onRefresh();
    } else {
      // Simulated refresh delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "✅ Atualizado",
        description: "Dados sincronizados com sucesso",
      });
    }
  }, [onRefresh, toast]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-hr/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>
      
      <Header title={title} showBack={showBack} alertCount={alertCount} action={action} />
      
      <main className="relative flex-1 max-w-lg mx-auto w-full">
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="px-4 py-6 pb-24">
            {children}
          </div>
        </PullToRefresh>
      </main>
      
      <BottomNav />

      {/* Assistente Virtual */}
      {!showAssistente && (
        <AssistenteButton onClick={() => setShowAssistente(true)} />
      )}
      <AssistenteVirtual 
        isOpen={showAssistente} 
        onClose={() => setShowAssistente(false)} 
      />
    </div>
  );
}
