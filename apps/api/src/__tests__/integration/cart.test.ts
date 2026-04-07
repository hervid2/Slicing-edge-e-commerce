import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from '../helpers/build-test-app';
import { createMockPrisma } from '../helpers/mock-prisma';

// addToCartSchema requires productId to be a CUID (starts with 'c', 8+ extra chars)
const PRODUCT_CUID = 'cltest00000000000000prod1';

const EMPTY_CART = {
  id: 'cltest00000000000000cart1',
  sessionId: 'test-session-123',
  userId: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  items: [],
};

const CART_ITEM = {
  id: 'cltest00000000000000item1',
  cartId: EMPTY_CART.id,
  productId: PRODUCT_CUID,
  quantity: 2,
  product: {
    id: PRODUCT_CUID,
    name: 'Chef Knife',
    price: '89.99',
    stock: 10,
    isActive: true,
    images: [{ url: 'https://example.com/knife.jpg', position: 0 }],
  },
};

const CART_WITH_ITEM = { ...EMPTY_CART, items: [CART_ITEM] };

describe('Cart routes', () => {
  let app: FastifyInstance;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeAll(async () => {
    ({ app, prisma } = await buildTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Reset all mocks between tests to avoid cross-test contamination
    Object.values(prisma).forEach((model) => {
      if (model && typeof model === 'object') {
        Object.values(model).forEach((fn) => {
          if (typeof fn === 'function' && 'mockReset' in fn) {
            (fn as { mockReset: () => void }).mockReset();
          }
        });
      }
    });
  });

  // ─── GET /api/cart ──────────────────────────────────────────────────────────

  describe('GET /api/cart', () => {
    it('returns 200 with an empty cart for a new session', async () => {
      prisma.cart.findFirst.mockResolvedValue(null);
      prisma.cart.create.mockResolvedValue(EMPTY_CART);

      const response = await app.inject({
        method: 'GET',
        url: '/api/cart',
        headers: { 'x-session-id': 'test-session-123' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json<{ cart: unknown }>();
      expect(body.cart).toBeDefined();
    });

    it('returns 200 with an existing cart', async () => {
      prisma.cart.findFirst.mockResolvedValue(CART_WITH_ITEM);

      const response = await app.inject({
        method: 'GET',
        url: '/api/cart',
        headers: { 'x-session-id': 'test-session-123' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json<{ cart: unknown }>();
      expect(body.cart).toBeDefined();
    });
  });

  // ─── POST /api/cart/items ───────────────────────────────────────────────────

  describe('POST /api/cart/items', () => {
    it('returns 400 when body is missing required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/cart/items',
        headers: {
          'content-type': 'application/json',
          'x-session-id': 'test-session-123',
        },
        body: JSON.stringify({}),
      });

      expect(response.statusCode).toBe(400);
    });

    it('returns 400 when productId is not a valid CUID', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/cart/items',
        headers: {
          'content-type': 'application/json',
          'x-session-id': 'test-session-123',
        },
        body: JSON.stringify({ productId: 'not-a-cuid', quantity: 1 }),
      });

      expect(response.statusCode).toBe(400);
    });

    it('returns 201 when item is successfully added to cart', async () => {
      prisma.cart.findFirst.mockResolvedValue(EMPTY_CART);
      prisma.product.findUnique.mockResolvedValue({
        id: PRODUCT_CUID,
        name: 'Chef Knife',
        price: '89.99',
        stock: 10,
        isActive: true,
        images: [],
      });
      prisma.cartItem.findUnique.mockResolvedValue(null);
      prisma.cartItem.create.mockResolvedValue({
        id: 'cltest00000000000000item2',
        cartId: EMPTY_CART.id,
        productId: PRODUCT_CUID,
        quantity: 1,
        product: {
          id: PRODUCT_CUID,
          name: 'Chef Knife',
          price: '89.99',
          stock: 10,
          isActive: true,
          images: [],
        },
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/cart/items',
        headers: {
          'content-type': 'application/json',
          'x-session-id': 'test-session-123',
        },
        body: JSON.stringify({ productId: PRODUCT_CUID, quantity: 1 }),
      });

      expect(response.statusCode).toBe(201);
    });

    it('returns 404 when the product does not exist', async () => {
      prisma.cart.findFirst.mockResolvedValue(EMPTY_CART);
      prisma.product.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: '/api/cart/items',
        headers: {
          'content-type': 'application/json',
          'x-session-id': 'test-session-123',
        },
        body: JSON.stringify({ productId: PRODUCT_CUID, quantity: 1 }),
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
