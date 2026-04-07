import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildTestApp } from '../helpers/build-test-app';
import { createMockPrisma } from '../helpers/mock-prisma';

// Fastify serializes nested objects per their schema definition.
// We only assert on status codes and the presence of top-level keys.

const PRODUCT_STUB = {
  id: 'cltest00000000000000000001',
  name: 'Chef Knife',
  slug: 'chef-knife',
  price: '89.99',
  compareAtPrice: null,
  stock: 5,
  isActive: true,
  isFeatured: true,
  avgRating: 4.5,
  reviewCount: 3,
  version: 1,
  publishedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  description: 'Premium chef knife',
  currency: 'USD',
  categoryId: 'cltest00000000000000000002',
  category: { name: 'Chef Knives', slug: 'chef-knives' },
  images: [{ id: 'cltest00000000000000000003', url: 'https://example.com/knife.jpg', altText: null, position: 0 }],
};

describe('Products routes', () => {
  let app: FastifyInstance;
  let prisma: ReturnType<typeof createMockPrisma>;

  beforeAll(async () => {
    ({ app, prisma } = await buildTestApp());
  });

  afterAll(async () => {
    await app.close();
  });

  // ─── GET /api/products ──────────────────────────────────────────────────────

  describe('GET /api/products', () => {
    it('returns 200 with products array and pagination', async () => {
      prisma.product.findMany.mockResolvedValue([PRODUCT_STUB]);
      prisma.product.count.mockResolvedValue(1);

      const response = await app.inject({ method: 'GET', url: '/api/products' });

      expect(response.statusCode).toBe(200);
      const body = response.json<{ products: unknown[]; pagination: Record<string, unknown> }>();
      expect(Array.isArray(body.products)).toBe(true);
      // Fastify serializes `pagination: { type: 'object' }` via fast-json-stringify.
      // The top-level key is present; inner fields depend on schema property definitions.
      expect(body.pagination).toBeDefined();
    });

    it('returns 200 with an empty list when no products exist', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      const response = await app.inject({
        method: 'GET',
        url: '/api/products?search=nonexistent',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json<{ products: unknown[] }>();
      expect(body.products).toHaveLength(0);
    });

    it('accepts valid query parameters without error', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      const response = await app.inject({
        method: 'GET',
        url: '/api/products?page=1&limit=6&sortBy=price_asc&inStock=true',
      });

      expect(response.statusCode).toBe(200);
    });
  });

  // ─── GET /api/products/:slug ────────────────────────────────────────────────

  describe('GET /api/products/:slug', () => {
    it('returns 200 when the product exists', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...PRODUCT_STUB,
        reviews: [],
      });

      const response = await app.inject({
        method: 'GET',
        url: '/api/products/chef-knife',
      });

      expect(response.statusCode).toBe(200);
      // Confirm response has "product" key (schema-serialized object)
      const body = response.json<Record<string, unknown>>();
      expect(body.product).toBeDefined();
    });

    it('returns 404 when the product does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      const response = await app.inject({
        method: 'GET',
        url: '/api/products/nonexistent-knife',
      });

      expect(response.statusCode).toBe(404);
    });
  });
});
