import type { PrismaClient } from '@slicing-edge/db';
import { AppError } from '../../middleware/error-handler';
import { sendEmail, ReturnStatusEmail } from '@slicing-edge/email';

export type ReturnStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'LABEL_ISSUED'
  | 'RECEIVED'
  | 'REFUNDED'
  | 'CLOSED';

// Statuses that trigger a customer notification email.
const NOTIFIABLE_STATUSES = new Set<ReturnStatus>([
  'APPROVED',
  'REJECTED',
  'LABEL_ISSUED',
  'RECEIVED',
  'REFUNDED',
  'CLOSED',
]);

/**
 * Business logic for customer return requests (RMA flow).
 */
export class ReturnService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Submits a new return request for an existing order.
   * Validates that the order exists and belongs to the provided email.
   *
   * @throws {AppError} 404 if order not found or email mismatch.
   * @throws {AppError} 409 if an active return already exists for this order.
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
        status: { in: ['PENDING', 'APPROVED', 'LABEL_ISSUED', 'RECEIVED'] },
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
   * Creates a return request on behalf of the customer, initiated by an admin.
   * Bypasses email ownership verification — the admin has full order access.
   * The customer email is taken directly from the order record.
   *
   * @throws {AppError} 404 if order not found.
   * @throws {AppError} 409 if an active return already exists for this order.
   */
  async createReturnByAdmin(data: {
    orderId: string;
    reason: string;
    description: string;
    adminNote?: string;
  }) {
    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
      select: {
        id: true,
        orderNumber: true,
        guestEmail: true,
        user: { select: { name: true, email: true } },
      },
    });

    if (!order) throw new AppError('Order not found.', 404);

    const existing = await this.prisma.returnRequest.findFirst({
      where: {
        orderId: order.id,
        status: { in: ['PENDING', 'APPROVED', 'LABEL_ISSUED', 'RECEIVED'] },
      },
    });
    if (existing) {
      throw new AppError('An active return request already exists for this order.', 409);
    }

    const customerEmail = order.guestEmail ?? order.user?.email ?? '';

    return this.prisma.returnRequest.create({
      data: {
        orderId: order.id,
        email: customerEmail,
        reason: data.reason,
        description: data.description,
        ...(data.adminNote ? { adminNote: data.adminNote } : {}),
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
   * Triggers a Stripe refund when transitioning to REFUNDED.
   * Sends a customer notification email for all non-PENDING transitions.
   *
   * @throws {AppError} 404 if return request not found.
   */
  async updateStatus(id: string, status: ReturnStatus, adminNote?: string) {
    const existing = await this.prisma.returnRequest.findUnique({
      where: { id },
      include: {
        order: {
          select: {
            orderNumber: true,
            stripePaymentIntentId: true,
            total: true,
            guestEmail: true,
            user: { select: { name: true, email: true } },
          },
        },
      },
    });
    if (!existing) throw new AppError('Return request not found.', 404);

    // Process Stripe refund before updating DB — fail fast if it errors.
    if (status === 'REFUNDED' && existing.order.stripePaymentIntentId) {
      await this.processStripeRefund(existing.order.stripePaymentIntentId);
    }

    const updated = await this.prisma.returnRequest.update({
      where: { id },
      data: { status, ...(adminNote !== undefined ? { adminNote } : {}) },
      include: { order: { select: { orderNumber: true } } },
    });

    // Fire-and-forget notification email for customer-visible transitions.
    if (NOTIFIABLE_STATUSES.has(status)) {
      const customerEmail = existing.email;
      const customerName =
        existing.order.user?.name ?? existing.email.split('@')[0] ?? 'Customer';
      const orderNumber = existing.order.orderNumber;

      this.sendReturnStatusEmail({
        customerEmail,
        customerName,
        orderNumber,
        status,
        adminNote,
      }).catch((err: unknown) => {
        console.error(
          JSON.stringify({
            message: 'Failed to send return status email',
            returnId: id,
            status,
            error: String(err),
          }),
        );
      });
    }

    return updated;
  }

  /**
   * Issues a full refund via Stripe REST API using the payment intent ID.
   * Uses fetch directly to avoid adding the Stripe SDK as a dependency.
   *
   * @throws {AppError} When the Stripe refund call fails.
   */
  private async processStripeRefund(paymentIntentId: string) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      console.warn(
        JSON.stringify({
          message: 'STRIPE_SECRET_KEY not set — skipping Stripe refund',
          paymentIntentId,
        }),
      );
      return;
    }

    const body = new URLSearchParams({ payment_intent: paymentIntentId });
    const response = await fetch('https://api.stripe.com/v1/refunds', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
      throw new AppError(
        `Stripe refund failed: ${error?.error?.message ?? 'Unknown error'}`,
        502,
      );
    }
  }

  /**
   * Sends a transactional email to the customer when their return status changes.
   */
  private async sendReturnStatusEmail(input: {
    customerEmail: string;
    customerName: string;
    orderNumber: string;
    status: ReturnStatus;
    adminNote?: string;
  }) {
    if (!process.env.RESEND_API_KEY) {
      console.info(
        JSON.stringify({
          message: 'Return status email skipped — RESEND_API_KEY missing',
          orderNumber: input.orderNumber,
          status: input.status,
        }),
      );
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const trackingUrl = `${frontendUrl}/account/orders`;

    const subjects: Record<ReturnStatus, string> = {
      PENDING: '',
      APPROVED: `Your return for order #${input.orderNumber} has been approved`,
      REJECTED: `Update on your return request for order #${input.orderNumber}`,
      LABEL_ISSUED: `Your return shipping label for order #${input.orderNumber} is ready`,
      RECEIVED: `We received your return for order #${input.orderNumber}`,
      REFUNDED: `Your refund for order #${input.orderNumber} has been processed`,
      CLOSED: `Your return for order #${input.orderNumber} has been closed`,
    };

    await sendEmail({
      to: input.customerEmail,
      subject: subjects[input.status],
      react: ReturnStatusEmail({
        customerName: input.customerName,
        orderNumber: input.orderNumber,
        status: input.status as Exclude<ReturnStatus, 'PENDING'>,
        adminNote: input.adminNote,
        trackingUrl,
      }),
    });
  }
}
