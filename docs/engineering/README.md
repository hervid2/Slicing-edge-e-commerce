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

## Decisiones de arquitectura relevantes

### Gestión de imágenes de producto
Las imágenes se almacenan en el sistema de archivos local de la API (`apps/api/public/uploads/products/`) y se sirven como archivos estáticos vía `@fastify/static`. No se usa ningún CDN externo. En Railway, montar un Volume en `/app/public/uploads` preserva las imágenes entre deploys.

### Flujo de órdenes y estados de envío
El modelo `Order` tiene un `OrderStatus` enum con 5 estados (PENDING → PROCESSING → SHIPPED → DELIVERED → CANCELLED). La trazabilidad se implementa en `OrderStatusHistory`, una tabla append-only que registra cada transición, la nota del admin, y el `changedByAdminId` para auditabilidad. El campo `trackingNumber`/`carrierName` se persiste en la orden cuando el admin cambia el estado a SHIPPED.

### Flujo RMA (devoluciones)
`ReturnRequest` tiene 7 estados: `PENDING → APPROVED/REJECTED → LABEL_ISSUED → RECEIVED → REFUNDED → CLOSED`. La transición a `REFUNDED` llama automáticamente a `POST /v1/refunds` de la Stripe REST API (sin SDK — usando fetch con `STRIPE_SECRET_KEY`). Cada transición visible dispara un email transaccional al cliente vía Resend.

### Sin integración con APIs de transportistas
Los estados de envío los gestiona manualmente el admin. No hay webhooks entrantes de carriers. Esta decisión es apropiada para el volumen actual; cuando el negocio escale, se puede integrar un agregador (AfterShip, EasyPost) reemplazando el campo `trackingNumber` por una entidad `Shipment` con eventos propios.

## Notes

- Keep these files concise and implementation-focused.
- Never include secrets, personal API keys, or local-machine specifics.
- Prefer updating these guides when conventions change.
