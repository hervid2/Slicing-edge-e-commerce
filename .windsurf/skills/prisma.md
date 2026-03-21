# Prisma Skill Rules

## Schema & Migrations
- Treat `schema.prisma` as source of truth.
- Use explicit migrations for schema changes; do not rely on ad-hoc DB drift.
- Name migrations clearly by domain intent.

## Query Patterns
- Select only needed fields (`select`) to reduce payload size.
- Use `include` intentionally; avoid deep eager loading by default.
- Wrap multi-step write workflows in transactions when atomicity matters.

## Data Integrity
- Enforce uniqueness and relations in schema, not only application logic.
- Use optimistic concurrency fields (for this project, `Product.version`) where required.
- Persist order snapshots for historical correctness (name/price/image at purchase time).

## Validation & Boundaries
- Validate inputs with shared Zod schemas before Prisma calls.
- Keep repository/service boundaries clean: controller -> service -> repository.
- Map Prisma errors to domain-friendly/API-safe errors.

## Performance & Operations
- Avoid N+1 query patterns; batch reads when feasible.
- Use pagination for list endpoints (cursor or offset per use-case).
- Log slow queries/context in structured logs without leaking secrets.
