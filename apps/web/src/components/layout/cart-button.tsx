'use client';

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useCartStore } from '@/stores/cart-store';
import { SPRING } from '@/lib/motion-variants';

export function CartButton() {
  const count = useCartStore((s) => s.items.reduce((sum, item) => sum + item.quantity, 0));

  return (
    <Link
      href="/cart"
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-md text-[var(--color-foreground)] transition-colors hover:text-[var(--color-accent)]"
      aria-label="Shopping cart"
    >
      <ShoppingCart className="h-5 w-5" />
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key="cart-count-badge"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={SPRING}
            className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--color-accent)] px-1 text-[10px] font-semibold text-white"
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={count}
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 8, opacity: 0 }}
                transition={SPRING}
                className="inline-block"
              >
                {count > 99 ? '99+' : count}
              </motion.span>
            </AnimatePresence>
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}
