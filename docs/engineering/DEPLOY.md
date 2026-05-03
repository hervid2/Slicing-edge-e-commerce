# Slicing Edge — Deploy Guide

Production deployment: **API → Railway** | **Web → Vercel** | **DB → Railway PostgreSQL (or Neon)**

---

## Architecture overview

```
Vercel (Next.js)  ──→  Railway (Fastify API)  ──→  Railway PostgreSQL
                                ↑
                         Upstash Redis
                         local /uploads/ (product images)
                         Stripe (webhooks)
                         Resend (email)
                         Groq AI (chatbot)
```

---

## 1. Database — Railway PostgreSQL

### Create the database

1. In Railway dashboard → **New project** → **Provision PostgreSQL**
2. Copy the `DATABASE_URL` from the **Variables** tab of the PostgreSQL service.
   Format: `postgresql://user:password@host:port/railway`

### Run migrations

```bash
# From the repo root — runs `prisma migrate deploy` against DATABASE_URL
DATABASE_URL="postgresql://..." npm run db:migrate:deploy

# Then seed production data (categories + products with real images)
DATABASE_URL="postgresql://..." npm run db:seed:prod
```

> **Note:** `prisma migrate deploy` applies all pending migrations without creating new ones. Always run this before starting the API in production.

---

## 2. API — Railway

### Setup steps

1. In Railway dashboard → **New service** → **GitHub repo** → select this repo
2. Railway auto-detects `railway.toml` at the root and uses `apps/api/Dockerfile`
3. Set **Root Directory** to `/` (monorepo root — the Dockerfile needs the full context)

