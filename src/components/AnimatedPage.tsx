import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { useNavigationDirection } from '@/hooks/useNavigationDirection';

interface AnimatedPageProps {
  children: ReactNode;
}

export const AnimatedPage = ({ children }: AnimatedPageProps) => {
  const direction = useNavigationDirection();

  const xOffset = direction === 'forward' ? 40 : direction === 'backward' ? -40 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: xOffset }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -xOffset }}
      transition={{ type: 'spring', damping: 25, stiffness: 200, mass: 0.5 }}
    >
      {children}
    </motion.div>
  );
};
