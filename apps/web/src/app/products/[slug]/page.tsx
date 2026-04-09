import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatPrice } from '@/lib/utils';
import type { Metadata } from 'next';
import { AddToCartActions } from '@/components/product/add-to-cart-actions';
import { ReviewSection } from '@/components/product/review-section';
import { WishlistButton } from '@/components/product/wishlist-button';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  position: number;
}

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { name: string | null; image: string | null };
}

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  avgRating: number;
  reviewCount: number;
  category: { name: string; slug: string };
  images: ProductImage[];
  reviews: Review[];
}

async function getProduct(slug: string): Promise<ProductDetail | null> {
  try {
    const res = await fetch(`${API_URL}/api/products/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.product;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: 'Product Not Found' };

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://slicing-edge.vercel.app';
  const imageUrl = product.images[0]?.url;

  return {
    title: product.name,
    description: product.description.slice(0, 160),
    openGraph: {
      title: `${product.name} | Slicing Edge`,
      description: product.description.slice(0, 160),
      url: `${BASE_URL}/products/${product.slug}`,
      images: imageUrl ? [{ url: imageUrl, width: 800, height: 800, alt: product.name }] : [],
      type: 'website',
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) notFound();

  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const inStock = product.stock > 0;

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://slicing-edge.vercel.app';

  /** JSON-LD structured data — Product schema for Google rich results */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images.map((img) => img.url),
    url: `${BASE_URL}/products/${product.slug}`,
    brand: {
      '@type': 'Brand',
      name: 'Slicing Edge',
    },
    category: product.category.name,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: Number(product.price).toFixed(2),
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Slicing Edge',
      },
    },
    ...(product.reviewCount > 0 && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: product.avgRating.toFixed(1),
        reviewCount: product.reviewCount,
        bestRating: 5,
        worstRating: 1,
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      {/* Breadcrumbs */}
      <nav className="mb-6 text-sm text-[var(--color-muted)]" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2">
          <li><Link href="/" className="hover:text-[var(--color-accent)]">Home</Link></li>
          <li>/</li>
          <li><Link href="/products" className="hover:text-[var(--color-accent)]">Shop</Link></li>
          <li>/</li>
          <li>
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-[var(--color-accent)]">
              {product.category.name}
            </Link>
          </li>
          <li>/</li>
          <li className="text-[var(--color-foreground)]" aria-current="page">{product.name}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
        {/* Image gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-lg bg-[var(--color-background)]">
            {product.images[0] ? (
              <Image
                src={product.images[0].url}
                alt={product.images[0].altText || product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[var(--color-muted)]">
                <svg aria-hidden="true" className="h-20 w-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(0, 4).map((img) => (
                <div key={img.id} className="relative aspect-square overflow-hidden rounded-md bg-[var(--color-background)]">
                  <Image src={img.url} alt={img.altText || ''} fill className="object-cover" sizes="120px" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product info */}
        <div>
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-[var(--color-muted)]">
            {product.category.name}
          </p>
          <h1 className="font-[family-name:var(--font-heading)] text-3xl font-bold text-[var(--color-primary)] sm:text-4xl">
            {product.name}
          </h1>

          {/* Rating */}
          {product.reviewCount > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`h-5 w-5 ${star <= Math.round(product.avgRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-sm text-[var(--color-muted)]">
                {product.avgRating.toFixed(1)} ({product.reviewCount} reviews)
              </span>
            </div>
          )}

          {/* Price */}
          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-[var(--color-primary)]">
              {formatPrice(Number(product.price))}
            </span>
            {hasDiscount && (
              <span className="text-lg text-[var(--color-muted)] line-through">
                {formatPrice(Number(product.compareAtPrice))}
              </span>
            )}
          </div>

          {/* Stock status */}
          <p className={`mt-3 text-sm font-medium ${inStock ? 'text-[var(--color-success)]' : 'text-[var(--color-error)]'}`}>
            {inStock ? `In stock (${product.stock} available)` : 'Out of stock'}
          </p>

          {/* Description */}
          <div className="mt-6 text-[var(--color-foreground)] leading-relaxed">
            <p>{product.description}</p>
          </div>

          {/* Add to cart + wishlist */}
          <div className="mt-6 flex items-start gap-3">
            <div className="flex-1">
              <AddToCartActions
                product={{
                  id: product.id,
                  name: product.name,
                  price: Number(product.price),
                  stock: product.stock,
                  imageUrl: product.images[0]?.url,
                }}
              />
            </div>
            <WishlistButton productId={product.id} />
          </div>

          {/* Shipping info */}
          <div className="mt-8 space-y-3 rounded-lg bg-[var(--color-background)] p-4 text-sm">
            <div className="flex items-center gap-3">
              <svg aria-hidden="true" className="h-5 w-5 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              <span>Free shipping on orders over $75</span>
            </div>
            <div className="flex items-center gap-3">
              <svg aria-hidden="true" className="h-5 w-5 text-[var(--color-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Lifetime warranty included</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews section */}
      <ReviewSection productId={product.id} initialReviews={product.reviews} />
    </div>
    </>
  );
}
