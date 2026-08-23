'use client';

import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { pageVariants } from '@/lib/motion-variants';

/**
 * `mode="wait"` fully unmounts the previous route before mounting the next one —
 * deliberate, since pages here vary widely in height (hero-heavy home vs. dense
 * grids vs. product detail) and a simultaneous cross-fade would cause layout jumps.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={pageVariants}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
