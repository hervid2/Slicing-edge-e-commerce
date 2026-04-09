import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Slicing Edge — Premium Kitchen Knives';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * OG image for the Home page.
 * Rendered at build time (edge runtime) via next/og ImageResponse.
 */
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#1A3A2A',
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
        {/* Decorative accent line */}
        <div
          style={{
            width: 80,
            height: 4,
            background: '#3D8B4F',
            borderRadius: 2,
            marginBottom: 32,
          }}
        />

        <div
          style={{
            fontSize: 80,
            fontWeight: 700,
            color: '#FFFFFF',
            marginBottom: 16,
            letterSpacing: '-1px',
          }}
        >
          Slicing Edge
        </div>

        <div
          style={{
            fontSize: 28,
            color: 'rgba(255,255,255,0.75)',
            textAlign: 'center',
            maxWidth: 760,
            lineHeight: 1.4,
          }}
        >
          Handcrafted Premium Kitchen Knives for Culinary Professionals
        </div>

        <div
          style={{
            marginTop: 48,
            background: '#3D8B4F',
            color: '#FFFFFF',
            fontSize: 22,
            fontWeight: 600,
            padding: '14px 48px',
            borderRadius: 8,
          }}
        >
          Shop Now
        </div>

        {/* Bottom branding */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            fontSize: 16,
            color: 'rgba(255,255,255,0.4)',
          }}
        >
          slicing-edge.vercel.app
        </div>
      </div>
    ),
    { ...size },
  );
}
