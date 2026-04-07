import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductRepository } from '../../modules/product/product.repository';
import { createMockPrisma } from '../helpers/mock-prisma';

const PRODUCT_STUB = {
  id: 'prod_1',
  name: 'Chef Knife',
  slug: 'chef-knife',
  price: '89.99',
  stock: 10,
  isActive: true,
  category: { name: 'Chef Knives', slug: 'chef-knives' },
  images: [],
};

const DEFAULT_QUERY = { page: 1, limit: 12, sortBy: 'newest' as const };

describe('ProductRepository', () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let repo: ProductRepository;

  beforeEach(() => {
    prisma = createMockPrisma();
    repo = new ProductRepository(prisma);
  });

  // ─── findMany ────────────────────────────────────────────────────────────────

  describe('findMany', () => {
    it('only returns active products', async () => {
      prisma.product.findMany.mockResolvedValue([PRODUCT_STUB]);
      prisma.product.count.mockResolvedValue(1);

      await repo.findMany(DEFAULT_QUERY);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ isActive: true }) }),
      );
    });

    it('applies search filter when provided', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await repo.findMany({ ...DEFAULT_QUERY, search: 'santoku' });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              expect.objectContaining({ name: expect.objectContaining({ contains: 'santoku' }) }),
            ]),
          }),
        }),
      );
    });

    it('applies price range filters when provided', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await repo.findMany({ ...DEFAULT_QUERY, minPrice: 50, maxPrice: 200 });

      const callArgs = prisma.product.findMany.mock.calls[0][0] as { where: Record<string, unknown> };
      expect(callArgs.where.price).toBeDefined();
    });

    it('applies inStock filter when requested', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      await repo.findMany({ ...DEFAULT_QUERY, inStock: true });

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ stock: { gt: 0 } }),
        }),
      );
    });

    it('returns correct pagination metadata', async () => {
      prisma.product.findMany.mockResolvedValue([PRODUCT_STUB]);
      prisma.product.count.mockResolvedValue(25);

      const result = await repo.findMany({ page: 2, limit: 10, sortBy: 'newest' });

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
      });
    });
  });

  // ─── findManyAdmin ───────────────────────────────────────────────────────────

  describe('findManyAdmin', () => {
    it('does not filter by isActive (returns all products)', async () => {
      prisma.product.findMany.mockResolvedValue([PRODUCT_STUB]);
      prisma.product.count.mockResolvedValue(1);

      await repo.findManyAdmin(DEFAULT_QUERY);

      const callArgs = prisma.product.findMany.mock.calls[0][0] as { where: Record<string, unknown> };
      expect(callArgs.where.isActive).toBeUndefined();
    });
  });

  // ─── findBySlug ──────────────────────────────────────────────────────────────

  describe('findBySlug', () => {
    it('queries by slug and isActive=true', async () => {
      prisma.product.findUnique.mockResolvedValue(PRODUCT_STUB);

      await repo.findBySlug('chef-knife');

      expect(prisma.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { slug: 'chef-knife', isActive: true },
        }),
      );
    });

    it('returns null when not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);
      const result = await repo.findBySlug('ghost');
      expect(result).toBeNull();
    });
  });

  // ─── findById ────────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('queries by id only (no isActive filter)', async () => {
      prisma.product.findUnique.mockResolvedValue(PRODUCT_STUB);

      await repo.findById('prod_1');

      expect(prisma.product.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'prod_1' } }),
      );
    });
  });

  // ─── findFeatured ────────────────────────────────────────────────────────────

  describe('findFeatured', () => {
    it('only returns active and featured products', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      await repo.findFeatured(6);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { isActive: true, isFeatured: true },
          take: 6,
        }),
      );
    });
  });
});
