import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === 'production';

// API origin allowed by connect-src.
// In production the env var holds the Railway URL; in dev fall back to localhost.
const apiOrigin = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Content-Security-Policy for the web app.
 *
 * - 'unsafe-eval' is required by Next.js dev mode (HMR) and React server components.
 *   In production builds Next.js emits nonces, but keeping unsafe-eval is the
 *   pragmatic trade-off for App Router compatibility without a custom nonce strategy.
 * - Cloudinary is explicitly allowed for images.
 * - Google Fonts is allowed for style/font loading.
 * - Stripe JS is allowed for checkout redirect.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com https://images.unsplash.com https://images.pexels.com",
  // In production only the configured API URL is needed; localhost kept for dev.
  `connect-src 'self' ${apiOrigin}${isProd ? '' : ' http://localhost:3001'}`,
  "frame-src https://js.stripe.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  transpilePackages: ["@slicing-edge/shared", "@slicing-edge/db"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        // Unsplash CDN — used for production seed product images
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        // Pexels CDN — used for production seed product images
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
