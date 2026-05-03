import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const revalidate = 60;

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface CategoryData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  _count: { products: number };
  products: { images: { url: string; altText: string | null }[] }[];
}

async function getCategories(): Promise<CategoryData[]> {
  try {
    const res = await fetch(`${API_URL}/api/categories`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.categories ?? [];
  } catch {
    return [];
  }
}

export const metadata: Metadata = {
  title: 'Collections',
};

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)] sm:text-4xl">
        Our Collections
      </h1>
      <p className="mt-2 text-[var(--color-muted)]">
        Browse our curated selection of professional-grade kitchen knives.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/products?category=${cat.slug}`}
            className="group relative flex h-72 items-end overflow-hidden rounded-lg bg-[var(--color-primary-light)] p-6 transition-transform hover:scale-[1.02]"
          >
            {cat.products[0]?.images[0]?.url && (
              <Image
                src={cat.products[0].images[0].url}
                alt={cat.products[0].images[0].altText ?? cat.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div className="relative z-10">
              <h2 className="font-[family-name:var(--font-heading)] text-2xl font-bold text-white">
                {cat.name}
              </h2>
              {cat.description && (
                <p className="mt-1 text-sm text-white/70 line-clamp-2">
                  {cat.description}
                </p>
              )}
              <p className="mt-2 text-sm font-medium text-white/90">
                {cat._count.products} {cat._count.products === 1 ? 'product' : 'products'}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium text-[var(--color-primary)]">
            No collections available yet
          </p>
          <p className="mt-2 text-sm text-[var(--color-muted)]">
            Check back soon for our curated knife collections.
          </p>
        </div>
      )}
    </div>
  );
}
