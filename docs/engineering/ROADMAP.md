# Slicing Edge — Roadmap to Production Deploy

Full work plan to take Slicing Edge from its current state to final deploy on Vercel (web) + Railway (API), organized by weeks and days.

---

## Current State — What's already built

### Backend (apps/api) ✅
- Fastify server with CORS, Helmet, rate-limit, Swagger docs
- Auth: register, verify-email, forgot-password, reset-password
- Products: listing with pagination, filters, detail by slug
- Categories: listing
- Cart: full CRUD (guest via sessionId)
- Checkout: order creation, Stripe Checkout Sessions, webhook handling
- Orders: user orders, guest tracking, admin list, admin status update
- Middleware: JWT auth, requireAdmin, optionalAuth
- Logging: structured Pino

### Frontend (apps/web) ✅
- Home, Products, Product Detail, Categories, About pages
- Cart page with full CRUD
- Checkout with guest form + redirect to Stripe
- Order tracking (guest by orderNumber + email)
- Auth: Login, Register, Forgot/Reset Password, Error pages
- Auth.js v5 (Credentials + Google OAuth) with JWT strategy
- Admin: Dashboard, Products list, Orders list (read-only)
- Complete design system (CSS vars, Playfair/Inter fonts)
- Layout: Header (with mobile nav), Footer, Cart button
- Zustand cart store with persistence
- UI components: Button, Card, Input, ProductCard

### Packages ✅
- `packages/db`: Complete Prisma schema, seed with 10 products
- `packages/shared`: Zod schemas + constants
- `packages/email`: Templates (Welcome, OrderConfirmation, PasswordReset)

---

## What's missing — Gap Analysis

| # | Feature / Gap | Priority |
|---|--------------|-----------|
| 1 | Emails not wired up (verification, reset, order confirmation) | High |
| 2 | Wishlist: placeholder, no API or logic | Medium |
| 3 | Reviews: no submission UI or API routes | Medium |
| 4 | Admin product CRUD (create/edit/delete, Cloudinary upload) | High |
| 5 | Admin UI to update order status | High |
| 6 | Admin: users, dashboard metrics | Medium |
| 7 | Functional search (header search) | Medium |
| 8 | Product images with Cloudinary | High |
| 9 | AI Chatbot (Groq — Llama 3.3 70B) | Low |
| 10 | Guest→user cart merge on login | Medium |
| 11 | User profile/account page | Medium |
| 12 | Order history for authenticated users (frontend) | Medium |
| 13 | NextAuth SessionProvider in layout | High |
| 14 | Checkout pre-fill with logged-in user's data | Medium |
| 15 | Error boundaries (error.tsx, not-found.tsx, loading.tsx) | High |
| 16 | Testing (unit + integration) | High |
| 17 | Upstash Redis rate-limiting (replace basic version) | Low |
| 18 | SEO: OG images, sitemap, robots.txt | Medium |
| 19 | WCAG 2.1 AA accessibility audit | Medium |
| 20 | CI/CD + Deploy (Vercel + Railway) | High |

---

## Week 1 — Foundations and Critical Flow

### Day 1: Session and error infrastructure
- [x] Add NextAuth `SessionProvider` in `layout.tsx` (wrapping `<body>`)
- [x] Create global `app/error.tsx` (error boundary)
- [x] Create `app/not-found.tsx` (404 page)
- [x] Create `app/loading.tsx` (global skeleton)
- [x] Create `products/loading.tsx` and `products/[slug]/loading.tsx`

### Day 2: Wire up transactional emails
- [x] Wiring in `auth.controller.ts`: send Welcome email on register
- [x] Wiring in `auth.controller.ts`: send PasswordReset email on reset request
- [x] Send OrderConfirmation email in the `checkout.session.completed` webhook
- [x] Smoke test with Resend (or log if no API key)

### Day 3: Cloudinary + Product images
- [x] Create `upload` module in the API: `POST /api/admin/upload` (Cloudinary)
- [x] Update seed to include Cloudinary URLs (or placeholder URLs)
- [x] Configure `next.config.ts` with the Cloudinary domain in `images.remotePatterns`
- [x] Verify that Product Detail and ProductCard render images correctly

### Day 4: Admin — Product CRUD
- [x] API: `POST /api/admin/products` (create product with images)
- [x] API: `PUT /api/admin/products/:id` (edit product)
- [x] API: `DELETE /api/admin/products/:id` (soft-delete / deactivate)
- [x] Frontend: `admin/products/new/page.tsx` — creation form
- [x] Frontend: `admin/products/[id]/edit/page.tsx` — edit form

### Day 5: Admin — Order management
- [x] Frontend: Admin orders page with button/select to change status
- [x] Implement `PATCH /api/admin/orders/:id/status` call from the UI
- [x] Show expandable order detail (items, address, timeline)
- [x] Send notification email when an order changes to SHIPPED

---

## Week 2 — User Features

