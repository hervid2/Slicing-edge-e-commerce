# syntax=docker/dockerfile:1
# ─────────────────────────────────────────────────────────────────────────────
# Slicing Edge API — Dockerfile for Railway
#
# Multi-stage build:
#   deps   → installs all npm workspace dependencies
#   runner → copies source + node_modules, generates Prisma client, runs tsx
#
# NOTE: Workspace packages (@slicing-edge/db, /shared, /email) use TypeScript
# source as their main entry. The API is started with `tsx` so TypeScript is
# resolved at runtime without a separate compile step.
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Copy workspace manifests first (better layer caching)
COPY package.json package-lock.json ./
COPY apps/api/package.json            ./apps/api/
COPY packages/config/                 ./packages/config/
COPY packages/db/package.json         ./packages/db/
COPY packages/shared/package.json     ./packages/shared/
COPY packages/email/package.json      ./packages/email/

# Install all dependencies (including devDeps for tsx)
RUN npm ci

# ── Stage 2: Production runner ─────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Root manifest (needed for workspace resolution)
COPY package.json ./

# Installed node_modules from deps stage (includes workspace symlinks + tsx)
COPY --from=deps /app/node_modules ./node_modules

# Workspace package sources (imported at runtime by tsx)
COPY packages/config/   ./packages/config/
COPY packages/db/       ./packages/db/
COPY packages/shared/   ./packages/shared/
COPY packages/email/    ./packages/email/

# API application source
COPY apps/api/ ./apps/api/

# Generate Prisma client for the target Linux platform inside the container
RUN cd packages/db && npx prisma generate

EXPOSE 3001

# Run with tsx so TypeScript workspace imports resolve without a compile step
CMD ["node_modules/.bin/tsx", "apps/api/src/server.ts"]
