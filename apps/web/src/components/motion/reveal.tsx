'use client';

import { Children } from 'react';
import { motion } from 'motion/react';
import { fadeUpVariants } from '@/lib/motion-variants';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/** Fades + translates a single block into view on scroll, replaying every time it re-enters the viewport. */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: false, amount: 0.2 }}
      variants={fadeUpVariants}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

interface RevealStaggerProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Wraps each direct child in its own scroll-triggered fade-up reveal — callers pass plain JSX
 * (e.g. a `.map()` of cards). Each child tracks the viewport independently (rather than the whole
 * list sharing one trigger on an outer container) so every row keeps replaying as it crosses the
 * viewport on grids/lists taller than one screen — a single shared trigger on a multi-row grid
 * only toggles at the very top/bottom edge of the whole thing, which reads as "not animating" for
 * everything scrolled through in between. `h-full` on the wrapper lets CSS Grid's row-stretch
 * reach equal-height cards (e.g. ProductCard) the way it did before this wrapper existed.
 */
export function RevealStagger({ children, className }: RevealStaggerProps) {
  return (
    <div className={className}>
      {Children.toArray(children).map((child, i) => (
        <motion.div
          key={i}
          className="h-full"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
          variants={fadeUpVariants}
          transition={{ delay: (i % 4) * 0.06 }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}
