# Motion.dev — Visual Transitions Plan

> Approved implementation guide. Implement on a dedicated branch (e.g. `feature/motion-transitions`) and verify each phase by running `npm run dev` in `apps/web` in the browser before merging into `develop`. Do not merge without manually testing every item in the "Verification" section at the end of this document.

## Context

The project is functionally complete (roadmap 100% done, see [ROADMAP.md](ROADMAP.md)). The goal is to make the site feel less static by adding modern but sober animations/transitions, typical of a premium e-commerce site, using the `motion` library (motion.dev, the successor to framer-motion). Explicit requirement: **do not touch existing colors or layout/organization patterns** — this is purely additive work on top of the current visual system described in [agent.md](../../agent.md).

Current state of the code (confirmed via direct exploration, prior to this plan):
- No animation library is installed yet (`apps/web/package.json` has no `framer-motion`, `motion`, `tailwindcss-animate`, or similar).
- The only "page transition" today is a global `@keyframes page-in` in `apps/web/src/app/globals.css` (lines 62-76) — fade + translateY applied to every `<main>`, with no exit animation and no respect for `prefers-reduced-motion`.
- The rest of the interactivity is loose Tailwind transitions (`hover:scale-105`, `transition-all duration-300`, etc.) spread across ~44 files.
- There is no shared Dialog/Modal component: every modal (search, chat, return-request, admin modals) is hand-built with its own backdrop, with no enter/exit animation.
- `apps/web/src/components/ui/toast.tsx` hand-rolls its own animation with `useState` + `requestAnimationFrame` + `setTimeout`.

Three cumulative tiers of ambition were evaluated (all using `motion`, all respecting colors/layout/WCAG 2.1 AA):
1. Micro-interactions (hover/tap with spring physics)
2. + Editorial scroll reveal (fade+stagger on viewport entry)
3. + Page and modal transitions (AnimatePresence between routes, enter/exit modals)

**Full Tier 3 was approved** (includes tiers 1 and 2). This document covers the implementation of all three tiers and is the strict guide to follow in the next iteration.

## Package and installation

Install `motion` (not `framer-motion`) in `apps/web`: `npm install motion --workspace=apps/web`. Import: `from "motion/react"`. It's a client-only library — every file that uses it needs `'use client'`.

---

## Phase 0 — Foundation (zero risk, do first)

**New `apps/web/src/lib/motion-variants.ts`** — a single file with the shared variants/springs so all 3 tiers use the same sober "motion language" instead of ad-hoc numbers per file:
- `SPRING` (stiffness 400, damping 30), `springHover` (scale 1.02), `springPress` (scale 0.97)
- `fadeUpVariants`, `staggerContainerVariants` (for Tier 2)
- `pageVariants` (for Tier 3, page transitions)
- `modalBackdropVariants`, `modalPanelVariants` (for Tier 3, modals)

**New `apps/web/src/components/motion/motion-root.tsx`** — `'use client'`, wraps everything in `<MotionConfig reducedMotion="user">`. This is the global accessibility switch: it disables transform-based animations when the OS has `prefers-reduced-motion: reduce`, satisfying the project's WCAG 2.1 AA convention without wiring each component individually.

**Edit `apps/web/src/app/layout.tsx`** — wrap the entire provider tree (`AuthSessionProvider` downward) in `<MotionRoot>`. It must be the outermost wrapper because `ToastProvider` renders `<Toaster/>` as a *sibling*, not a descendant — if `MotionRoot` doesn't wrap the full tree, toasts are left out of `MotionConfig`. `layout.tsx` stays a Server Component; `MotionRoot` is a Client Component receiving server-rendered children, the same pattern the existing providers already use.

Note: `MotionConfig reducedMotion="user"` does **not** cover imperative calls (`animate()`, `useMotionValue()`) — the animated counter in Tier 2 needs its own `useReducedMotion()` check.

---

## Tier 1 — Micro-interactions

