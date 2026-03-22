import { ReactNode, useCallback, useState } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Breadcrumbs } from './Breadcrumbs';
import { PullToRefresh } from '@/components/PullToRefresh';
import { AssistenteVirtual, AssistenteButton } from './AssistenteVirtual';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { useToast } from '@/hooks/use-toast';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  alertCount?: number;
  onRefresh?: () => Promise<void>;
  action?: ReactNode;
  showBreadcrumbs?: boolean;
}

export function PageLayout({ children, title, showBack = false, alertCount = 0, onRefresh, action, showBreadcrumbs }: PageLayoutProps) {
  const { toast } = useToast();
  const [showAssistente, setShowAssistente] = useState(false);

  // Enable swipe-back gesture on sub-pages
  useSwipeBack({ enabled: showBack });

  const handleRefresh = useCallback(async () => {
    if (onRefresh) {
      await onRefresh();
    } else {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "✅ Atualizado",
        description: "Dados sincronizados com sucesso",
      });
    }
  }, [onRefresh, toast]);

  const shouldShowBreadcrumbs = showBreadcrumbs ?? showBack;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Skip to content link */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md">
        Pular para o conteúdo principal
      </a>

      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none motion-reduce:hidden" aria-hidden="true">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-hr/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>
      
      <Header title={title} showBack={showBack} alertCount={alertCount} action={action} />
      
      <main id="main-content" className="relative flex-1 max-w-lg lg:max-w-3xl xl:max-w-5xl mx-auto w-full">
        <PullToRefresh onRefresh={handleRefresh}>
          <div className="px-4 py-6 pb-24">
            {shouldShowBreadcrumbs && (
              <nav className="mb-4" aria-label="Breadcrumb">
                <Breadcrumbs maxItems={3} />
              </nav>
            )}
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
