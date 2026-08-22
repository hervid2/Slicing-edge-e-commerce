'use client';

import { Children } from 'react';
import { motion } from 'motion/react';
import { fadeUpVariants, staggerContainerVariants } from '@/lib/motion-variants';

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

/** Fades + translates a single block into view once, on scroll. */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
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

/** Wraps each direct child in a staggered fade-up reveal — callers pass plain JSX (e.g. a `.map()` of cards). */
export function RevealStagger({ children, className }: RevealStaggerProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.1 }}
      variants={staggerContainerVariants}
    >
      {Children.toArray(children).map((child, i) => (
        <motion.div key={i} variants={fadeUpVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
