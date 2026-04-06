import type { PrismaClient } from '@slicing-edge/db';

/**
 * Data-access layer for wishlist items.
 */
export class WishlistRepository {
  constructor(private prisma: PrismaClient) {}

  async findByUser(userId: string) {
    return this.prisma.wishlist.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            compareAtPrice: true,
            stock: true,
            isActive: true,
            images: {
              orderBy: { position: 'asc' },
              take: 1,
              select: { url: true, altText: true },
            },
            category: { select: { name: true, slug: true } },
            avgRating: true,
            reviewCount: true,
          },
        },
      },
    });
  }

  async findItem(userId: string, productId: string) {
    return this.prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });
  }

  async add(userId: string, productId: string) {
    return this.prisma.wishlist.create({ data: { userId, productId } });
  }

  async remove(userId: string, productId: string) {
    return this.prisma.wishlist.delete({
      where: { userId_productId: { userId, productId } },
    });
  }
}
