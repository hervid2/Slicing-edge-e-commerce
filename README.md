# Slicing Edge — Premium Kitchen Knives E-Commerce

A full-stack e-commerce platform for premium kitchen knives, built as a portfolio project showcasing modern web development best practices.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS v4 |
| **Backend** | Fastify 5, TypeScript, Prisma ORM |
| **Database** | PostgreSQL |
| **Auth** | Auth.js v5 (email/password + Google OAuth) |
| **Payments** | Stripe (Checkout Sessions + Webhooks) |
| **Email** | Resend + React Email |
| **Images** | Cloudinary CDN |
| **State** | Zustand (client), TanStack Query (server) |
| **Validation** | Zod (shared schemas) |
| **AI Chatbot** | Anthropic Claude API |
| **Monorepo** | Turborepo |

## Project Structure

```
slicing-edge/
├── apps/
│   ├── web/          # Next.js 15 frontend
│   └── api/          # Fastify REST API
├── packages/
│   ├── db/           # Prisma schema, client, seed
│   ├── shared/       # Zod schemas, constants, types
│   ├── email/        # React Email templates + Resend
│   └── config/       # Shared TypeScript configs
├── turbo.json
├── agent.md
└── .env.example
```

## Engineering Guidelines (Portfolio)

This repository versions a small set of engineering standards to make implementation decisions explicit and reviewable:

- `agent.md` — architecture, stack, and core coding conventions.
- `.windsurf/skills/*.md` — focused rules for Next.js, Prisma, Tailwind/shadcn/Fastify, and Stripe.
- `docs/engineering/README.md` — index and rationale for these guidelines.

The goal is to demonstrate consistent engineering practices, not editor-specific metadata.

## Getting Started

### Prerequisites

- Node.js >= 20
- PostgreSQL database
- npm 10+

### Setup

1. **Clone and install:**
   ```bash
   git clone <repo-url>
   cd slicing-edge
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Fill in your database URL, API keys, etc.
   ```

3. **Set up the database:**
   ```bash
   cd packages/db
   npx prisma db push
   npm run db:seed
   ```

4. **Start development servers:**
   ```bash
   # From the root directory
   npm run dev
   ```

   - **Frontend**: http://localhost:3000
   - **API**: http://localhost:3001
   - **API Docs**: http://localhost:3001/docs

### Stripe local setup and webhook testing

1. Configure Stripe variables in `.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_xxx
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
   FRONTEND_URL=http://localhost:3000
   ```

2. Start API and frontend.

3. In a separate terminal, forward Stripe events to your local webhook:
   ```bash
   stripe listen --forward-to http://localhost:3001/api/checkout/webhook
   ```

4. Use Stripe test cards during checkout UI (never real cards):
   - Success: `4242 4242 4242 4242`
   - Declined payment: `4000 0000 0000 0002`
   - 3D Secure flow: `4000 0025 0000 3155`
   - Use any future date, any CVC, and dummy cardholder data.

5. Optional webhook smoke trigger:
   ```bash
   stripe trigger checkout.session.completed
   ```

Expected behavior:
- Successful payment transitions order status from `PENDING` to `PROCESSING`.
- Failed/expired checkout events transition order to `CANCELLED`.

### Test Accounts (after seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@slicing-edge.com | admin123456 |
| Customer | customer@example.com | customer123456 |

## Key Features

- Product catalog with categories, search, and filters
- Shopping cart (persisted for logged-in users, session-based for guests)
- Stripe checkout with webhook-based order confirmation
- User authentication (email/password + Google OAuth)
- Order tracking (authenticated + guest via order number + email)
- Product reviews and ratings
- Admin panel (products, orders, users, metrics)
- AI chatbot for product recommendations and order tracking
- Wishlist functionality
- Responsive mobile-first design

## License

MIT
