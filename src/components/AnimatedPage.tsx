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
      transition={{ type: 'tween', ease: [0.25, 0.1, 0.25, 1], duration: 0.25 }}
    >
      {children}
    </motion.div>
  );
};
