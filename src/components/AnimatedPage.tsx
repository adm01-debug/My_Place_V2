import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { useNavigationDirection } from '@/hooks/useNavigationDirection';

interface AnimatedPageProps {
  children: ReactNode;
}

const variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -60 : 60,
    opacity: 0,
  }),
};

export const AnimatedPage = ({ children }: AnimatedPageProps) => {
  const direction = useNavigationDirection();

  return (
    <motion.div
      custom={direction}
      initial="enter"
      animate="center"
      exit="exit"
      variants={variants}
      transition={{
        type: 'tween',
        ease: [0.25, 0.1, 0.25, 1],
        duration: 0.22,
      }}
      style={{ willChange: 'transform, opacity' }}
      className="motion-reduce:!transform-none motion-reduce:!transition-none"
    >
      {children}
    </motion.div>
  );
};
