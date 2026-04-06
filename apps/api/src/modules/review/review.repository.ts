import type { PrismaClient } from '@slicing-edge/db';

/**
 * Data-access layer for product reviews.
 * Maintains Product.avgRating and Product.reviewCount after every write.
 */
export class ReviewRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: { userId: string; productId: string; rating: number; comment: string }) {
    const review = await this.prisma.review.create({
      data,
      include: { user: { select: { name: true, image: true } } },
    });
    await this.recalculate(data.productId);
    return review;
  }

  async findById(id: string) {
    return this.prisma.review.findUnique({ where: { id } });
  }

  async findMany(productId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { user: { select: { name: true, image: true } } },
      }),
      this.prisma.review.count({ where: { productId } }),
    ]);
    return {
      reviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async delete(id: string, productId: string) {
    await this.prisma.review.delete({ where: { id } });
    await this.recalculate(productId);
  }

  /** Recomputes avgRating and reviewCount on the parent product. */
  private async recalculate(productId: string) {
    const agg = await this.prisma.review.aggregate({
      where: { productId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        avgRating: agg._avg.rating ?? 0,
        reviewCount: agg._count.rating,
      },
    });
  }
}