### Day 6: Functional search
- [x] API: ensure `GET /api/products?search=` works with full-text search
- [x] Frontend: search modal/drawer on clicking the Search icon
- [x] Implement debounced search with dropdown results
- [x] Results page `/products?search=query`

### Day 7: Reviews — API + UI
- [x] API: `POST /api/products/:id/reviews` (auth required)
- [x] API: `GET /api/products/:id/reviews` (public, paginated)
- [x] API: `DELETE /api/products/:id/reviews/:reviewId` (own review or admin)
- [x] Frontend: review form on Product Detail (stars + comment)
- [x] Update `avgRating` and `reviewCount` on review create/delete

### Day 8: Wishlist — API + UI
- [x] API: `POST /api/wishlist` (auth required, toggle add/remove)
- [x] API: `GET /api/wishlist` (auth required)
- [x] Frontend: wishlist button on ProductCard and Product Detail
- [x] Frontend: functional `/wishlist` page with list and remove
- [x] Visual indicator for wishlisted items (filled heart)

### Day 9: User profile + Order history
- [x] Frontend: `/account/page.tsx` — profile with name, email, address
- [x] Frontend: `/account/orders/page.tsx` — authenticated order history
- [x] API fetch with Bearer token (using the session's `apiAccessToken`)
- [x] Update Header: link to /account when there's a session

### Day 10: Cart merge + Authenticated checkout
- [x] API: endpoint or logic to merge guest cart → user cart on login
- [x] Frontend: call merge after a successful `signIn`
- [x] Checkout: pre-fill email and name if the user is logged in
- [x] Checkout: pre-fill the user's saved address (if it exists)

---

## Week 3 — Advanced Admin, Chatbot and Polish

### Day 11: Admin — Metrics dashboard
- [x] API: `GET /api/admin/metrics` (total orders, revenue, product count, user count)
- [x] Frontend: dashboard with KPI cards
- [x] Simple chart of orders per day (last 30 days)
- [x] List of recent orders + low-stock products

### Day 12: Admin — User management
- [x] API: `GET /api/admin/users` (paginated)
- [x] API: `PATCH /api/admin/users/:id/role` (change role)
- [x] Frontend: `/admin/users/page.tsx` — user table with role
- [x] Add link on the admin dashboard

### Day 13: AI Chatbot — Backend
- [x] Create `chatbot` module in the API: `POST /api/chatbot`
- [x] Integrate Groq (Llama 3.3 70B) with tool-use pattern
- [x] Tools: search products, recommend by category, track order
- [x] Chatbot-specific rate-limit

### Day 14: AI Chatbot — Frontend
- [x] Floating `ChatWidget` component (bottom-right)
- [x] UI: chat bubble, input, message history
- [x] Response streaming (or polling)
- [x] Show inline product cards when the bot recommends products

### Day 15: UX Polish
- [x] Skeleton loaders for Products, Cart, Order pages
- [x] Toast notifications (add to cart, wishlist, etc.)
- [x] Transition animations (page transitions, hover effects)
- [x] Improved empty states with illustrations
- [x] Responsive QA: verify every page on mobile/tablet/desktop

---

## Week 4 — Testing, SEO and Deploy Prep

### Day 16: Testing — Backend
- [x] Unit tests for `AuthService` (register, verify, reset)
- [x] Unit tests for `CheckoutService` (createOrder, webhook handling)
- [x] Unit tests for `ProductService` / `ProductRepository`
- [x] Integration tests for main routes (health, products, cart, checkout)
- [x] Configure Vitest (or Jest) in `apps/api`

### Day 17: Testing — Frontend
- [x] Configure testing with Vitest + React Testing Library in `apps/web`
- [x] Tests for critical components: ProductCard, CartPage, CheckoutPage
- [x] Tests for the cart store (Zustand)
- [x] Tests for the auth flow (login, register)

### Day 18: SEO and Accessibility
- [x] Add `sitemap.ts` and `robots.ts` in `apps/web/src/app`
- [x] OG images for Home, Products, Product Detail
- [x] Structured data (JSON-LD) for Product pages
- [x] WCAG 2.1 AA audit: aria labels, color contrast, focus management
- [x] Lighthouse audit and fixes (target: 90+ across all categories)

### Day 19: Security and Rate Limiting
- [x] Migrate rate-limit to Upstash Redis (`@upstash/ratelimit`)
- [x] Review CORS config for production
- [x] Sanitize inputs (XSS prevention)
- [x] Verify no API keys are exposed to the client
- [x] Add appropriate CSP headers

### Day 20: Deploy configuration
- [x] Create `Dockerfile` or config for Railway (API)
- [x] Configure `vercel.json` if needed (web)
- [x] Configure environment variables in Railway + Vercel
- [x] Configure production PostgreSQL (Railway or Neon)
- [x] `prisma migrate deploy` for production
- [x] Production seed (categories + products with real images)

---

## Week 5 — Deploy and Launch

### Day 21: Staging deploy
- [x] Deploy API to Railway (staging)
- [x] Deploy Web to Vercel (staging)
- [x] Configure custom domain (if applicable)
- [x] Verify Stripe webhooks point to the production URL
- [x] End-to-end smoke test on staging

### Day 22: Final QA
- [x] Full guest flow: browse → cart → checkout → payment → tracking
- [x] Full authenticated flow: register → login → cart → checkout → orders
- [x] Admin: login → products CRUD → order management
- [x] Chatbot: product inquiry, order tracking
- [x] Emails: verify receipt of every template
- [x] Mobile QA on real devices

### Day 23: Fixes and production deploy
- [x] Fix bugs found during QA
- [x] Deploy API to Railway (production)
- [x] Deploy Web to Vercel (production)
- [x] Verify SSL, redirects, and security headers
- [x] Stripe: enable live mode (if applicable) or keep test mode

### Day 24: Final documentation
- [x] Update `README.md` with deploy instructions
- [x] Document production environment variables
- [x] Update `apps/web/README.md` with implemented features
- [x] Create `CHANGELOG.md` with feature history
- [x] Screenshots/GIFs of the project for the portfolio

### Day 25 (buffer): Refinement
- [x] Performance: analyze and optimize Core Web Vitals
- [x] Caching: configure optimal ISR/revalidation in Next.js
- [x] Monitoring: set up error tracking (Sentry or similar)
- [x] Analytics: Google Analytics or Vercel Analytics
- [x] Final code review and cleanup

---

## Post-Roadmap — Shipping and Returns Management Improvements

Implemented after completing the original roadmap, based on best practices for mid-sized e-commerce businesses.

### Shipment tracking on orders
- [x] Add `trackingNumber` and `carrierName` fields to the `Order` model
- [x] Admin can enter tracking number and carrier when changing status to `SHIPPED`
- [x] Tracking number and carrier are shown in the customer's order detail view
- [x] Migration applied: `20260503025204_add_shipping_tracking_rma_states`

### Full RMA flow (Return Merchandise Authorization)
- [x] Expand the `ReturnStatus` enum from 4 to 7 states: `PENDING → APPROVED/REJECTED → LABEL_ISSUED → RECEIVED → REFUNDED → CLOSED`
- [x] Update `ReturnService.updateStatus` to handle every state in the flow
- [x] The "active return" check now includes the `LABEL_ISSUED` and `RECEIVED` states (not just `PENDING`/`APPROVED`)

### Automatic refund via Stripe
- [x] On transitioning to `REFUNDED`, the service calls the Stripe REST API's `POST /v1/refunds` using the order's `stripePaymentIntentId`
- [x] If `STRIPE_SECRET_KEY` isn't configured, the system logs a warning via Pino and continues (fail-safe)
- [x] If the Stripe refund fails, the exception reaches the client with a 502 status before the DB is updated

### Email notifications on RMA status changes
- [x] New `ReturnStatusEmail` template in `packages/email` — message and color adapted to each state
- [x] `ReturnService` sends an email to the customer on every visible transition (all except `PENDING`)
- [x] Fire-and-forget send with error capture in Pino (doesn't block the HTTP response)

### Auditability of order status changes
- [x] Add `changedByAdminId` field to the `OrderStatusHistory` model
- [x] The controller extracts the admin's `sub` from the JWT and passes it to the service on every status change

### Customer UI — return request form
- [x] "Request Return" button visible on orders with `DELIVERED` status in `/account/orders`
- [x] Client-side modal with a predefined reason (7-option select) + free-text description
- [x] Calls `POST /api/returns` directly from the browser with the session's data

### Admin UI — order and return management improvements
- [x] Selecting `SHIPPED` in the admin dropdown reveals tracking number and carrier inputs
- [x] Expanded order panel shows tracking number and carrier when available
- [x] Returns dropdown with 7 states and readable labels ("Label Issued", "Received", etc.)

### Admin-initiated returns
- [x] New endpoint `POST /api/admin/orders/:orderId/return` — bypasses the customer's email verification
- [x] `ReturnService.createReturnByAdmin()` takes the customer's email directly from the order record
- [x] `getAllOrders` includes each order's active return (`returnRequests` filtered to non-closed states)
- [x] The expanded panel for each order in admin shows the "Initiate Return" form when there's no active return
- [x] If an active return already exists, the panel shows its current status and a direct link to the Returns section
- [x] Inline form: predefined reason (7 options including "Admin-initiated") + description + optional internal note
- [x] On creating the return, the order's local state updates without needing to reload the page

---

## Notes

- **Days = working days of ~4-6 hours of focused work**
- **Priority**: If time is limited, weeks 1-2 + deploy (day 20-23) are the functional MVP
- **AI Chatbot** (days 13-14) can be postponed if time is limited
- **Upstash Redis** (day 19) is optional if Fastify's basic rate-limit is sufficient
- The plan assumes Stripe, Resend, Google OAuth, and Groq API keys are configured
- Product images use local storage (`apps/api/public/uploads/`) — no dependency on Cloudinary
