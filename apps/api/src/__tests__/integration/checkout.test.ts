import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from '../helpers/build-test-app';
import { createMockPrisma } from '../helpers/mock-prisma';

const VALID_SHIPPING_ADDRESS = {
  fullName: 'Alice Test',
  street: '123 Main St',
  city: 'Springfield',
  state: 'IL',
  zipCode: '62701',
  country: 'US',
};

describe('Checkout routes', () => {
  let app: FastifyInstance;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeAll(async () => {
    ({ app, prisma } = await buildTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── POST /api/checkout ─────────────────────────────────────────────────────

  describe('POST /api/checkout', () => {
    it('returns 400 when the request body is empty', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/checkout',
        headers: { 'content-type': 'application/json', 'x-session-id': 'test-sess' },
        body: JSON.stringify({}),
      });

      expect(response.statusCode).toBe(400);
    });

    it('returns 400 when shippingAddress is missing required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/checkout',
        headers: { 'content-type': 'application/json', 'x-session-id': 'test-sess' },
        body: JSON.stringify({
          shippingAddress: { fullName: 'Alice' }, // missing street, city, etc.
        }),
      });

      expect(response.statusCode).toBe(400);
    });

    it('returns 400 when the cart is empty', async () => {
      prisma.cart.findFirst.mockResolvedValue({ id: 'cart_1', items: [] });

      const response = await app.inject({
        method: 'POST',
        url: '/api/checkout',
        headers: { 'content-type': 'application/json', 'x-session-id': 'test-sess' },
        body: JSON.stringify({ shippingAddress: VALID_SHIPPING_ADDRESS }),
      });

      expect(response.statusCode).toBe(400);
    });
  });

  // ─── POST /api/checkout/webhook ─────────────────────────────────────────────

  describe('POST /api/checkout/webhook', () => {
    it('returns 400 when Stripe-Signature header is missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/checkout/webhook',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ type: 'checkout.session.completed' }),
      });

      // Fastify validates required headers and returns 400; the route also returns 400
      expect(response.statusCode).toBe(400);
    });

    it('returns 400 or 500 for an invalid webhook signature', async () => {
      // When STRIPE_WEBHOOK_SECRET is not set the route returns 500.
      // When it is set but the signature is wrong the route returns 400.
      // Either is an acceptable "rejection" response.
      const response = await app.inject({
        method: 'POST',
        url: '/api/checkout/webhook',
        headers: {
          'content-type': 'application/json',
          'stripe-signature': 't=invalid,v1=badsig',
        },
        body: JSON.stringify({ type: 'checkout.session.completed' }),
      });

      expect([400, 500]).toContain(response.statusCode);
    });
  });
});