| File | Change |
|---|---|
| `components/ui/button.tsx` | `<button>` → `<motion.button>`, same cva-generated `className` untouched, add `whileHover`/`whileTap` from `motion-variants.ts`. Doesn't have `'use client'` yet; add it (verified zero-risk: every current importer is already a Client Component). |
| `components/product/product-card.tsx` | Outer container: change `transition-all` → `transition-colors` (avoids the CSS transition fighting the `transform` Motion animates per-frame) and replace `hover:-translate-y-0.5` with Motion's `whileHover={{ y: -4 }}`. **Leave the image zoom (`group-hover:scale-105` on `next/image`) as pure CSS** — don't wrap `next/image` in Motion, it's fragile against next/image internals and adds nothing over what already works. Wishlist heart: `whileTap={{ scale: 0.85 }}` + a scale pop when toggled. |
| `components/product/wishlist-button.tsx` | Same heart treatment as above (duplicated today with product-card; optionally extract to `components/motion/animated-heart.tsx` to avoid the duplication). |
| `components/layout/cart-button.tsx` | Count badge: `AnimatePresence` for the appear/disappear pop at the 0↔1 threshold, plus a second `AnimatePresence mode="popLayout"` keyed by `count` so each quantity change gets a small "pop". |
| `components/ui/toast.tsx` | Replace the `useState` + `requestAnimationFrame` + `setTimeout` hack with a `motion.div` using `initial/animate/exit` + `layout`, wrapping the list in `AnimatePresence`. This simplifies things: `onDismiss` can be called directly, no more manual timeout. |

---

## Tier 2 — Scroll reveal

**New `apps/web/src/components/motion/reveal.tsx`** (`'use client'`) — two exports:
- `Reveal`: `motion.div` with `whileInView` + `viewport={{ once: true }}` + `fadeUpVariants`, for individual blocks (hero, sections).
- `RevealStagger`: a container with `staggerContainerVariants` that automatically wraps each direct child in a `motion.div` with `fadeUpVariants` — so callers pass plain JSX (e.g. a `.map()` of `ProductCard`) without marking each child manually.

Server Component pages (`app/page.tsx`, `app/products/[slug]/page.tsx`) can pass their server-rendered JSX as children into these Client Components without issue — it's the same pass-through pattern the providers already use.

**New `apps/web/src/components/motion/animated-counter.tsx`** (`'use client'`) — counts from 0 to the real value with `useMotionValue`/`animate()`. Must explicitly call `useReducedMotion()` and, if true, set the final value without animating.

Adoption points:
- `app/page.tsx`: hero in `<Reveal>`, "Our Collections" grid and Value Props in `<RevealStagger>`
- `app/products/page.tsx` and `app/wishlist/page.tsx`: product grid in `<RevealStagger>`
- `app/products/[slug]/page.tsx`: gallery and info in `<Reveal>` (with staggered delay)
- `app/faq/faq-accordion.tsx`: rows in `<RevealStagger>`
- `app/admin/admin-dashboard-metrics.tsx`: KPI cards in `<RevealStagger>` + `AnimatedCounter`. Requires a small refactor: KPIs today are pre-formatted strings; they need to become `{ rawValue: number | null, format }` so they can be animated.

---

## Tier 3 — Page and modal transitions

### 3.1 Route (page) transitions

**New `apps/web/src/components/motion/page-transition.tsx`** (`'use client'`) — `usePathname()` as the `AnimatePresence mode="wait"` key, wrapping `children` in a `motion.div` with `pageVariants`.

**Edit `apps/web/src/app/layout.tsx`** — `<main>{children}</main>` → `<main><PageTransition>{children}</PageTransition></main>`.

Design decision: use a client wrapper inside `layout.tsx` (persists across navigations) instead of `template.tsx` (Next recreates it on every navigation, which can cut the exit animation short before it finishes).

`mode="wait"` is deliberate: the site's pages have very different heights (hero-heavy home vs. dense grids vs. product detail), and `mode="wait"` avoids layout jumps by not cross-fading two pages of very different heights simultaneously. Cost: ~150-250ms of extra perceived navigation latency.

**Edit `globals.css`** — remove the `@keyframes page-in` and the `main { animation: page-in… }` rule once `PageTransition` is live (to avoid double-animating, and because the current CSS version already violates `prefers-reduced-motion`).

⚠️ **This is the highest-uncertainty point in the plan** — the reliability of the exit animation against Next 15 App Router streaming/commit timing can't be verified without testing it live. Implement it first as an isolated spike (test 2-3 route pairs) before continuing with the rest of Tier 3; if it isn't reliable, the fallback is to keep the current CSS `page-in` and skip this item — the rest of Tier 3 is independent.

