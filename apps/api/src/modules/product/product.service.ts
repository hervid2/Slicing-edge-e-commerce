import type { PrismaClient } from '@slicing-edge/db';
import type { CreateProductInput, UpdateProductInput, ProductQueryInput } from '@slicing-edge/shared';
import { ProductRepository } from './product.repository';
import { AppError } from '../../middleware/error-handler';

export class ProductService {
  private repo: ProductRepository;

  constructor(prisma: PrismaClient) {
    this.repo = new ProductRepository(prisma);
  }

  async list(query: ProductQueryInput) {
    return this.repo.findMany(query);
  }

  async getBySlug(slug: string) {
    const product = await this.repo.findBySlug(slug);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    return product;
  }

  async getById(id: string) {
    const product = await this.repo.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    return product;
  }

  async getFeatured(limit?: number) {
    return this.repo.findFeatured(limit);
  }

  async create(data: CreateProductInput) {
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
    });
  }

  async update(id: string, data: UpdateProductInput) {
    await this.getById(id);

    return this.repo.update(id, {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.price !== undefined && { price: data.price }),
      ...(data.compareAtPrice !== undefined && { compareAtPrice: data.compareAtPrice }),
      ...(data.stock !== undefined && { stock: data.stock }),
      ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
      ...(data.categoryId !== undefined && { category: { connect: { id: data.categoryId } } }),
    });
  }
}
