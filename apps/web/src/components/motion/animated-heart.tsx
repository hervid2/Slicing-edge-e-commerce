'use client';

import { Heart } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { SPRING } from '@/lib/motion-variants';

interface AnimatedHeartProps {
  filled: boolean;
  className?: string;
}

/** Heart icon that pops on toggle and shrinks on tap — shared by ProductCard and WishlistButton. */
export function AnimatedHeart({ filled, className }: AnimatedHeartProps) {
  return (
    <motion.span
      key={filled ? 'filled' : 'empty'}
      className="inline-flex"
      initial={{ scale: filled ? 0.6 : 1 }}
      animate={{ scale: 1 }}
      whileTap={{ scale: 0.85 }}
      transition={SPRING}
    >
      <Heart
        className={cn(
          'h-5 w-5 transition-colors',
          filled ? 'fill-red-500 text-red-500' : 'text-[var(--color-muted)]',
          className,
        )}
      />
    </motion.span>
  );
}
