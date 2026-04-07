'use client';

import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ChatProduct } from '@/lib/api/chatbot';

function formatPrice(value: string | number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(value),
  );
}

interface ChatProductCardProps {
  product: ChatProduct;
  className?: string;
}

/**
 * Compact product card shown inline inside chatbot assistant messages.
 */
export function ChatProductCard({ product, className }: ChatProductCardProps) {
  const image = product.images[0];
  const outOfStock = product.stock === 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className={cn(
        'group flex w-40 shrink-0 flex-col overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
        className,
      )}
      aria-label={`View ${product.name}`}
    >
      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden bg-[var(--color-background)]">
        {image?.url ? (
          <Image
            src={image.url}
            alt={image.altText ?? product.name}
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-105"
            sizes="160px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[var(--color-muted)]">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        {outOfStock && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-semibold text-white">
            Out of stock
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-0.5 p-2">
        <p className="line-clamp-2 text-xs font-semibold leading-snug text-[var(--color-primary)]">
          {product.name}
        </p>
        <p className="text-xs text-[var(--color-muted)]">{product.category.name}</p>
        <p className="mt-auto pt-1 text-sm font-bold text-[var(--color-primary)]">
          {formatPrice(product.price)}
        </p>
      </div>
    </Link>
  );
}
