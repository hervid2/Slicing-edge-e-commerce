import type { PrismaClient } from '@slicing-edge/db';
import { AppError } from '../../middleware/error-handler';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FLAT_RATE } from '@slicing-edge/shared';
import crypto from 'node:crypto';

interface CheckoutInput {
  userId?: string;
  guestEmail?: string;
  shippingAddress: {
    fullName: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone?: string;
  };
}

export class CheckoutService {
  constructor(private prisma: PrismaClient) {}

  private createOrderNumber() {
    return `SE-${Date.now().toString(36).toUpperCase()}-${crypto
      .randomBytes(3)
      .toString('hex')
      .toUpperCase()}`;
  }

  private createGuestToken() {
    return crypto.randomBytes(16).toString('hex');
  }

  private calculateShipping(subtotal: number) {
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
  }

  async createOrder(input: CheckoutInput) {
    const cart = await this.prisma.cart.findFirst({
      where: input.userId ? { userId: input.userId } : undefined,
      include: {
        items: {
          include: {
            product: {
              include: { images: { orderBy: { position: 'asc' }, take: 1 } },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new AppError('Cart is empty', 400);
    }

    // Validate stock
    for (const item of cart.items) {
      if (!item.product.isActive) {
        throw new AppError(`${item.product.name} is no longer available`, 400);
      }
      if (item.product.stock < item.quantity) {
        throw new AppError(`Insufficient stock for ${item.product.name}`, 400);
      }
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );
    const shippingCost = this.calculateShipping(subtotal);
    const tax = 0; // TODO: Replace with Stripe Tax at payment intent stage
    const total = subtotal + shippingCost + tax;

    const orderNumber = this.createOrderNumber();
    const guestToken = input.userId ? null : this.createGuestToken();

    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: input.userId,
          guestEmail: input.userId ? null : input.guestEmail,
          guestToken,
          status: 'PENDING',
          subtotal,
          shippingCost,
          tax,
          total,
          currency: 'USD',
          shippingAddress: input.shippingAddress,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              productName: item.product.name,
              productPrice: item.product.price,
              productImage: item.product.images[0]?.url,
              quantity: item.quantity,
            })),
          },
          statusHistory: {
            create: {
              status: 'PENDING',
              note: 'Order created at checkout',
            },
          },
        },
        include: {
          items: true,
          statusHistory: { orderBy: { createdAt: 'desc' } },
        },
      });

      // Decrement stock with optimistic check
      for (const item of cart.items) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            version: item.product.version,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
            version: { increment: 1 },
          },
        });

        if (updated.count === 0) {
          throw new AppError(
            `Stock changed for ${item.product.name}. Please refresh cart and try again.`,
            409,
          );
        }
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return createdOrder;
    });

    return order;
  }
}
