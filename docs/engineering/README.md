# Engineering Guidelines

This folder contains project-facing engineering standards intended for collaborators and recruiters reviewing this portfolio repository.

## What lives here

- `../../agent.md`: high-level project architecture and coding conventions.
- `../../.windsurf/skills/*.md`: focused rulesets for key technologies used in this project.
- `./ROADMAP.md`: full project roadmap from current state to production deploy (week-by-week, day-by-day).

## Current skill packs

- `../../.windsurf/skills/nextjs.md`
- `../../.windsurf/skills/prisma.md`
- `../../.windsurf/skills/tailwind-shadcn-fastify.md`
- `../../.windsurf/skills/stripe.md`

## Why this is versioned

- Documents engineering decision criteria.
- Shows consistency in architecture and code quality standards.
- Makes AI-assisted collaboration explicit and auditable.

## Relevant architecture decisions

### Product image management
Images are stored on the API's local filesystem (`apps/api/public/uploads/products/`) and served as static files via `@fastify/static`. No external CDN is used. On Railway, mounting a Volume at `/app/public/uploads` preserves images across deploys.

### Order flow and shipping states
The `Order` model has an `OrderStatus` enum with 5 states (PENDING → PROCESSING → SHIPPED → DELIVERED → CANCELLED). Traceability is implemented in `OrderStatusHistory`, an append-only table that records each transition, the admin's note, and `changedByAdminId` for auditability. The `trackingNumber`/`carrierName` fields are persisted on the order when the admin changes the status to SHIPPED.

### RMA flow (returns)
`ReturnRequest` has 7 states: `PENDING → APPROVED/REJECTED → LABEL_ISSUED → RECEIVED → REFUNDED → CLOSED`. The transition to `REFUNDED` automatically calls `POST /v1/refunds` on the Stripe REST API (no SDK — uses fetch with `STRIPE_SECRET_KEY`). Every visible transition triggers a transactional email to the customer via Resend.

The flow can be started two ways: (1) the customer submits the form at `/account/orders` (requires the order to be in DELIVERED status), or (2) the admin starts it from the orders panel via `POST /api/admin/orders/:id/return`, which skips the email verification and takes the customer's contact info directly from the order record. This second path covers cases like returns requested by phone, packages returned without a prior request, or dispatch errors caught by the internal team.

### No carrier API integration
Shipping states are managed manually by the admin. There are no inbound carrier webhooks. This decision is appropriate for the current volume; when the business scales, an aggregator (AfterShip, EasyPost) can be integrated by replacing the `trackingNumber` field with a `Shipment` entity that has its own events.

## Notes

- Keep these files concise and implementation-focused.
- Never include secrets, personal API keys, or local-machine specifics.
- Prefer updating these guides when conventions change.
