import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Product — Slicing Edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface OGProps {
  params: Promise<{ slug: string }>;
}

interface ProductOG {
  name: string;
  description: string;
  price: number;
  category: { name: string };
  images: { url: string }[];
}

/**
 * OG image for individual Product Detail pages.
 * Shows product name, category, price and a background image if available.
 */
export default async function Image({ params }: OGProps) {
  const { slug } = await params;

  let product: ProductOG | null = null;
  try {
    const res = await fetch(`${API_URL}/api/products/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = (await res.json()) as { product: ProductOG };
      product = data.product;
    }
  } catch {
    // fallback to generic design
  }

  const name = product?.name ?? 'Premium Kitchen Knife';
  const category = product?.category?.name ?? 'Kitchen Knives';
  const price = product?.price ? `$${Number(product.price).toFixed(2)}` : '';
  const imageUrl = product?.images?.[0]?.url ?? null;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          fontFamily: 'Georgia, serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Left: product info panel */}
        <div
          style={{
            background: '#1A3A2A',
            width: imageUrl ? '55%' : '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '60px 52px',
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: '#3D8B4F',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              marginBottom: 16,
            }}
          >
            {category}
          </div>

          <div
            style={{
              fontSize: 52,
              fontWeight: 700,
              color: '#FFFFFF',
              lineHeight: 1.15,
              marginBottom: 20,
            }}
          >
            {name}
          </div>

          {price && (
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: '#3D8B4F',
                marginBottom: 32,
              }}
            >
              {price}
            </div>
          )}

          <div
            style={{
              fontSize: 20,
              color: 'rgba(255,255,255,0.5)',
              marginTop: 'auto',
            }}
          >
            Slicing Edge
          </div>
        </div>

        {/* Right: product image */}
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            style={{
              width: '45%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
      </div>
    ),
    { ...size },
  );
}
