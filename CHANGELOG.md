# Changelog

All notable changes to Slicing Edge are documented here, organized by feature milestone (roadmap days).

---

## [Unreleased]

### Planned
- Performance: Core Web Vitals analysis and ISR/revalidation optimization
- Monitoring: Sentry error tracking
- Analytics: Vercel Analytics integration

---

## [1.0.0] — 2026-04 — Production Launch

### Week 5 — Deploy & QA (Days 21–23)

**Day 23 — Bug fixes & production deploy**
- Fixed TypeScript errors in test mocks and hardened production configuration
- Deployed API to Railway (production) and Web to Vercel (production)
- Verified SSL, security headers, and redirects in production

**Day 22 — QA final**
- Added Playwright E2E suite covering guest checkout, authenticated checkout, admin flows, and chatbot
- Fixed order tracking for authenticated users (query now checks `guestEmail OR user.email`)
- Added product image thumbnails to order summary and tracking pages
- Fixed review form crash; removed duplicate wishlist button on product detail
- Wrapped sign-in button to hide when user session is already active

**Day 21 — Staging deploy + CI/CD**
- GitHub Actions pipeline: test → build → deploy-api → deploy-web → smoke-test
- Railway deployment for API with Dockerfile multi-stage build
- Vercel deployment for web via GitHub integration
- `scripts/smoke-test.sh` script for automated post-deploy validation
- Stripe webhook configured and verified against staging URL

---

### Week 4 — Testing, SEO & Deploy Prep (Days 16–20)

**Day 20 — Deploy configuration**
- `apps/api/Dockerfile` multi-stage build (deps → runner, tsx runtime)
- `railway.toml` with healthcheck configuration
- `apps/web/vercel.json` with Turborepo build filter
- `prisma migrate deploy` integration in CI pipeline
- Production seed script with real Pexels product images
- `docs/engineering/DEPLOY.md` full deploy guide

**Day 19 — Security & rate limiting**
- Migrated rate limiting to Upstash Redis (`@upstash/ratelimit`) for distributed environments
- Added Content Security Policy (CSP) headers via Fastify Helmet
- Reviewed and locked down CORS origins for production (`ALLOWED_ORIGINS` env var)
- Input sanitization audit; verified no client-side secret exposure
- Added `additionalProperties: true` to Fastify response schemas to prevent field stripping

**Day 18 — SEO & accessibility**
- `app/sitemap.ts` dynamic sitemap generator (products + categories + static routes)
- `app/robots.ts` with production/development rules
- OG images for Home, Products, and Product Detail pages
- JSON-LD structured data (`Product` schema) on product detail pages
- WCAG 2.1 AA audit: aria labels, focus rings, color contrast, touch target sizing
- Lighthouse audit pass (target 90+ across all categories)

**Day 17 — Frontend testing**
- Vitest + React Testing Library setup in `apps/web`
- Tests: ProductCard, CartPage, CheckoutPage components
- Tests: Zustand cart store (add, remove, update quantity, clear)
- Tests: Login and Register auth flows

**Day 16 — Backend testing**
- Vitest setup in `apps/api`
- Unit tests: `AuthService` (register, verify-email, reset-password)
- Unit tests: `CheckoutService` (createOrder, webhook handling)
- Unit tests: `ProductService` / `ProductRepository`
- Integration tests: health, products, cart, checkout routes

---

### Week 3 — Admin, Chatbot & Polish (Days 11–15)

**Day 15 — UX polish**
- Skeleton loaders for Products, Cart, and Order pages
- Toast notifications for add-to-cart, wishlist toggle, and review submission
- Page transition animations and hover effects
- Improved empty states with illustrated placeholders
- Full responsive QA across mobile, tablet, and desktop breakpoints

**Day 14 — AI Chatbot frontend**
- `ChatWidget` floating component (bottom-right corner)
- Chat UI: message bubbles, user/assistant distinction, scroll-to-bottom
- Inline product cards rendered when bot recommends products
- Streaming response rendering

**Day 13 — AI Chatbot backend**
- `POST /api/chatbot` endpoint with Anthropic Claude integration
- Tool-use pattern: `searchProducts`, `recommendByCategory`, `trackOrder`
- Chatbot-specific rate limiting (stricter than general API)
- Server-side only — `ANTHROPIC_API_KEY` never exposed to client

**Day 12 — Admin user management**
- `GET /api/admin/users` paginated endpoint
- `PATCH /api/admin/users/:id/role` role change endpoint
- `/admin/users` page: user table with role badge and role-change select
- Admin sidebar link to users page

