import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProductService } from '../../modules/product/product.service';
import { AppError } from '../../middleware/error-handler';
import { createMockPrisma } from '../helpers/mock-prisma';

const PRODUCT_STUB = {
  id: 'prod_1',
  name: 'Chef Knife',
  slug: 'chef-knife',
  price: '89.99',
  compareAtPrice: null,
  stock: 10,
  isActive: true,
  isFeatured: false,
  avgRating: 0,
  reviewCount: 0,
  version: 1,
  publishedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  description: 'A sharp chef knife',
  currency: 'USD',
  categoryId: 'cat_1',
  category: { name: 'Chef Knives', slug: 'chef-knives' },
  images: [],
};

describe('ProductService', () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let service: ProductService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new ProductService(prisma);
  });

  // ─── getBySlug ───────────────────────────────────────────────────────────────

  describe('getBySlug', () => {
    it('returns the product when found', async () => {
      prisma.product.findUnique.mockResolvedValue(PRODUCT_STUB);

      const result = await service.getBySlug('chef-knife');
      expect(result.slug).toBe('chef-knife');
    });

    it('throws 404 when the product does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.getBySlug('unknown-knife')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  // ─── getById ─────────────────────────────────────────────────────────────────

  describe('getById', () => {
    it('returns the product when found', async () => {
      prisma.product.findUnique.mockResolvedValue(PRODUCT_STUB);

      const result = await service.getById('prod_1');
      expect(result.id).toBe('prod_1');
    });

    it('throws 404 when the product does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.getById('ghost_prod')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  // ─── getFeatured ─────────────────────────────────────────────────────────────

  describe('getFeatured', () => {
    it('returns an array of featured products', async () => {
      prisma.product.findMany.mockResolvedValue([PRODUCT_STUB]);

      const result = await service.getFeatured(3);
      expect(result).toHaveLength(1);
    });
  });

  // ─── list ────────────────────────────────────────────────────────────────────

  describe('list', () => {
    it('returns paginated products matching the public query', async () => {
      prisma.product.findMany.mockResolvedValue([PRODUCT_STUB]);
      prisma.product.count.mockResolvedValue(1);

      const result = await service.list({
        page: 1,
        limit: 12,
        sortBy: 'newest',
      });

      expect(result.products).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  // ─── create ──────────────────────────────────────────────────────────────────

  describe('create', () => {
    it('creates a product with the provided data', async () => {
      prisma.product.create.mockResolvedValue(PRODUCT_STUB);

      const input = {
        name: 'Chef Knife',
        slug: 'chef-knife',
        price: 89.99,
        stock: 10,
        categoryId: 'cat_1',
        currency: 'USD',
        isActive: true,
        isFeatured: false,
        description: 'A sharp chef knife',
      };

      const result = await service.create(input);
      expect(result.name).toBe('Chef Knife');
      expect(prisma.product.create).toHaveBeenCalledOnce();
    });
  });

  // ─── update ──────────────────────────────────────────────────────────────────

  describe('update', () => {
    it('updates an existing product', async () => {
      prisma.product.findUnique.mockResolvedValue(PRODUCT_STUB);
      prisma.product.update.mockResolvedValue({ ...PRODUCT_STUB, name: 'Updated Knife' });

      const result = await service.update('prod_1', { name: 'Updated Knife' });
      expect(result.name).toBe('Updated Knife');
    });

    it('throws 404 when the product does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.update('ghost', { name: 'X' })).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it('sets publishedAt when activating a previously inactive product', async () => {
      prisma.product.findUnique.mockResolvedValue({
        ...PRODUCT_STUB,
        isActive: false,
        publishedAt: null,
      });
      prisma.product.update.mockResolvedValue({ ...PRODUCT_STUB, isActive: true });

      await service.update('prod_1', { isActive: true });

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ publishedAt: expect.any(Date) }),
        }),
      );
    });
  });

  // ─── deactivate ──────────────────────────────────────────────────────────────

  describe('deactivate', () => {
    it('sets isActive=false and clears publishedAt', async () => {
      prisma.product.findUnique.mockResolvedValue(PRODUCT_STUB);
      prisma.product.update.mockResolvedValue({
        ...PRODUCT_STUB,
        isActive: false,
        publishedAt: null,
      });

      await service.deactivate('prod_1');

      expect(prisma.product.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { isActive: false, publishedAt: null },
        }),
      );
    });

    it('throws 404 when product does not exist', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.deactivate('ghost')).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
