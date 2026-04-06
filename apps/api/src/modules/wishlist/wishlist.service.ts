import type { PrismaClient } from '@slicing-edge/db';
import { AppError } from '../../middleware/error-handler';
import { WishlistRepository } from './wishlist.repository';

export class WishlistService {
  private repo: WishlistRepository;

  constructor(prisma: PrismaClient) {
    this.repo = new WishlistRepository(prisma);
  }

  /**
   * Returns all wishlist items for the authenticated user, with product details.
   */
  async getWishlist(userId: string) {
    return this.repo.findByUser(userId);
  }

  /**
   * Toggles a product in/out of the user's wishlist.
   * Returns whether the item was added (true) or removed (false).
   *
   * @throws {AppError} 404 if product does not exist.
   */
  async toggle(userId: string, productId: string): Promise<{ added: boolean; productId: string }> {
    const existing = await this.repo.findItem(userId, productId);

    if (existing) {
      await this.repo.remove(userId, productId);
      return { added: false, productId };
    }

    try {
      await this.repo.add(userId, productId);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === 'P2025') throw new AppError('Product not found', 404);
      throw err;
    }

    return { added: true, productId };
  }
}
