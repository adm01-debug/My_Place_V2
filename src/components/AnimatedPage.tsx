import { useLocation } from 'react-router-dom';
import { useEffect, useState, ReactNode } from 'react';

interface AnimatedPageProps {
  children: ReactNode;
}

export const AnimatedPage = ({ children }: AnimatedPageProps) => {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsAnimating(true);
    const timeout = setTimeout(() => {
      setDisplayChildren(children);
      setIsAnimating(false);
    }, 150);

    return () => clearTimeout(timeout);
  }, [location.pathname, children]);

  return (
    <div
      className={`transition-all duration-300 ease-out ${
        isAnimating 
          ? 'opacity-0 translate-y-2 scale-[0.99]' 
          : 'opacity-100 translate-y-0 scale-100'
      }`}
    >
      {displayChildren}
    </div>
  );
};
