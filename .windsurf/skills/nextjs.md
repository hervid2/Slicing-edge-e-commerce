# Next.js (App Router) Skill Rules

## Architecture
- Prefer Server Components by default; add `"use client"` only when interactivity/browser APIs are required.
- Keep route segments colocated in `app/` and avoid cross-folder coupling.
- Use nested layouts for shared UI and loading boundaries.

## Data Fetching & Caching
- Fetch on the server whenever possible.
- For dynamic data, explicitly set cache behavior (`cache: "no-store"` or revalidation settings).
- Use route handlers (`app/api/*/route.ts`) for web endpoints on the web app side.

## Mutations
- Prefer Server Actions for UI-originated mutations when appropriate.
- Revalidate affected paths/tags after mutations.
- Validate input with shared Zod schemas before persistence.

## Rendering & UX
- Use `loading.tsx` and `error.tsx` boundaries per route segment.
- Use streaming-friendly layouts and avoid blocking the full page on slow subtrees.
- Use `next/image` for product/media rendering with explicit `sizes`.

## Security & Correctness
- Keep secrets server-side only.
- Never trust client input; validate on the server.
- Handle not-found states with `notFound()` and proper status behavior.

## Performance
- Avoid unnecessary client bundles; move logic to server components when possible.
- Use dynamic imports for heavy client-only modules.
- Keep metadata declarative with `generateMetadata` when route-aware.
