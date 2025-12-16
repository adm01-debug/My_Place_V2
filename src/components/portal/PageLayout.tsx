import { ReactNode } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { AnimatedPage } from '@/components/AnimatedPage';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  alertCount?: number;
}

export function PageLayout({ children, title, showBack = false, alertCount = 0 }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-hr/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>
      
      <Header title={title} showBack={showBack} alertCount={alertCount} />
      
      <main className="relative max-w-lg mx-auto px-4 py-6 pb-24">
        <AnimatedPage>
          {children}
        </AnimatedPage>
      </main>
      
      <BottomNav />
    </div>
  );
}
