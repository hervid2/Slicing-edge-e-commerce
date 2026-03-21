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
