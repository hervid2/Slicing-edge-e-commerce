import type { PrismaClient } from '@slicing-edge/db';
import { AppError } from '../../middleware/error-handler';

export class CartService {
  constructor(private prisma: PrismaClient) {}

  async getOrCreateCart(userId?: string, sessionId?: string) {
    if (!userId && !sessionId) {
      throw new AppError('User ID or session ID required', 400);
    }

    const where = userId ? { userId } : { sessionId };
    let cart = await this.prisma.cart.findFirst({
      where,
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { orderBy: { position: 'asc' as const }, take: 1 },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId, sessionId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  images: { orderBy: { position: 'asc' as const }, take: 1 },
                },
              },
            },
          },
        },
      });
    }

    return cart;
  }

  async addItem(cartId: string, productId: string, quantity: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId, isActive: true },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (product.stock < quantity) {
      throw new AppError(`Only ${product.stock} items available`, 400);
    }

    const existingItem = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId, productId } },
    });

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (product.stock < newQty) {
        throw new AppError(`Only ${product.stock} items available`, 400);
      }
      return this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
        include: {
          product: {
            include: { images: { orderBy: { position: 'asc' }, take: 1 } },
          },
        },
      });
    }

    return this.prisma.cartItem.create({
      data: { cartId, productId, quantity },
      include: {
        product: {
          include: { images: { orderBy: { position: 'asc' }, take: 1 } },
        },
      },
    });
  }

  async updateItemQuantity(itemId: string, quantity: number) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { product: true },
    });

    if (!item) {
      throw new AppError('Cart item not found', 404);
    }

    if (item.product.stock < quantity) {
      throw new AppError(`Only ${item.product.stock} items available`, 400);
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: {
        product: {
          include: { images: { orderBy: { position: 'asc' }, take: 1 } },
        },
      },
    });
  }

  async removeItem(itemId: string) {
    return this.prisma.cartItem.delete({ where: { id: itemId } });
  }

  async clearCart(cartId: string) {
    return this.prisma.cartItem.deleteMany({ where: { cartId } });
  }
}
