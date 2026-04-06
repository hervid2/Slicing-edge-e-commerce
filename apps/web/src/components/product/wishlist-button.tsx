'use client';

import { Heart } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useWishlist } from '@/components/providers/wishlist-provider';

interface WishlistButtonProps {
  productId: string;
}

export function WishlistButton({ productId }: WishlistButtonProps) {
  const { status } = useSession();
  const { wishlistedIds, toggle } = useWishlist();

  if (status !== 'authenticated') return null;

  const isWishlisted = wishlistedIds.has(productId);

  return (
    <button
      type="button"
      onClick={() => void toggle(productId)}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
      className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] transition-colors hover:border-red-300 hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
    >
      <Heart
        className={`h-5 w-5 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-[var(--color-muted)]'}`}
      />
    </button>
  );
}
