import type { PrismaClient } from '@slicing-edge/db';
import type { CreateProductInput, UpdateProductInput, ProductQueryInput } from '@slicing-edge/shared';
import { ProductRepository } from './product.repository';
import { AppError } from '../../middleware/error-handler';

export class ProductService {
  private repo: ProductRepository;

  constructor(prisma: PrismaClient) {
    this.repo = new ProductRepository(prisma);
  }

  /**
   * Returns paginated products with optional filters and sorting.
   */
  async list(query: ProductQueryInput) {
    return this.repo.findMany(query);
  }

  /**
   * Returns paginated products for admin management, including inactive items.
   */
  async listAdmin(query: ProductQueryInput) {
    return this.repo.findManyAdmin(query);
  }

  /**
   * Returns a public product by slug.
   *
   * @throws {AppError} When the product does not exist.
   */
  async getBySlug(slug: string) {
    const product = await this.repo.findBySlug(slug);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    return product;
  }

  /**
   * Returns a product by internal ID.
   *
   * @throws {AppError} When the product does not exist.
   */
  async getById(id: string) {
    const product = await this.repo.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    return product;
  }

  /**
   * Returns featured products for merchandising sections.
   */
  async getFeatured(limit?: number) {
    return this.repo.findFeatured(limit);
  }

  /**
   * Creates a new product.
   */
  async create(data: CreateProductInput) {
    const images = data.images ?? [];

    return this.repo.create({
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: data.price,
      compareAtPrice: data.compareAtPrice,
      currency: data.currency,
      stock: data.stock,
      isFeatured: data.isFeatured,
      isActive: data.isActive,
      publishedAt: data.isActive ? new Date() : null,
      category: { connect: { id: data.categoryId } },
      ...(images.length > 0 && {
        images: {
          create: images.map((image) => ({
            url: image.url,
            cloudinaryPublicId: image.cloudinaryPublicId,
            altText: image.altText,
            position: image.position,
          })),
        },
      }),
    });
  }

  /**
   * Updates an existing product.
   *
   * @throws {AppError} When the product does not exist.
   */
  async update(id: string, data: UpdateProductInput) {
    const currentProduct = await this.getById(id);
    const shouldPublishNow = data.isActive === true && !currentProduct.publishedAt;

    return this.repo.update(id, {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.compareAtPrice !== undefined && { compareAtPrice: data.compareAtPrice }),
      ...(data.currency !== undefined && { currency: data.currency }),
      ...(data.stock !== undefined && { stock: data.stock }),
      ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.categoryId !== undefined && { category: { connect: { id: data.categoryId } } }),
      ...(shouldPublishNow && { publishedAt: new Date() }),
      ...(data.images && {
        images: {
          deleteMany: {},
          create: data.images.map((image) => ({
            url: image.url,
            cloudinaryPublicId: image.cloudinaryPublicId,
            altText: image.altText,
            position: image.position,
          })),
        },
      }),
    });
  }

  /**
   * Soft-deletes a product by setting it as inactive.
   *
   * @throws {AppError} When the product does not exist.
   */
  async deactivate(id: string) {
    await this.getById(id);
    return this.repo.update(id, {
      isActive: false,
      publishedAt: null,
    });
  }
}
