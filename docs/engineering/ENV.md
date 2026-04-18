# Slicing Edge — Environment Variables Reference

Complete reference for all environment variables across the monorepo. Use the `.env.example` templates as a starting point — never commit real secrets.

---

## Templates

| Location | Purpose |
|----------|---------|
| `.env.example` | Root shared defaults (used as a base) |
| `apps/api/.env.example` | API runtime configuration |
| `apps/web/env.local.example` | Next.js web configuration |
| `packages/db/.env.example` | Prisma package (migrations, seed) |
| `packages/email/.env.example` | Email package (Resend) |

---

## Variables by Service

### Database

| Variable | Services | Required | Description |
|----------|----------|----------|-------------|
| `DATABASE_URL` | API, Web (Auth.js), DB package | ✅ | PostgreSQL connection string. Format: `postgresql://user:password@host:5432/dbname?schema=public` |

**Production (Railway):** copy from Railway PostgreSQL service → Variables tab.

**Development:** local PostgreSQL instance, e.g.:
```
DATABASE_URL="postgresql://postgres:password@localhost:5432/slicing_edge?schema=public"
```

---

### Auth.js (NextAuth)

| Variable | Service | Required | Description |
|----------|---------|----------|-------------|
| `AUTH_SECRET` | Web, API | ✅ | Signs JWT/session tokens. Generate with `npx auth secret`. Must be 32+ chars. |
| `AUTH_URL` | Web | ✅ | Base URL of the web app. `http://localhost:3000` in dev, `https://your-domain.vercel.app` in production. |
| `AUTH_GOOGLE_ID` | Web | Optional | Google OAuth client ID from Google Cloud Console. |
| `AUTH_GOOGLE_SECRET` | Web | Optional | Google OAuth client secret. |

> `AUTH_SECRET` must be the same value in both `apps/api` and `apps/web` — the API verifies JWT tokens signed by Auth.js.

---

### Stripe

| Variable | Service | Required | Description |
|----------|---------|----------|-------------|
| `STRIPE_SECRET_KEY` | API | ✅ | Server-side only. `sk_test_...` (test) or `sk_live_...` (production). Never expose to browser. |
| `STRIPE_WEBHOOK_SECRET` | API | ✅ | From Stripe Dashboard → Webhooks → signing secret (`whsec_...`). Local: use `stripe listen` output. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Web | ✅ | Safe to expose to browser (`pk_test_...` or `pk_live_...`). |

**Local webhook testing:**
```bash
stripe listen --forward-to http://localhost:3001/api/checkout/webhook
# Copy the whsec_... value shown and set it as STRIPE_WEBHOOK_SECRET
```

**Production webhook URL:**
```
https://<railway-api-url>/api/checkout/webhook
# Events to subscribe: checkout.session.completed, payment_intent.payment_failed
```

---

### Resend (Email)

| Variable | Services | Required | Description |
|----------|----------|----------|-------------|
| `RESEND_API_KEY` | API, Email package | Optional | From resend.com dashboard. When absent, emails fall back to structured Pino logs. |
| `RESEND_FROM_EMAIL` | API, Email package | Optional | Verified sender address, e.g. `noreply@yourdomain.com`. Required when `RESEND_API_KEY` is set. |

> To verify a sender domain, go to Resend Dashboard → Domains and add the required DNS records.

---

### Cloudinary (Image Uploads)

| Variable | Service | Required | Description |
|----------|---------|----------|-------------|
| `CLOUDINARY_CLOUD_NAME` | API | ✅ | From Cloudinary Dashboard → Account Details. |
| `CLOUDINARY_API_KEY` | API | ✅ | From Cloudinary Dashboard → API Keys. |
| `CLOUDINARY_API_SECRET` | API | ✅ | Never expose to browser. Kept server-side (API) only. |

Used by `POST /api/admin/upload` to upload product images. Uploaded URLs are stored in `Product.images`.

---

### Groq (AI Chatbot)

| Variable | Service | Required | Description |
|----------|---------|----------|-------------|
| `GROQ_API_KEY` | API | ✅ | From console.groq.com → API Keys. Server-side only — never sent to browser. Free tier available. |

