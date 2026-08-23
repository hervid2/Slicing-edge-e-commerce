'use client';

import { motion } from 'motion/react';
import { useSession } from 'next-auth/react';
import { useWishlist } from '@/components/providers/wishlist-provider';
import { useToast } from '@/components/ui/toast';
import { AnimatedHeart } from '@/components/motion/animated-heart';

interface WishlistButtonProps {
  productId: string;
  productName?: string;
}

export function WishlistButton({ productId, productName }: WishlistButtonProps) {
  const { status } = useSession();
  const { wishlistedIds, toggle } = useWishlist();
  const { toast } = useToast();

  if (status !== 'authenticated') return null;

  const isWishlisted = wishlistedIds.has(productId);

  const handleToggle = async () => {
    await toggle(productId);
    const label = productName ? `"${productName}"` : 'Item';
    if (isWishlisted) {
      toast(`${label} removed from wishlist`, 'info');
    } else {
      toast(`${label} saved to wishlist!`, 'success');
    }
  };

  return (
    <motion.button
      type="button"
      onClick={() => void handleToggle()}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
      whileTap={{ scale: 0.85 }}
      className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] transition-colors hover:border-red-300 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
    >
      <AnimatedHeart filled={isWishlisted} />
    </motion.button>
  );
}
