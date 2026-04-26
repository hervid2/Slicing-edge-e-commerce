import type { PrismaClient } from '@slicing-edge/db';
import { AppError } from '../../middleware/error-handler';

type ReturnStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED';

/**
 * Business logic for customer return requests.
 */
export class ReturnService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Submits a new return request for an existing order.
   * Validates that the order exists and belongs to the provided email.
   *
   * @throws {AppError} 404 if order not found or email mismatch.
   * @throws {AppError} 409 if a pending/approved return already exists for this order.
   */
  async createReturn(data: {
    orderNumber: string;
    email: string;
    reason: string;
    description: string;
  }) {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber: data.orderNumber },
      select: { id: true, guestEmail: true, userId: true, user: { select: { email: true } } },
    });

    if (!order) throw new AppError('Order not found.', 404);

    const orderEmail = order.guestEmail ?? order.user?.email ?? '';
    if (orderEmail.toLowerCase() !== data.email.toLowerCase()) {
      throw new AppError('Order not found.', 404);
    }

    const existing = await this.prisma.returnRequest.findFirst({
      where: {
        orderId: order.id,
        status: { in: ['PENDING', 'APPROVED'] },
      },
    });
    if (existing) {
      throw new AppError('A return request for this order is already in progress.', 409);
    }

    return this.prisma.returnRequest.create({
      data: {
        orderId: order.id,
        email: data.email,
        reason: data.reason,
        description: data.description,
      },
      include: { order: { select: { orderNumber: true } } },
    });
  }

  /**
   * Returns a paginated list of return requests for the admin panel.
   * Supports filtering by status.
   */
  async listReturns(page: number, limit: number, status?: ReturnStatus) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [returns, total] = await Promise.all([
      this.prisma.returnRequest.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { order: { select: { orderNumber: true, total: true } } },
      }),
      this.prisma.returnRequest.count({ where }),
    ]);

    return {
      returns,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Updates the status of a return request. Optionally records an admin note.
   *
   * @throws {AppError} 404 if return request not found.
   */
  async updateStatus(id: string, status: ReturnStatus, adminNote?: string) {
    const existing = await this.prisma.returnRequest.findUnique({ where: { id } });
    if (!existing) throw new AppError('Return request not found.', 404);

    return this.prisma.returnRequest.update({
      where: { id },
      data: { status, ...(adminNote !== undefined ? { adminNote } : {}) },
      include: { order: { select: { orderNumber: true } } },
    });
  }
}
