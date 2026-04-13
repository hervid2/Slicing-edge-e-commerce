import type { PrismaClient } from '@slicing-edge/db';
import { AppError } from '../../middleware/error-handler';
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FLAT_RATE } from '@slicing-edge/shared';
import crypto from 'node:crypto';
import { sendEmail, OrderConfirmationEmail } from '@slicing-edge/email';

interface CheckoutInput {
  userId?: string;
  sessionId?: string;
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

  /**
   * Converts an amount into USD display format for transactional emails.
   */
  private formatCurrency(amount: unknown) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(amount));
  }

  /**
   * Safely extracts `fullName` from persisted shipping JSON.
   */
  private getNameFromShippingAddress(shippingAddress: unknown) {
    if (!shippingAddress || typeof shippingAddress !== 'object') return null;

    const fullName = (shippingAddress as { fullName?: unknown }).fullName;
    return typeof fullName === 'string' && fullName.trim().length > 0 ? fullName : null;
  }

  /**
   * Sends an order confirmation email after successful payment confirmation.
   * Falls back to log-only mode when Resend is not configured.
   */
  private async sendOrderConfirmationEmail(input: {
    orderNumber: string;
    customerEmail: string;
    customerName: string;
    guestEmail?: string | null;
    items: Array<{ productName: string; quantity: number; productPrice: unknown }>;
    subtotal: unknown;
    shippingCost: unknown;
    tax: unknown;
    total: unknown;
  }) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const trackingParams = new URLSearchParams({ orderNumber: input.orderNumber });

    if (input.guestEmail) {
      trackingParams.set('email', input.guestEmail);
    }

    const trackingUrl = `${frontendUrl}/orders?${trackingParams.toString()}`;

    if (!process.env.RESEND_API_KEY) {
      console.info(
        JSON.stringify({
          message: 'Order confirmed — RESEND_API_KEY missing, order confirmation email not sent',
          orderNumber: input.orderNumber,
          customerEmail: input.customerEmail,
          trackingUrl,
        }),
      );
      return;
    }

    await sendEmail({
      to: input.customerEmail,
      subject: `Order confirmed: ${input.orderNumber}`,
      react: OrderConfirmationEmail({
        customerName: input.customerName,
        orderNumber: input.orderNumber,
        items: input.items.map((item) => ({
          name: item.productName,
          quantity: item.quantity,
          price: this.formatCurrency(item.productPrice),
        })),
        subtotal: this.formatCurrency(input.subtotal),
        shipping: this.formatCurrency(input.shippingCost),
        tax: this.formatCurrency(input.tax),
        total: this.formatCurrency(input.total),
        trackingUrl,
      }),
    });
  }

  private getStripeSignatureParts(signatureHeader: string) {
    const parts = signatureHeader.split(',').map((part) => part.trim());
    const entries = new Map<string, string>();

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key && value) {
        entries.set(key, value);
      }
    }

    return {
      timestamp: entries.get('t'),
      v1: entries.get('v1'),
    };
  }

  /**
   * Verifies Stripe webhook signatures using timestamp + HMAC SHA256.
   * @param payload The payload to verify.
   * @param signatureHeader The signature header to verify against.
   * @param webhookSecret The webhook secret to use for verification.
   * @returns True if the signature is valid, false otherwise.
   */
  verifyStripeWebhookSignature(payload: string, signatureHeader: string, webhookSecret: string) {
    const { timestamp, v1 } = this.getStripeSignatureParts(signatureHeader);
    if (!timestamp || !v1) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(signedPayload)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const receivedBuffer = Buffer.from(v1, 'hex');

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    const timestampMs = Number(timestamp) * 1000;
    const toleranceMs = 5 * 60 * 1000;
    if (Number.isFinite(timestampMs) && Math.abs(Date.now() - timestampMs) > toleranceMs) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  }

  private toStripeMinorUnits(amount: number | string) {
    return Math.max(0, Math.round(Number(amount) * 100));
  }

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

  /**
   * Creates a Stripe Checkout Session and stores `stripeSessionId` on the order.
   */
  async createStripeCheckoutSession(input: {
    orderId: string;
    orderNumber: string;
    currency: string;
    items: Array<{
      productName: string;
      productPrice: number | string;
      quantity: number;
    }>;
    shippingCost: number | string;
    customerEmail?: string;
  }) {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      throw new AppError('Stripe is not configured. Missing STRIPE_SECRET_KEY.', 500);
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const currency = input.currency.toLowerCase();
    const params = new URLSearchParams();

    const successParams = new URLSearchParams({ order: input.orderNumber });
    if (input.customerEmail) successParams.set('email', input.customerEmail);

    params.append('mode', 'payment');
    params.append('success_url', `${frontendUrl}/checkout/success?${successParams.toString()}`);
    params.append('cancel_url', `${frontendUrl}/checkout/success?status=cancelled&order=${input.orderNumber}`);
    params.append('metadata[orderId]', input.orderId);
    params.append('payment_intent_data[metadata][orderId]', input.orderId);

    if (input.customerEmail) {
      params.append('customer_email', input.customerEmail);
    }

    input.items.forEach((item, index) => {
      params.append(`line_items[${index}][price_data][currency]`, currency);
      params.append(`line_items[${index}][price_data][product_data][name]`, item.productName);
      params.append(
        `line_items[${index}][price_data][unit_amount]`,
        String(this.toStripeMinorUnits(item.productPrice)),
      );
      params.append(`line_items[${index}][quantity]`, String(item.quantity));
    });

    const shippingMinor = this.toStripeMinorUnits(input.shippingCost);
    if (shippingMinor > 0) {
      const shippingIndex = input.items.length;
      params.append(`line_items[${shippingIndex}][price_data][currency]`, currency);
      params.append(`line_items[${shippingIndex}][price_data][product_data][name]`, 'Shipping');
      params.append(`line_items[${shippingIndex}][price_data][unit_amount]`, String(shippingMinor));
      params.append(`line_items[${shippingIndex}][quantity]`, '1');
    }

    const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    const stripeData = (await stripeRes.json().catch(() => ({}))) as {
      id?: string;
      url?: string;
      error?: { message?: string };
    };

    if (!stripeRes.ok || !stripeData.id || !stripeData.url) {
      throw new AppError(
        stripeData.error?.message || 'Unable to create Stripe Checkout session',
        502,
      );
    }

    await this.prisma.order.update({
      where: { id: input.orderId },
      data: { stripeSessionId: stripeData.id },
    });

    return {
      id: stripeData.id,
      url: stripeData.url,
    };
  }

  private async updateOrderStatusFromWebhook(input: {
    orderId: string;
    nextStatus: 'PROCESSING' | 'CANCELLED';
    note: string;
    stripePaymentIntentId?: string;
  }) {
    const order = await this.prisma.order.findUnique({ where: { id: input.orderId } });

    if (!order) return { order: null, statusChanged: false };

    if (order.status === input.nextStatus) {
      if (input.stripePaymentIntentId && !order.stripePaymentIntentId) {
        await this.prisma.order.update({
          where: { id: order.id },
          data: { stripePaymentIntentId: input.stripePaymentIntentId },
        });
      }
      return { order, statusChanged: false };
    }

    const [updatedOrder] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: order.id },
        data: {
          status: input.nextStatus,
          ...(input.stripePaymentIntentId && {
            stripePaymentIntentId: input.stripePaymentIntentId,
          }),
        },
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: input.nextStatus,
          note: input.note,
        },
      }),
    ]);

    return { order: updatedOrder, statusChanged: true };
  }

  /**
   * Handles Stripe webhook events relevant to order lifecycle transitions.
   */
  async handleStripeWebhookEvent(event: {
    type?: string;
    data?: { object?: Record<string, unknown> };
  }) {
    const eventType = event.type;
    const object = event.data?.object;

    if (!eventType || !object) {
      return { handled: false, reason: 'Malformed event payload' };
    }

    if (eventType === 'payment_intent.payment_failed' || eventType === 'payment_intent.canceled') {
      const paymentIntentId = typeof object.id === 'string' ? object.id : undefined;
      const metadata =
        typeof object.metadata === 'object' && object.metadata !== null
          ? (object.metadata as Record<string, unknown>)
          : undefined;
      const metadataOrderId = metadata && typeof metadata.orderId === 'string' ? metadata.orderId : undefined;

      const order = metadataOrderId
        ? await this.prisma.order.findUnique({ where: { id: metadataOrderId } })
        : paymentIntentId
          ? await this.prisma.order.findFirst({ where: { stripePaymentIntentId: paymentIntentId } })
          : null;

      if (!order) {
        return { handled: false, reason: 'Order not found for payment intent' };
      }

      await this.updateOrderStatusFromWebhook({
        orderId: order.id,
        nextStatus: 'CANCELLED',
        note: `Stripe event: ${eventType}`,
        stripePaymentIntentId: paymentIntentId,
      });

      return { handled: true };
    }

    const checkoutSessionId = typeof object.id === 'string' ? object.id : undefined;
    if (!checkoutSessionId) {
      return { handled: false, reason: 'Missing checkout session id' };
    }

    const order = await this.prisma.order.findFirst({
      where: { stripeSessionId: checkoutSessionId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          select: {
            productName: true,
            productPrice: true,
            quantity: true,
          },
        },
      },
    });

    if (!order) {
      return { handled: false, reason: 'Order not found for checkout session' };
    }

    const paymentIntentId =
      typeof object.payment_intent === 'string' ? object.payment_intent : undefined;

    switch (eventType) {
      case 'checkout.session.completed': {
        const updateResult = await this.updateOrderStatusFromWebhook({
          orderId: order.id,
          nextStatus: 'PROCESSING',
          note: `Stripe event: ${eventType}`,
          stripePaymentIntentId: paymentIntentId,
        });

        const customerEmail = order.guestEmail || order.user?.email;
        const customerName =
          order.user?.name || this.getNameFromShippingAddress(order.shippingAddress) || 'there';

        if (updateResult.statusChanged && customerEmail) {
          try {
            await this.sendOrderConfirmationEmail({
              orderNumber: order.orderNumber,
              customerEmail,
              customerName,
              guestEmail: order.guestEmail,
              items: order.items,
              subtotal: order.subtotal,
              shippingCost: order.shippingCost,
              tax: order.tax,
              total: order.total,
            });
          } catch {
            // Do not fail webhook acknowledgment for email delivery issues.
          }
        }

        return { handled: true };
      }

      case 'checkout.session.async_payment_succeeded':
        await this.updateOrderStatusFromWebhook({
          orderId: order.id,
          nextStatus: 'PROCESSING',
          note: `Stripe event: ${eventType}`,
          stripePaymentIntentId: paymentIntentId,
        });
        return { handled: true };

      case 'checkout.session.expired':
      case 'checkout.session.async_payment_failed':
        await this.updateOrderStatusFromWebhook({
          orderId: order.id,
          nextStatus: 'CANCELLED',
          note: `Stripe event: ${eventType}`,
          stripePaymentIntentId: paymentIntentId,
        });
        return { handled: true };

      default:
        return { handled: true, ignored: true };
    }
  }

  /**
   * Creates an order from current cart contents and atomically reserves stock.
   *
   * @throws {AppError} For empty carts, invalid guest sessions, or stock conflicts.
   */
  async createOrder(input: CheckoutInput) {
    if (!input.userId && !input.sessionId) {
      throw new AppError('Session ID required for guest checkout', 400);
    }

    const cart = await this.prisma.cart.findFirst({
      where: input.userId ? { userId: input.userId } : { sessionId: input.sessionId },
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