### 3.2 Modals with enter/exit animation

**New `apps/web/src/components/ui/motion-modal.tsx`** — shared primitive (backdrop fade + panel scale/slide) that replaces the duplicated backdrop+panel+Escape logic in the existing modals. No `open` prop or internal `AnimatePresence`: each call site keeps its current `{condition && <Modal/>}` render, and the parent wraps that render in `<AnimatePresence>` — this preserves the "fresh mount per open" behavior they already have (autofocus, search state reset, etc.).

Call sites to migrate (current backdrop+panel replaced with `<MotionModal>`, conditional render wrapped in `<AnimatePresence>` from the parent):
- `components/search/search-modal.tsx` (+ `header.tsx` where it's conditionally rendered)
- `components/admin/admin-search-modal.tsx`
- `app/account/orders/return-request-modal.tsx`
- `app/admin/users/admin-users-client.tsx` (InviteModal, DeleteConfirm)
- `app/admin/categories/admin-categories-client.tsx`
- `app/admin/faq/admin-faq-client.tsx`
- `app/admin/contact/admin-contact-client.tsx`
- `components/chatbot/chat-widget.tsx` — different layout (full-screen mobile / floating card desktop), doesn't fit `MotionModal`; animate it with its own `motion.div` reusing the same backdrop variants.

Out of scope (not explicitly requested, mentioned but not touched now): the inline cancel-order confirmation in `app/orders/page.tsx` (not an overlay, it's an expanding section) and `mobile-nav.tsx` (same instant mount/unmount pattern, a candidate for a future pass).

### 3.3 Shared-element transition (ProductCard → Product Detail)

**Recommendation: don't implement now, mark as deferred.** Motion's `layoutId` technique needs the old and new elements to briefly coexist in the tree to interpolate — but `mode="wait"` (chosen in 3.1 to avoid layout jumps between routes of very different heights) fully unmounts the old page before mounting the new one, so there would be no "from box" to animate. Fixing this would reopen the layout-jump problem `mode="wait"` was meant to avoid. If revisited in the future, the more promising path is Next.js's native View Transitions API (experimental), not Motion's `layoutId` — but that's a separate feature, outside the scope of "use motion.dev".

---

## Suggested implementation order

1. Phase 0 (foundation) — verify `type-check` passes, zero visual change
2. Tier 1, one component at a time: Button → ProductCard/WishlistButton → CartButton → Toast
3. Tier 2: `Reveal`/`RevealStagger`/`AnimatedCounter`, page by page
4. Tier 3a (page transitions) — test as an isolated spike on 2-3 route pairs before continuing
5. Tier 3b (MotionModal) — migrate modal by modal, re-verifying Escape/backdrop-click after each one
6. Tier 3c (layoutId) — skip/defer

## Risks and open questions

- Exit-animation reliability for page transitions (3.1) — can't be verified without running it live, treat as a spike.
- `mode="wait"` (needed for 3.1) and shared-element transitions (3.3) are in direct tension — this is why 3.3 is recommended deferred.
- `transition-all` → `transition-colors` on ProductCard is a small but real CSS change (not 100% "purely additive"), necessary for the hover to feel like a single spring instead of two competing easings.
- The admin dashboard KPI refactor (Tier 2) is a real data-structure change, not just a visual wrapper — budget time for it.

## Verification

No automated UI tests exist in this project for animations — verify live with `npm run dev` in `apps/web`, per phase, on a dedicated branch before merging:
- Tier 1: hover/press on buttons and cards, add/remove cart items across the 0↔1 boundary, trigger success/error/info toasts and verify auto-dismiss + manual dismiss
- Tier 2: scroll through each adopted page; also turn off OS-level animations (Windows: Settings → Accessibility → Visual effects) and confirm `prefers-reduced-motion` is respected without breaking layout
- Tier 3a: navigate between home→products→detail→cart, confirm the exit animation plays fully
- Tier 3b: open/close each migrated modal with mouse, Escape, and backdrop click
- `npm run type-check` after touching `button.tsx` (prop type change when switching to `motion.button`)
