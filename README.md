# Slicing Edge — Premium Kitchen Knives E-Commerce

Portfolio-grade, full-stack e-commerce platform focused on premium kitchen knives.
The project demonstrates production-minded architecture in a Turborepo monorepo,
including checkout/webhooks, auth, transactional emails, admin workflows, and
shared validation contracts.

## Live Demo

- **Web App:** `TBD (add deployed Vercel URL)`
- **API Docs (Swagger):** `TBD (add deployed Railway URL)/docs`

> For local API docs, run the project and open: `http://localhost:3001/docs`

## Project Overview

Slicing Edge solves the end-to-end flow for a modern niche storefront:

- discover products via category/search
- cart + checkout for guest and authenticated users
- Stripe payment lifecycle with webhook reconciliation
- guest order tracking and authenticated order history
- admin management for products and orders

If you maintain a portfolio site, add a screenshot/GIF under `docs/assets/` and link it here.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| Backend | Fastify 5, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | Auth.js v5 (Credentials + Google OAuth) |
| Payments | Stripe Checkout + Webhooks |
| Email | Resend + React Email |
| Shared Contracts | Zod schemas in `packages/shared` |
| Monorepo | Turborepo + npm workspaces |

## Architecture Overview

```text
[Next.js Web (apps/web)]
        |
        | HTTP (REST)
        v
[Fastify API (apps/api)] ----> [Stripe API]
        |                         |
        | Prisma                  | Webhooks
        v                         v
 [PostgreSQL DB] <----------- /api/checkout/webhook
        ^
        |
[packages/db, packages/shared, packages/email]
```

## Folder Structure (Monorepo)

```text
slicing-edge/
├─ apps/
│  ├─ web/                 # Next.js storefront + admin UI
│  └─ api/                 # Fastify REST API + Swagger
├─ packages/
│  ├─ db/                  # Prisma schema/client/seed
│  ├─ shared/              # Zod schemas, constants, shared types
│  ├─ email/               # React Email templates + sendEmail helper
│  └─ config/              # Shared TypeScript config presets
├─ docs/engineering/       # Roadmap + engineering notes
├─ agent.md                # Project architecture and coding conventions
└─ .env.example            # Root environment template
```

## Getting Started (Local, 5 commands)

### Prerequisites

- Node.js >= 20
- npm >= 10
- PostgreSQL running locally or remotely

### Quick Start

```bash
npm install
cp .env.example .env
npm run db:push
npm run db:seed
npm run dev
```

After startup:

- Web: `http://localhost:3000`
- API: `http://localhost:3001`
- Swagger: `http://localhost:3001/docs`

## Environment Variables

Use these templates as reference:

- Root shared template: `./.env.example`
- API-focused template: `./apps/api/.env.example`
- Web-focused template: `./apps/web/env.local.example`
- Prisma package template: `./packages/db/.env.example`
- Email package template: `./packages/email/.env.example`

Critical variables to set first:

- `DATABASE_URL`
- `AUTH_SECRET`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_API_URL`
- `FRONTEND_URL`

## API Documentation

- Swagger UI (local): `http://localhost:3001/docs`
- OpenAPI metadata configured in: `apps/api/src/server.ts`

## Stripe Local Webhook Testing

```bash
stripe listen --forward-to http://localhost:3001/api/checkout/webhook
```

Test cards:

- Success: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- 3DS: `4000 0025 0000 3155`

## Test Accounts (after seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@slicing-edge.com | admin123456 |
| Customer | customer@example.com | customer123456 |

## Engineering Guidelines (Portfolio)

- `agent.md` — project architecture and coding conventions.
- `.windsurf/skills/*.md` — focused implementation rules.
- `docs/engineering/README.md` — rationale/index for engineering docs.

## License

MIT
