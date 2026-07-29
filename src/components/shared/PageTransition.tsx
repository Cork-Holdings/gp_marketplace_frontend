import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { pageTransition } from '@/lib/motion';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * Standard page transition for the GeePay Marketplace portal.
 * Subtle fade-in + slide-up per the design system timing table.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={pageTransition.initial}
      animate={pageTransition.animate}
      exit={pageTransition.exit}
      transition={pageTransition.transition}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;
