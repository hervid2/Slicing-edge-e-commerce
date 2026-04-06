import type { PrismaClient } from '@slicing-edge/db';
import { AppError } from '../../middleware/error-handler';
import { SHIPPING_FLAT_RATE, FREE_SHIPPING_THRESHOLD, ORDER_NUMBER_PREFIX } from '@slicing-edge/shared';
import { sendEmail, OrderShippedEmail } from '@slicing-edge/email';
import crypto from 'node:crypto';

export class OrderService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generates a readable order number for guest/authenticated order tracking.
   */
  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `${ORDER_NUMBER_PREFIX}-${timestamp}-${random}`;
  }

  /**
   * Returns all orders for an authenticated user.
   */
  async getUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  /**
   * Returns a single order by order number, optionally constrained by guest email.
   *
   * @throws {AppError} When no matching order is found.
   */
  async getOrderByNumber(orderNumber: string, email?: string) {
    const where: { orderNumber: string; guestEmail?: string } = { orderNumber };
    if (email) where.guestEmail = email;

    const order = await this.prisma.order.findFirst({
      where,
      include: {
        items: true,
        statusHistory: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return order;
  }

  /**
   * Returns paginated orders for admin views.
   */
  async getAllOrders(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          items: true,
          user: { select: { name: true, email: true } },
        },
      }),
      this.prisma.order.count(),
    ]);

    return {
      orders,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Updates order status and appends an order status history entry.
   * Sends a shipping notification email when status transitions to SHIPPED.
   *
   * @throws {AppError} When the order does not exist.
   */
  async updateOrderStatus(orderId: string, status: string, note?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { name: true, email: true } } },
    });
    if (!order) throw new AppError('Order not found', 404);

    const [updatedOrder] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: status as any },
        include: { items: true, statusHistory: { orderBy: { createdAt: 'desc' } } },
      }),
      this.prisma.orderStatusHistory.create({
        data: { orderId, status: status as any, note },
      }),
    ]);

    if (status === 'SHIPPED') {
      const customerEmail = order.user?.email ?? order.guestEmail;
      const customerName = order.user?.name ?? order.guestEmail ?? 'Customer';

      if (customerEmail) {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const trackingParams = new URLSearchParams({ orderNumber: order.orderNumber });
        if (order.guestEmail) trackingParams.set('email', order.guestEmail);
        const trackingUrl = `${frontendUrl}/orders?${trackingParams.toString()}`;

        if (!process.env.RESEND_API_KEY) {
          console.info(
            JSON.stringify({
              message: 'Order shipped — RESEND_API_KEY missing, shipping email not sent',
              orderNumber: order.orderNumber,
              customerEmail,
            }),
          );
        } else {
          await sendEmail({
            to: customerEmail,
            subject: `Your order #${order.orderNumber} has shipped!`,
            react: OrderShippedEmail({
              customerName,
              orderNumber: order.orderNumber,
              trackingUrl,
            }),
          }).catch((err: unknown) => {
            console.error(
              JSON.stringify({ message: 'Failed to send shipping email', error: String(err) }),
            );
          });
        }
      }
    }

    return updatedOrder;
  }

  /**
   * Calculates shipping price using the project shipping policy.
   */
  calculateShipping(subtotal: number): number {
    return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE;
  }
}
