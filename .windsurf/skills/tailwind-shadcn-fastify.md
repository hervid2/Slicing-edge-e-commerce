# Tailwind + shadcn/ui + Fastify Skill Rules

## Tailwind/shadcn UI
- Follow existing design tokens/colors and typography from project docs.
- Build mobile-first and scale up with responsive breakpoints.
- Keep utility class composition readable; extract reusable components when repeated.
- Ensure accessibility: visible focus states, semantic elements, and 44x44 touch targets.
- Use `cn()` utility for class merging/variant composition.

## Component Practices
- Keep components small and composable.
- Separate visual concerns from data-fetching concerns.
- Use skeleton/loading states for async UI and avoid layout shift.

## Fastify API Conventions
- Register plugins and routes with clear module boundaries.
- Use schema-driven validation and typed handlers.
- Keep controller -> service -> repository structure.
- Return consistent error shapes and proper HTTP status codes.

## Security & Reliability
- Add rate limiting where abuse risk exists.
- Sanitize/validate request payloads and params.
- Keep structured logs (Pino) and redact secrets/tokens/passwords.
- Prefer idempotent handlers for webhook or retry-prone flows.