### Environment variables (Railway → Service → Variables)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string from Railway DB service |
| `AUTH_SECRET` | ✅ | 32+ char secret — generate with `npx auth secret` |
| `STRIPE_SECRET_KEY` | ✅ | Stripe secret key (`sk_live_...` or `sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | ✅ | From Stripe Dashboard → Webhooks → Signing secret |
| `FRONTEND_URL` | ✅ | Production Vercel URL, e.g. `https://slicing-edge.vercel.app` |
| `ALLOWED_ORIGINS` | ✅ | CSV of allowed CORS origins, e.g. `https://slicing-edge.vercel.app` |
| `RESEND_API_KEY` | ✅ | From Resend dashboard |
| `RESEND_FROM_EMAIL` | ✅ | Verified sender, e.g. `noreply@slicing-edge.com` |
| `UPSTASH_REDIS_REST_URL` | ⚡ | Upstash Redis REST URL (recommended for multi-instance) |
| `UPSTASH_REDIS_REST_TOKEN` | ⚡ | Upstash Redis REST token |
| `GROQ_API_KEY` | 🤖 | Required only if AI chatbot is enabled |
| `PORT` | — | Defaults to `3001`; Railway sets `PORT` automatically |
| `NODE_ENV` | — | Set to `production` |
| `LOG_LEVEL` | — | Recommended: `info` |

> **Note on `STRIPE_SECRET_KEY`:** this key is used both for creating Checkout Sessions and for issuing automatic refunds when a return request transitions to `REFUNDED` status. Without it, refunds must be processed manually from the Stripe Dashboard.

### Stripe webhook endpoint

After deploy, register the webhook in Stripe Dashboard:
- **URL:** `https://<railway-api-url>/api/checkout/webhook`
- **Events:** `checkout.session.completed`, `payment_intent.payment_failed`

---

## 3. Web — Vercel

### Setup steps

1. In Vercel dashboard → **Add New Project** → import GitHub repo
2. Set **Root Directory** to `apps/web`
3. Vercel detects Next.js automatically; `vercel.json` overrides the build command to run Turbo

### Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | ✅ | Railway API URL, e.g. `https://api.slicing-edge.up.railway.app` |
| `NEXT_PUBLIC_APP_URL` | ✅ | This web app's canonical URL — used for OG images, sitemaps |
| `AUTH_SECRET` | ✅ | Same secret as the API (`npx auth secret`) |
| `AUTH_URL` | ✅ | Production web URL, e.g. `https://slicing-edge.vercel.app` |
| `AUTH_GOOGLE_ID` | ✅ | Google OAuth client ID |
| `AUTH_GOOGLE_SECRET` | ✅ | Google OAuth client secret |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | ✅ | Stripe publishable key (`pk_live_...`) |

> **Google OAuth redirect URI:** Add `https://slicing-edge.vercel.app/api/auth/callback/google`
> to your Google Cloud Console OAuth 2.0 credentials.

---

## 4. CI/CD — GitHub Actions

The pipeline at `.github/workflows/deploy.yml` runs on every push to `main`:

```
push → test → build → deploy-api (Railway) ─┐
                     → deploy-web (Vercel)  ─┴→ smoke-test
```

### Required GitHub secrets

Go to **Settings → Secrets and variables → Actions** and add:

| Secret | Where to find it |
|--------|-----------------|
| `RAILWAY_TOKEN` | Railway → Account Settings → Tokens |
| `RAILWAY_SERVICE_ID` | Railway → service URL (`railway.app/project/.../service/<ID>`) |
| `VERCEL_TOKEN` | Vercel → Settings → Tokens |
| `VERCEL_ORG_ID` | Run `vercel link` locally → `.vercel/project.json → orgId` |
| `VERCEL_PROJECT_ID` | Run `vercel link` locally → `.vercel/project.json → projectId` |
| `DATABASE_URL` | Railway PostgreSQL → Variables tab |

---

## 5. Stripe webhook — staging setup

1. In Stripe Dashboard → **Developers → Webhooks → Add endpoint**
2. **Endpoint URL:** `https://<railway-staging-url>/api/checkout/webhook`
3. **Events to send:**
   - `checkout.session.completed`
   - `payment_intent.payment_failed`
4. Copy the **Signing secret** → set as `STRIPE_WEBHOOK_SECRET` in Railway variables

> For local testing use `stripe listen --forward-to localhost:3001/api/checkout/webhook`.

---

## 6. Custom domain (optional)

### Vercel
1. Vercel project → **Settings → Domains** → add `slicing-edge.com`
2. Add DNS records as shown by Vercel (CNAME or A record)
3. Update `NEXT_PUBLIC_APP_URL`, `AUTH_URL`, and `ALLOWED_ORIGINS` with the new domain

### Railway
1. Railway service → **Settings → Networking → Custom Domain** → add `api.slicing-edge.com`
2. Add CNAME `api` → Railway-provided hostname in your DNS provider
3. Update `NEXT_PUBLIC_API_URL` in Vercel with the new API domain

---

## 7. Deployment checklist

### Pre-deploy

- [ ] All environment variables set on both Railway and Vercel
- [ ] GitHub Actions secrets set (`RAILWAY_TOKEN`, `RAILWAY_SERVICE_ID`, `VERCEL_TOKEN`, etc.)
- [ ] Stripe webhook registered and `STRIPE_WEBHOOK_SECRET` updated
- [ ] Google OAuth redirect URIs updated with production URL
- [ ] Resend sender domain verified

### Database

- [ ] `npm run db:migrate:deploy` executed successfully
- [ ] `npm run db:seed:prod` executed (optional — seeds demo products)

### Post-deploy smoke tests

Run manually: `API_URL=https://... WEB_URL=https://... bash scripts/smoke-test.sh`

Or wait for the GitHub Actions `smoke-test` job to run automatically after each deploy.

Key checks:
- [ ] `GET /api/health` returns `{ status: "ok" }`
- [ ] Homepage loads with products
- [ ] Product detail page loads with images
- [ ] User registration → welcome email received
- [ ] Guest cart → Stripe checkout → order created
- [ ] Stripe webhook triggers order confirmation email
- [ ] Admin login → dashboard metrics visible
- [ ] Admin orders → change status to SHIPPED → tracking number + carrier inputs appear → save → shipping email sent
- [ ] Customer `/account/orders` → DELIVERED order shows "Request Return" button → modal submits → confirmation shown
- [ ] Admin returns → return request appears → status updated to APPROVED → customer email triggered
- [ ] Admin returns → status updated to REFUNDED → Stripe refund issued (verify in Stripe Dashboard → Payments → Refunds)
- [ ] AI chatbot responds

---

## 8. Updating production images

The production seed uses Unsplash CDN images as placeholders. To replace with real product photos:

1. Log into the admin panel → Products → Edit
2. Click **Choose image** and select a file from your computer (JPG, PNG, WebP, GIF or AVIF, max 10 MB)
3. The image is uploaded via `POST /api/admin/upload` (multipart/form-data) and stored in the API's `public/uploads/products/` directory
4. The generated URL (`/uploads/products/<uuid>.<ext>`) is saved to the product record in the database

> **Persistence on Railway:** Railway's filesystem resets on each deploy. To keep uploaded images between deploys, add a **Railway Volume** mounted at `/app/public/uploads` in your service settings. Alternatively, swap `UploadService.saveFile()` for an S3-compatible client (e.g. AWS S3, Cloudflare R2) — no other code changes needed.

---

## 9. Rollback

Railway keeps previous deployments — click **Rollback** in the deploy history.
Vercel keeps previous deployments — click **Promote** on any previous deployment.

For database rollbacks, use `prisma migrate resolve` to mark a migration as rolled back,
then manually revert schema changes. Always back up before deploying breaking schema changes.
