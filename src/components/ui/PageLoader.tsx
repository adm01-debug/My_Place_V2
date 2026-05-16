import { useEffect, useState } from 'react';

export function PageLoader() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) return 100;
        const diff = Math.random() * 10;
        return Math.min(oldProgress + diff, 90);
      });
    }, 200);

    return () => {
      clearInterval(timer);
      setProgress(100);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-muted/20 overflow-hidden">
      <div 
        className="h-full bg-primary transition-all duration-300 ease-out shadow-[0_0_8px_rgba(var(--primary),0.5)]"
        style={{ width: `${progress}%` }}
      />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none h-screen">
         <div className="relative">
            <div className="w-12 h-12 border-2 border-primary/20 rounded-full" />
            <div className="absolute inset-0 w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
         </div>
      </div>
    </div>
  );
}
