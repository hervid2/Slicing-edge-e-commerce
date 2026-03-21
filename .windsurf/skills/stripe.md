# Stripe Skill Rules

## Checkout & Payments
- Create Checkout Sessions server-side only.
- Never expose secret keys to the client.
- Store Stripe IDs (`customer`, `session`, `payment_intent`) for traceability.

## Webhooks
- Verify webhook signatures before processing events.
- Make webhook handlers idempotent (safe for retries/duplicates).
- Persist event processing state to prevent double-fulfillment.

## Amounts, Currency, Tax
- Use integer minor units for amounts (e.g., cents).
- Keep currency explicit and consistent across order lifecycle.
- Use Stripe Tax configuration when enabled and persist tax breakdown with the order snapshot.

## Failure Handling
- Distinguish payment-required, declined, canceled, and processing states.
- Surface actionable user messages while logging full diagnostic details server-side.
- Reconcile asynchronous final states from webhooks instead of trusting redirect-only success.

## Security & Operations
- Rotate keys via environment variables and keep them out of source.
- Log request IDs/event IDs for support and auditing.
- Use test clocks or fixtures for repeatable payment-flow testing.