Used by `POST /api/chatbot`. The API holds the key and proxies all Groq (Llama 3.3 70B) calls.

---

### Upstash Redis (Rate Limiting)

| Variable | Service | Required | Description |
|----------|---------|----------|-------------|
| `UPSTASH_REDIS_REST_URL` | API | Optional | From Upstash Console → Database → REST API. |
| `UPSTASH_REDIS_REST_TOKEN` | API | Optional | From Upstash Console → Database → REST API. |

When absent, the API falls back to in-memory `@fastify/rate-limit` (suitable for single-instance dev). Upstash is required for multi-instance production deployments.

---

### App URLs

| Variable | Service | Required | Description |
|----------|---------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Web | ✅ | Full URL to the Fastify API. `http://localhost:3001` in dev, Railway URL in production. `NEXT_PUBLIC_` prefix exposes it to the browser (safe — it is a URL, not a secret). |
| `FRONTEND_URL` | API | ✅ | Full URL of the web app. Used for Stripe success/cancel redirect URLs and CORS. |
| `ALLOWED_ORIGINS` | API | ✅ in prod | Comma-separated list of allowed CORS origins. Overrides `FRONTEND_URL`. Example: `https://slicing-edge.vercel.app,https://preview.slicing-edge.vercel.app` |

---

### API Server

| Variable | Service | Required | Description |
|----------|---------|----------|-------------|
| `PORT` | API | Optional | HTTP port for Fastify. Defaults to `3001`. Railway injects its own `PORT`. |
| `HOST` | API | Optional | Bind address. `0.0.0.0` required inside Docker/Railway. |
| `NODE_ENV` | API | Optional | `development` or `production`. Affects logging format and error detail. |
| `LOG_LEVEL` | API | Optional | Pino log level: `trace`, `debug`, `info`, `warn`, `error`. Default: `info`. |

---

## Production Secrets Checklist

Before deploying, ensure all of these are set in the Railway (API) and Vercel (Web) dashboards:

### Railway (API)

- [ ] `DATABASE_URL`
- [ ] `AUTH_SECRET`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `FRONTEND_URL`
- [ ] `ALLOWED_ORIGINS`
- [ ] `RESEND_API_KEY`
- [ ] `RESEND_FROM_EMAIL`
- [ ] `CLOUDINARY_CLOUD_NAME`
- [ ] `CLOUDINARY_API_KEY`
- [ ] `CLOUDINARY_API_SECRET`
- [ ] `ANTHROPIC_API_KEY`
- [ ] `UPSTASH_REDIS_REST_URL`
- [ ] `UPSTASH_REDIS_REST_TOKEN`
- [ ] `NODE_ENV=production`
- [ ] `HOST=0.0.0.0`

### Vercel (Web)

- [ ] `DATABASE_URL`
- [ ] `AUTH_SECRET`
- [ ] `AUTH_URL` (production Vercel URL)
- [ ] `AUTH_GOOGLE_ID`
- [ ] `AUTH_GOOGLE_SECRET`
- [ ] `NEXT_PUBLIC_API_URL` (production Railway URL)
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### GitHub Actions (CI/CD)

| Secret | Used by |
|--------|---------|
| `RAILWAY_TOKEN` | Railway CLI deployment |
| `VERCEL_TOKEN` | Vercel CLI deployment |
| `VERCEL_ORG_ID` | Vercel project scoping |
| `VERCEL_PROJECT_ID` | Vercel project scoping |
| `DATABASE_URL` | `prisma migrate deploy` in CI |

---

## Security Notes

- **Never** commit `.env`, `.env.local`, or any file with real secrets.
- Variables prefixed `NEXT_PUBLIC_` are bundled into the browser build. Only use this prefix for non-sensitive values (public URLs, publishable keys).
- `STRIPE_SECRET_KEY`, `CLOUDINARY_API_SECRET`, and `ANTHROPIC_API_KEY` must live exclusively in `apps/api` — they are never passed to the frontend.
- Rotate `AUTH_SECRET` invalidates all active sessions. Coordinate with users before rotating in production.
