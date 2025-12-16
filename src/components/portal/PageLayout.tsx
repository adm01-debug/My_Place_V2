import { ReactNode } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  alertCount?: number;
}

export function PageLayout({ children, title, showBack = false, alertCount = 0 }: PageLayoutProps) {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Header title={title} showBack={showBack} alertCount={alertCount} />
      <main className="max-w-lg mx-auto px-4 py-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