**Day 11 — Admin metrics dashboard**
- `GET /api/admin/metrics` endpoint (total orders, revenue, product count, user count)
- KPI cards on admin dashboard
- 30-day orders bar chart
- Recent orders list and low-stock products list on dashboard

---

### Week 2 — User Features (Days 6–10)

**Day 10 — Cart merge + authenticated checkout**
- Guest cart → user cart merge on login
- Checkout pre-fills email, name, and saved address for authenticated users
- `POST /api/cart/merge` endpoint

**Day 9 — User profile & order history**
- `/account` profile page (name, email, delivery address editor)
- `/account/orders` authenticated order history with pagination
- Header updated with `/account` link when session is active

**Day 8 — Wishlist**
- `POST /api/wishlist` toggle (add/remove) endpoint (auth required)
- `GET /api/wishlist` endpoint (auth required)
- Wishlist button on ProductCard and Product Detail (filled heart when saved)
- `/wishlist` page with remove functionality

**Day 7 — Reviews**
- `POST /api/products/:id/reviews` endpoint (auth required)
- `GET /api/products/:id/reviews` paginated public endpoint
- `DELETE /api/products/:id/reviews/:reviewId` (own review or admin)
- Star-rating + comment form on Product Detail page
- Auto-update of `avgRating` and `reviewCount` on Product

**Day 6 — Search**
- Full-text search via `GET /api/products?search=`
- Header search modal with debounced live dropdown
- Full results page at `/products?search=query`

---

### Week 1 — Foundations & Critical Flow (Days 1–5)

**Day 5 — Admin order management**
- Admin orders table with expandable rows (items, address, status timeline)
- Inline status selector calling `PATCH /api/admin/orders/:id/status`
- Email notification sent when order status changes to `SHIPPED`

**Day 4 — Admin product CRUD**
- `POST /api/admin/products` create with Cloudinary image upload
- `PUT /api/admin/products/:id` edit endpoint
- `DELETE /api/admin/products/:id` soft-delete (deactivate) endpoint
- `/admin/products/new` creation form with image upload
- `/admin/products/[id]/edit` pre-filled edit form

**Day 3 — Cloudinary image integration**
- `POST /api/admin/upload` Cloudinary upload endpoint
- Updated product seed with real Pexels CDN image URLs
- `next.config.ts` `remotePatterns` for Cloudinary and Pexels domains
- ProductCard and Product Detail render images via Next.js `<Image>`

**Day 2 — Transactional emails**
- Welcome email sent on user registration
- Password Reset email sent on forgot-password request
- Order Confirmation email sent via Stripe `checkout.session.completed` webhook
- Graceful fallback to structured Pino logs when `RESEND_API_KEY` is absent

**Day 1 — Session & error infrastructure**
- `SessionProvider` wrapping `<body>` in root layout
- `app/error.tsx` global error boundary
- `app/not-found.tsx` custom 404 page
- `app/loading.tsx` global skeleton fallback
- `products/loading.tsx` and `products/[slug]/loading.tsx` route-level skeletons

---

## [0.1.0] — Initial Build — Pre-Roadmap

### Backend (`apps/api`)
- Fastify server with CORS, Helmet, rate-limit, Swagger docs
- Auth: register, verify-email, forgot-password, reset-password
- Products: listing with pagination, filters, detail by slug
- Categories: listing
- Cart: full CRUD (guest via sessionId)
- Checkout: order creation, Stripe Checkout Sessions, webhook handling
- Orders: user orders, guest tracking, admin list, admin status update
- Middleware: JWT auth, `requireAdmin`, `optionalAuth`
- Logging: structured Pino with field redaction

### Frontend (`apps/web`)
- Home, Products, Product Detail, Categories, About pages
- Cart page with full CRUD
- Checkout with guest form + Stripe redirect
- Order tracking (guest by orderNumber + email)
- Auth: Login, Register, Forgot/Reset Password, error pages
- Auth.js v5 (Credentials + Google OAuth) with JWT strategy
- Admin: Dashboard, Products list, Orders list (read-only)
- Full design system (CSS custom properties, Playfair Display + Inter)
- Layout: Header (with mobile nav), Footer, Cart button
- Zustand cart store with persistence
- UI components: Button, Card, Input, ProductCard

### Packages
- `packages/db`: Complete Prisma schema, seed with 10 products
- `packages/shared`: Zod schemas + constants
- `packages/email`: React Email templates (Welcome, OrderConfirmation, PasswordReset)
