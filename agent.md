# Slicing Edge — Agent Instructions

## Project Overview
E-commerce platform for premium kitchen knives. Turborepo monorepo with Next.js 15 frontend and Fastify backend.

## Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Zustand, TanStack Query
- **Backend**: Fastify 5, TypeScript, Prisma ORM, PostgreSQL
- **Auth**: Auth.js v5 (NextAuth) — email/password + Google OAuth, JWT strategy
- **Payments**: Stripe Checkout Sessions + Webhooks, Stripe Tax
- **Email**: Resend + React Email
- **Images**: Cloudinary CDN + Next.js `<Image>`
- **Rate Limiting**: Upstash Redis + `@upstash/ratelimit`
- **Validation**: Zod (shared schemas in `packages/shared`)
- **Logging**: Pino (structured, with redaction)
- **AI Chatbot**: Groq API — Llama 3.3 70B (server-side only, tool-use pattern)

## Design System
- **Primary**: `#1A3A2A` (deep forest green)
- **Primary Light**: `#2D5A3F`
- **Accent / CTA**: `#3D8B4F` (vibrant green)
- **Background**: `#C5CFC6` (sage green)
- **Surface**: `#FFFFFF`
- **Foreground**: `#1A1A1A`
- **Heading Font**: Playfair Display (serif)
- **Body Font**: Inter (sans-serif)

## Architecture
- `apps/web` — Next.js frontend (deploys to Vercel)
- `apps/api` — Fastify REST API (deploys to Railway)
- `packages/db` — Prisma schema, client, seed
- `packages/shared` — Zod schemas, constants, types
- `packages/email` — React Email templates + Resend
- `packages/config` — Shared TypeScript configs

## Code Conventions
- Controller → Service → Repository pattern on the backend
- All validation via Zod schemas from `@slicing-edge/shared`
- Never expose API keys on the client
- Use `cn()` utility for Tailwind class merging
- Structured logging with Pino — redact passwords/tokens
- Optimistic locking on Product.version for stock management
- Order snapshots: store product name/price/image at time of purchase
- Every new module must include maintainable documentation: JSDoc for public functions/services and schema metadata for API endpoints.
- Mobile-first responsive design (min-width breakpoints)
- WCAG 2.1 AA accessibility: aria labels, focus rings, min 44×44px touch targets

## Shipping Model
- Flat rate: $9.99
- Free shipping on orders over $75
