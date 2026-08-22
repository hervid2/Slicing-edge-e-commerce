'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { MotionModal } from '@/components/ui/motion-modal';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface SearchProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: Array<{ url: string; altText: string | null }>;
  category: { name: string };
}

interface SearchModalProps {
  onClose: () => void;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export function SearchModal({ onClose }: SearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Auto-focus input when modal opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced search
  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setSearched(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_URL}/api/products?search=${encodeURIComponent(trimmed)}&limit=5`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as { products: SearchProduct[] };
        setResults(data.products ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
        setSearched(true);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    onClose();
    router.push(`/products?search=${encodeURIComponent(trimmed)}`);
  }

  function handleResultClick(slug: string) {
    onClose();
    router.push(`/products/${slug}`);
  }

  function handleViewAll() {
    const trimmed = query.trim();
    if (!trimmed) return;
    onClose();
    router.push(`/products?search=${encodeURIComponent(trimmed)}`);
  }

  return (
    <MotionModal
      onClose={onClose}
      ariaLabel="Search products"
      overlayClassName="items-start justify-center pt-20 backdrop-blur-sm"
      className="max-w-xl overflow-hidden border border-[var(--color-border)] shadow-2xl"
    >
      {/* Input */}
        <form onSubmit={handleSubmit} className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3">
          {loading ? (
            <Loader2 className="h-5 w-5 shrink-0 animate-spin text-[var(--color-muted)]" />
          ) : (
            <Search className="h-5 w-5 shrink-0 text-[var(--color-muted)]" />
          )}
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search knives…"
            className="flex-1 bg-transparent text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted)] focus:outline-none"
            aria-label="Search products"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[var(--color-muted)] transition-colors hover:text-[var(--color-foreground)]"
          >
            <X className="h-4 w-4" />
          </button>
        </form>

        {/* Live region for screen reader announcements */}
        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {searched && !loading && (
            results.length === 0
              ? `No products found for "${query.trim()}"`
              : `${results.length} product${results.length === 1 ? '' : 's'} found`
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul role="listbox" aria-label="Search results" className="max-h-80 overflow-y-auto py-2">
            {results.map((product) => (
              <li key={product.id} role="option" aria-selected="false">
                <button
                  type="button"
                  onClick={() => handleResultClick(product.slug)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-background)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--color-accent)]"
                >
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-background)]">
                    {product.images[0]?.url ? (
                      <Image
                        src={product.images[0].url}
                        alt={product.images[0].altText ?? product.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="h-full w-full bg-[var(--color-border)]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[var(--color-foreground)]">
                      {product.name}
                    </p>
                    <p className="text-xs text-[var(--color-muted)]">{product.category.name}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-[var(--color-primary)]">
                    {formatPrice(Number(product.price))}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* View all / empty state */}
        {query.trim() && !loading && (
          <div className="border-t border-[var(--color-border)] px-4 py-3">
            {searched && results.length === 0 ? (
              <p className="text-center text-sm text-[var(--color-muted)]">
                No products found for &ldquo;{query.trim()}&rdquo;
              </p>
            ) : results.length > 0 ? (
              <button
                type="button"
                onClick={handleViewAll}
                className="w-full rounded-md bg-[var(--color-accent)] py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
              >
                View all results for &ldquo;{query.trim()}&rdquo;
              </button>
            ) : null}
          </div>
        )}

        {/* Hint when empty */}
        {!query.trim() && (
          <p className="px-4 py-6 text-center text-sm text-[var(--color-muted)]">
            Type to search products…
          </p>
        )}
    </MotionModal>
  );
}
