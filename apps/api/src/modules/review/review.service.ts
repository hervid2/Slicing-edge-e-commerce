import type { PrismaClient } from '@slicing-edge/db';
import { AppError } from '../../middleware/error-handler';
import { ReviewRepository } from './review.repository';

export class ReviewService {
  private repo: ReviewRepository;

  constructor(prisma: PrismaClient) {
    this.repo = new ReviewRepository(prisma);
  }

  /**
   * Creates a review for a product.
   * Enforces one review per user/product pair.
   *
   * @throws {AppError} 404 if product not found, 409 if review already exists.
   */
  async create(userId: string, productId: string, rating: number, comment: string) {
    try {
      return await this.repo.create({ userId, productId, rating, comment });
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'P2002') throw new AppError('You have already reviewed this product', 409);
      if (code === 'P2025') throw new AppError('Product not found', 404);
      throw err;
    }
  }

  /**
   * Returns paginated reviews for a product.
   */
  async list(productId: string, page = 1, limit = 10) {
    return this.repo.findMany(productId, page, limit);
  }

  /**
   * Deletes a review. Users may only delete their own; admins may delete any.
   *
   * @throws {AppError} 404 if not found, 403 if not authorized.
   */
  async delete(reviewId: string, userId: string, isAdmin: boolean) {
    const review = await this.repo.findById(reviewId);
    if (!review) throw new AppError('Review not found', 404);
    if (!isAdmin && review.userId !== userId) throw new AppError('Forbidden', 403);
    await this.repo.delete(reviewId, review.productId);
  }
}
