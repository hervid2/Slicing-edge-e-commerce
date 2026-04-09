import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Shop All Kitchen Knives — Slicing Edge';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * OG image for the Products (shop) listing page.
 */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #1A3A2A 0%, #2D5A3F 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
          fontFamily: 'Georgia, serif',
        }}
      >
        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: '#3D8B4F',
            letterSpacing: '4px',
            textTransform: 'uppercase',
            marginBottom: 20,
          }}
        >
          Our Collection
        </div>

        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: '#FFFFFF',
            marginBottom: 20,
            textAlign: 'center',
          }}
        >
          Premium Kitchen Knives
        </div>

        <div
          style={{
            fontSize: 26,
            color: 'rgba(255,255,255,0.7)',
            textAlign: 'center',
            maxWidth: 700,
          }}
        >
          Chef&apos;s Knives · Santoku · Paring · and more
        </div>

        <div
          style={{
            marginTop: 48,
            display: 'flex',
            gap: 16,
          }}
        >
          {['Free Shipping $75+', 'Lifetime Warranty', 'Handcrafted'].map((badge) => (
            <div
              key={badge}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#FFFFFF',
                fontSize: 16,
                padding: '8px 20px',
                borderRadius: 999,
              }}
            >
              {badge}
            </div>
          ))}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 32,
            right: 60,
            fontSize: 18,
            fontWeight: 700,
            color: 'rgba(255,255,255,0.5)',
          }}
        >
          Slicing Edge
        </div>
      </div>
    ),
    { ...size },
  );
}
