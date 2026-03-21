import type { Metadata } from 'next';
import Link from 'next/link';
import { Heart } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Wishlist',
};

export default function WishlistPage() {
  // TODO: Fetch wishlist from API when auth is wired up
  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-center px-4 py-24 text-center">
      <Heart className="h-16 w-16 text-[var(--color-muted)]" />
      <h1 className="mt-6 font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)]">
        Your Wishlist
      </h1>
      <p className="mt-3 text-[var(--color-muted)]">
        Save your favorite knives here. Sign in to start building your wishlist.
      </p>
      <Link
        href="/products"
        className="mt-8 inline-flex h-12 items-center justify-center rounded-md bg-[var(--color-accent)] px-8 text-base font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
      >
        Browse Products
      </Link>
    </div>
  );
}
