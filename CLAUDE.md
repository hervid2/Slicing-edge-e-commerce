# Claude Code — Slicing Edge Instructions

## Mandatory context loading

At the start of **every** conversation and before every iteration, read the following files without exception:

### Project overview & conventions
- `agent.md` — stack, design system, architecture, code conventions, shipping model

### Engineering docs
- `docs/engineering/ROADMAP.md` — implementation roadmap with daily checkboxes (source of truth for what is done and what is next)
- `docs/engineering/README.md` — engineering notes and decisions

### Framework & library skills
- `.windsurf/skills/nextjs.md` — Next.js 15 App Router patterns used in this project
- `.windsurf/skills/prisma.md` — Prisma ORM conventions and patterns used in this project
- `.windsurf/skills/stripe.md` — Stripe Checkout / Webhooks integration patterns
- `.windsurf/skills/tailwind-shadcn-fastify.md` — Tailwind v4 + Fastify conventions

## Workflow

1. Read all files listed above before proposing or writing any code.
2. When implementing a roadmap day: check current checkbox state in `ROADMAP.md`, implement only what is unchecked, mark completed items `[x]`, and finish with a suggested git commit message.
3. Follow every convention in `agent.md` (Controller → Service → Repository, Zod validation, Pino logging, JSDoc on public functions, WCAG 2.1 AA, mobile-first).
4. Never expose API keys on the client side.
5. At the end of each roadmap day iteration, always provide a suggested commit message.
