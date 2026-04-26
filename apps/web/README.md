# Slicing Edge — Web App (`apps/web`)

Next.js 15 (App Router) storefront and admin panel for the Slicing Edge e-commerce platform.

---

## Overview

This package is the customer-facing storefront **and** the admin panel, both served from the same Next.js application under different route segments (`/` for the store, `/admin` for the back-office).

It talks exclusively to the Fastify API (`apps/api`) over HTTP — no direct database access except for Auth.js session handling which requires `DATABASE_URL` for the NextAuth adapter.

---

## Implemented Features

### Storefront

| Feature | Route | Description |
|---------|-------|-------------|
| Home | `/` | Hero banner, featured products, category grid |
| Products | `/products` | Grid listing with search, filters, pagination |
| Product Detail | `/products/[slug]` | Images, description, size selector, reviews, add to cart/wishlist |
| Categories | `/categories` | Category grid linking to filtered product pages |
| About | `/about` | Brand story page |
| Search | Header modal | Debounced search with live dropdown; full results at `/products?search=` |

### Cart & Checkout

| Feature | Route | Description |
|---------|-------|-------------|
| Cart | `/cart` | Full CRUD; guest cart persisted via Zustand + localStorage |
| Checkout | `/checkout` | Guest + authenticated; pre-fills user data; Stripe redirect |
| Success | `/checkout/success` | Order confirmation with order number and item thumbnails |
| Cancel | `/checkout/cancel` | Cancelled payment handling with retry CTA |

### Auth

| Feature | Route | Description |
|---------|-------|-------------|
| Login | `/auth/signin` | Email/password + Google OAuth |
| Register | `/auth/register` | Email/password with SweetAlert2 success modal |
| Verify Email | `/auth/verify` | Token-based email verification |
| Forgot Password | `/auth/forgot-password` | Sends reset email via Resend |
| Reset Password | `/auth/reset-password` | Token-based password reset form |

### User Account

| Feature | Route | Description |
|---------|-------|-------------|
| Profile | `/account` | Name, email, saved delivery address |
| Order History | `/account/orders` | Paginated list of past orders with status |
| Wishlist | `/wishlist` | Saved products; remove from wishlist |
| Order Tracking | `/orders/track` | Guest tracking by order number + email |

### Admin Panel

| Feature | Route | Description |
|---------|-------|-------------|
| Dashboard | `/admin` | KPI cards (revenue, orders, products, users), 30-day chart, low-stock list, recent orders |
| Products | `/admin/products` | Table with search; links to create/edit |
| Create Product | `/admin/products/new` | Form with local image upload (multipart, grid preview, max 10 MB) |
| Edit Product | `/admin/products/[id]/edit` | Pre-filled form; deactivate/reactivate |
| Orders | `/admin/orders` | Table with status selector; expandable row with items + timeline |
| Users | `/admin/users` | Paginated user table with role management |

### AI Chatbot

- Floating `ChatWidget` component (bottom-right corner)
- Streams responses from `POST /api/chatbot`
- Renders inline product cards when the bot recommends products
- Supports: product search, category recommendations, order tracking

---

## Architecture Notes

- **App Router only** — no `pages/` directory; all routes under `src/app/`
- **Server Components by default** — client components use `"use client"` and are kept to leaf nodes
- **Data fetching** — Server Components fetch directly from the API using `fetch()` with Next.js caching; mutations use TanStack Query from Client Components
- **Auth** — Auth.js v5 with JWT strategy; `useSession` / `getServerSession` for client/server access
- **Cart state** — Zustand store with `persist` middleware (localStorage); merges guest cart on login
- **Design system** — Tailwind CSS v4 with CSS custom properties; `cn()` utility for class merging; Shadcn UI components
- **Fonts** — Playfair Display (headings) + Inter (body) via `next/font/google`

---

## Project Structure

```
apps/web/src/
├── app/                    # App Router routes
│   ├── (auth)/             # Auth route group
│   ├── (store)/            # Storefront route group
│   ├── account/            # User account pages
│   ├── admin/              # Admin panel
│   ├── api/                # Next.js API routes (Auth.js handlers)
│   ├── error.tsx           # Global error boundary
│   ├── not-found.tsx       # 404 page
│   ├── loading.tsx         # Global suspense fallback
│   ├── layout.tsx          # Root layout (SessionProvider, fonts, ChatWidget)
│   ├── sitemap.ts          # Dynamic sitemap generator
│   └── robots.ts           # robots.txt generator
├── components/
│   ├── ui/                 # Shadcn UI base components
│   ├── layout/             # Header, Footer, CartButton, ChatWidget
│   └── ...                 # Feature-specific components
├── hooks/                  # Custom React hooks
├── lib/                    # Utilities (cn, api client, auth config)
└── store/                  # Zustand stores (cart)
```

---

## Environment Variables

Create `apps/web/.env.local` from the template:

```bash
cp apps/web/env.local.example apps/web/.env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL URL (needed by Auth.js adapter) |
| `AUTH_SECRET` | ✅ | 32+ char random secret — `npx auth secret` |
| `AUTH_URL` | ✅ | App base URL, e.g. `http://localhost:3000` |
| `AUTH_GOOGLE_ID` | Optional | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Optional | Google OAuth client secret |
| `NEXT_PUBLIC_API_URL` | ✅ | Fastify API base URL, e.g. `http://localhost:3001` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | Stripe publishable key |

---

## Running Locally

From the monorepo root:

```bash
npm run dev
```

Or isolated:

```bash
cd apps/web
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Testing

```bash
# From apps/web
npm run test           # Vitest + React Testing Library (watch)
npm run test:run       # single run (CI)

# E2E (from monorepo root — requires running API + Web)
npx playwright test
```

Key test files:
- `src/__tests__/components/` — ProductCard, CartPage, CheckoutPage
- `src/__tests__/store/` — Zustand cart store
- `src/__tests__/auth/` — Login, Register flows
- `e2e/` (monorepo root) — Playwright E2E suite

---

## Build & Deploy

```bash
npm run build          # Next.js production build
```

Deployed to **Vercel** via GitHub integration on push to `main`. The `vercel.json` at the monorepo root configures the Turborepo build filter.

> See [docs/engineering/DEPLOY.md](../../docs/engineering/DEPLOY.md) for the full deploy guide.
