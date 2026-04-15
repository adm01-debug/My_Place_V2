import { ReactNode } from 'react';

interface AnimatedPageProps {
  children: ReactNode;
}

export const AnimatedPage = ({ children }: AnimatedPageProps) => {
  return <>{children}</>;
};
