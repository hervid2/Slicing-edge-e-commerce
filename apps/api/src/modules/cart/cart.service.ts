import type { PrismaClient } from '@slicing-edge/db';
import { AppError } from '../../middleware/error-handler';

export class CartService {
  constructor(private prisma: PrismaClient) {}

  private readonly cartInclude = {
    items: {
      include: {
        product: {
          include: {
            images: { orderBy: { position: 'asc' as const }, take: 1 },
          },
        },
      },
    },
  } as const;

  private async mergeGuestCartIntoUserCart(userCartId: string, guestCartId: string) {
    await this.prisma.$transaction(async (tx) => {
      const [userItems, guestItems] = await Promise.all([
        tx.cartItem.findMany({
          where: { cartId: userCartId },
          include: { product: true },
        }),
        tx.cartItem.findMany({
          where: { cartId: guestCartId },
          include: { product: true },
        }),
      ]);

      const userByProductId = new Map(userItems.map((item) => [item.productId, item]));

      for (const guestItem of guestItems) {
        const existing = userByProductId.get(guestItem.productId);
        const desiredQuantity = (existing?.quantity || 0) + guestItem.quantity;
        const allowedQuantity = Math.min(desiredQuantity, guestItem.product.stock);

        if (allowedQuantity <= 0) {
          continue;
        }

        if (existing) {
          await tx.cartItem.update({
            where: { id: existing.id },
            data: { quantity: allowedQuantity },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId: userCartId,
              productId: guestItem.productId,
              quantity: Math.min(guestItem.quantity, guestItem.product.stock),
            },
          });
        }
      }

      await tx.cart.delete({ where: { id: guestCartId } });
    });
  }

  async getOrCreateCart(userId?: string, sessionId?: string) {
    if (!userId && !sessionId) {
      throw new AppError('User ID or session ID required', 400);
    }

    if (!userId) {
      const existingGuestCart = await this.prisma.cart.findFirst({
        where: { sessionId },
        include: this.cartInclude,
      });

      if (existingGuestCart) {
        return existingGuestCart;
      }

      return this.prisma.cart.create({
        data: { sessionId },
        include: this.cartInclude,
      });
    }

    const [userCart, guestCart] = await Promise.all([
      this.prisma.cart.findFirst({
        where: { userId },
        include: this.cartInclude,
      }),
      sessionId
        ? this.prisma.cart.findFirst({
            where: { sessionId },
            include: this.cartInclude,
          })
        : Promise.resolve(null),
    ]);

    if (!userCart && guestCart) {
      return this.prisma.cart.update({
        where: { id: guestCart.id },
        data: {
          userId,
          sessionId: null,
        },
        include: this.cartInclude,
      });
    }

    if (userCart && guestCart && userCart.id !== guestCart.id) {
      await this.mergeGuestCartIntoUserCart(userCart.id, guestCart.id);

      return this.prisma.cart.findUniqueOrThrow({
        where: { id: userCart.id },
        include: this.cartInclude,
      });
    }

    if (userCart) {
      return userCart;
    }

    return this.prisma.cart.create({
      data: { userId },
      include: this.cartInclude,
    });
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
