'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, Trash2 } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useWishlist } from '@/components/providers/wishlist-provider';
import { RevealStagger } from '@/components/motion/reveal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface WishlistProduct {
  id: string;
  name: string;
  slug: string;
  price: number | string;
  compareAtPrice: number | string | null;
  stock: number;
  isActive: boolean;
  images: Array<{ url: string; altText: string | null }>;
  category: { name: string; slug: string };
}

interface WishlistItem {
  id: string;
  productId: string;
  product: WishlistProduct;
}

interface SessionLike {
  apiAccessToken?: string;
}

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const { toggle } = useWishlist();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
      setLoading(false);
      return;
    }

    const token = (session as SessionLike | null)?.apiAccessToken;
    if (!token) { setLoading(false); return; }

    fetch(`${API_URL}/api/wishlist`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data: { items: WishlistItem[] }) => setItems(data.items ?? []))
      .catch(() => setError('Failed to load wishlist.'))
      .finally(() => setLoading(false));
  }, [status, session]);

  async function handleRemove(productId: string) {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
    await toggle(productId);
  }

  if (status === 'unauthenticated') {
    return (
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center px-4 py-24 text-center">
        <Heart className="h-16 w-16 text-[var(--color-muted)]" />
        <h1 className="mt-6 font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">
          Your Wishlist
        </h1>
        <p className="mt-3 text-[var(--color-muted)]">
          Sign in to save and view your favourite knives.
        </p>
        <Link
          href="/auth/login"
          className="mt-8 inline-flex h-12 items-center rounded-md bg-[var(--color-accent)] px-8 text-base font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-6 font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">
        Your Wishlist
        {items.length > 0 && (
          <span className="ml-2 text-lg font-normal text-[var(--color-muted)]">
            ({items.length})
          </span>
        )}
      </h1>

      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true" aria-live="polite">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
              <div className="aspect-square animate-pulse bg-[var(--color-muted)]/20" />
              <div className="space-y-2 p-4">
                <div className="h-4 w-2/3 animate-pulse rounded bg-[var(--color-primary)]/20" />
                <div className="h-5 w-3/4 animate-pulse rounded bg-[var(--color-primary)]/20" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-[var(--color-muted)]/20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-red-50">
            <Heart className="h-12 w-12 text-red-200" />
            <span className="absolute -right-1 -top-1 text-2xl">✨</span>
          </div>
          <p className="mt-6 font-[family-name:var(--font-heading)] text-xl font-semibold text-[var(--color-primary)]">
            Your wishlist is empty
          </p>
          <p className="mt-2 max-w-xs text-sm text-[var(--color-muted)]">
            Save your favourite knives here so you can come back to them later.
          </p>
          <Link
            href="/products"
            className="mt-6 inline-flex h-11 items-center rounded-md bg-[var(--color-accent)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
          >
            Explore Collection
          </Link>
        </div>
      )}

      {!loading && items.length > 0 && (
        <RevealStagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map(({ id, productId, product }) => {
            const hasDiscount =
              product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price);
            const inStock = product.stock > 0 && product.isActive;

            return (
              <div
                key={id}
                className="group relative overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] transition-shadow hover:shadow-md"
              >
                <Link href={`/products/${product.slug}`} className="block" aria-label={product.name}>
                  <div className="relative aspect-square overflow-hidden bg-[var(--color-background)]">
                    {product.images[0]?.url ? (
                      <Image
                        src={product.images[0].url}
                        alt={product.images[0].altText ?? product.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[var(--color-muted)]">
                        <svg className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    {!inStock && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-[var(--color-foreground)]">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--color-muted)]">
                      {product.category.name}
                    </p>
                    <h2 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-[var(--color-primary)] line-clamp-1">
                      {product.name}
                    </h2>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-lg font-bold text-[var(--color-primary)]">
                        {formatPrice(Number(product.price))}
                      </span>
                      {hasDiscount && (
                        <span className="text-sm text-[var(--color-muted)] line-through">
                          {formatPrice(Number(product.compareAtPrice))}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => void handleRemove(productId)}
                  aria-label={`Remove ${product.name} from wishlist`}
                  className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 shadow backdrop-blur-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            );
          })}
        </RevealStagger>
      )}
    </div>
  );
}
