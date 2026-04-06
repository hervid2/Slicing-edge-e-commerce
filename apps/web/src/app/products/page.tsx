import Link from 'next/link';
import { ProductCard } from '@/components/product/product-card';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
}

interface ProductData {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  avgRating: number;
  reviewCount: number;
  category: { name: string; slug: string };
  images: ProductImage[];
}

interface SearchParams {
  page?: string;
  category?: string;
  search?: string;
  minPrice?: string;
  maxPrice?: string;
  sortBy?: string;
}

async function getProducts(searchParams: SearchParams) {
  const params = new URLSearchParams();
  if (searchParams.page) params.set('page', searchParams.page);
  if (searchParams.category) params.set('categorySlug', searchParams.category);
  if (searchParams.search) params.set('search', searchParams.search);
  if (searchParams.minPrice) params.set('minPrice', searchParams.minPrice);
  if (searchParams.maxPrice) params.set('maxPrice', searchParams.maxPrice);
  if (searchParams.sortBy) params.set('sortBy', searchParams.sortBy);

  try {
    const res = await fetch(`${API_URL}/api/products?${params.toString()}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export const metadata = {
  title: 'Shop All Knives',
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const data = await getProducts(params);

  const products: ProductData[] = data?.products ?? [];
  const pagination = data?.pagination ?? { page: 1, totalPages: 1, total: 0 };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)] sm:text-4xl">
          {params.search ? `Results for "${params.search}"` : 'Our Knives'}
        </h1>
        <p className="mt-2 text-[var(--color-muted)]">
          {pagination.total > 0
            ? `Showing ${products.length} of ${pagination.total} products`
            : 'Browse our collection of premium kitchen knives'}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {['chef-knives', 'santoku-knives', 'paring-knives'].map((cat) => (
          <a
            key={cat}
            href={`/products?category=${cat}${params.search ? `&search=${encodeURIComponent(params.search)}` : ''}`}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
              params.category === cat
                ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                : 'border-[var(--color-border)] text-[var(--color-foreground)] hover:border-[var(--color-accent)]'
            }`}
          >
            {cat.replace('-', ' ').replace(/(^\w|\s\w)/g, (m) => m.toUpperCase()).replace('Knives', '').trim()}
          </a>
        ))}
        {params.search && (
          <Link
            href={params.category ? `/products?category=${params.category}` : '/products'}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-accent)] bg-[var(--color-accent)]/10 px-4 py-1.5 text-sm font-medium text-[var(--color-accent)]"
          >
            &ldquo;{params.search}&rdquo; ×
          </Link>
        )}
        {(params.category || params.search) && (
          <Link
            href="/products"
            className="rounded-full border border-[var(--color-border)] px-4 py-1.5 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          >
            Clear all
          </Link>
        )}
      </div>

      {/* Product grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              name={product.name}
              slug={product.slug}
              price={Number(product.price)}
              compareAtPrice={product.compareAtPrice ? Number(product.compareAtPrice) : null}
              imageUrl={product.images[0]?.url}
              imageAlt={product.images[0]?.altText}
              categoryName={product.category.name}
              avgRating={product.avgRating}
              reviewCount={product.reviewCount}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium text-[var(--color-primary)]">No products found</p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Try adjusting your filters or check back later.
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/products?page=${p}${params.category ? `&category=${params.category}` : ''}${params.search ? `&search=${encodeURIComponent(params.search)}` : ''}${params.sortBy ? `&sortBy=${params.sortBy}` : ''}`}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-md text-sm font-medium transition-colors ${
                p === pagination.page
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-background)]'
              }`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
