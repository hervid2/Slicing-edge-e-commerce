'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'motion/react';
import { useSession } from 'next-auth/react';
import { formatPrice } from '@/lib/utils';
import { useWishlist } from '@/components/providers/wishlist-provider';
import { useToast } from '@/components/ui/toast';
import { AnimatedHeart } from '@/components/motion/animated-heart';
import { SPRING } from '@/lib/motion-variants';


interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  categoryName?: string;
  avgRating: number;
  reviewCount: number;
  priority?: boolean;
}

export function ProductCard({
  id,
  name,
  slug,
  price,
  compareAtPrice,
  imageUrl,
  imageAlt,
  categoryName,
  avgRating,
  reviewCount,
  priority = false,
}: ProductCardProps) {
  const { status } = useSession();
  const { wishlistedIds, toggle } = useWishlist();
  const { toast } = useToast();
  const [imgError, setImgError] = useState(false);
  const hasDiscount = compareAtPrice && compareAtPrice > price;
  const isWishlisted = wishlistedIds.has(id);
  const isLoggedIn = status === 'authenticated';

  // All product images are fetched directly by the browser. The Next.js optimizer
  // is skipped because remotePatterns is evaluated at Vercel build time and may
  // not include the Railway hostname, causing 404s from the optimizer proxy.
  const unoptimized = true;

  const handleWishlistToggle = async () => {
    await toggle(id);
    if (isWishlisted) {
      toast(`"${name}" removed from wishlist`, 'info');
    } else {
      toast(`"${name}" saved to wishlist!`, 'success');
    }
  };

  return (
    <motion.div
      className="group relative overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] transition-colors duration-300 hover:shadow-lg hover:border-[var(--color-accent)]/30"
      whileHover={{ y: -4 }}
      transition={SPRING}
    >
      {/* Product link covers the whole card */}
      <Link href={`/products/${slug}`} className="block" aria-label={name}>
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-[var(--color-background)]">
          {imageUrl && !imgError ? (
            <Image
              src={imageUrl}
              alt={imageAlt || name}
              fill
              crossOrigin="anonymous"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              priority={priority}
              unoptimized={unoptimized}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[var(--color-muted)]">
              <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          {hasDiscount && (
            <span className="absolute left-3 top-3 rounded-full bg-[var(--color-error)] px-2.5 py-0.5 text-xs font-semibold text-white">
              Sale
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {categoryName && (
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
              {categoryName}
            </p>
          )}
          <h3 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-primary)] line-clamp-1">
            {name}
          </h3>

          {/* Rating */}
          {reviewCount > 0 && (
            <div className="mt-1 flex items-center gap-1">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`h-4 w-4 ${star <= Math.round(avgRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-xs text-[var(--color-muted)]">({reviewCount})</span>
            </div>
          )}

          {/* Price */}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-lg font-bold text-[var(--color-primary)]">
              {formatPrice(price)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-[var(--color-muted)] line-through">
                {formatPrice(compareAtPrice)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Wishlist button — outside the Link to avoid nested interactive elements */}
      {isLoggedIn && (
        <motion.button
          type="button"
          onClick={() => void handleWishlistToggle()}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          whileTap={{ scale: 0.85 }}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow backdrop-blur-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        >
          <AnimatedHeart filled={isWishlisted} />
        </motion.button>
      )}
    </motion.div>
  );
}
