import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'node:crypto';
import { CheckoutService } from '../../modules/checkout/checkout.service';
import { AppError } from '../../middleware/error-handler';
import { createMockPrisma } from '../helpers/mock-prisma';

// Don't send real emails in tests
vi.mock('@slicing-edge/email', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  OrderConfirmationEmail: vi.fn().mockReturnValue(null),
}));

const SHIPPING_ADDRESS = {
  fullName: 'Alice Test',
  street: '123 Main St',
  city: 'Springfield',
  state: 'IL',
  zipCode: '62701',
  country: 'US',
};

describe('CheckoutService', () => {
  let prisma: ReturnType<typeof createMockPrisma>;
  let service: CheckoutService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new CheckoutService(prisma);
    vi.clearAllMocks();
  });

  // ─── verifyStripeWebhookSignature ────────────────────────────────────────────

  describe('verifyStripeWebhookSignature', () => {
    it('returns true for a valid HMAC signature', () => {
      const secret = 'whsec_test_secret';
      const payload = JSON.stringify({ type: 'checkout.session.completed' });
      const timestamp = Math.floor(Date.now() / 1000);
      const signedPayload = `${timestamp}.${payload}`;
      const sig = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

      expect(
        service.verifyStripeWebhookSignature(payload, `t=${timestamp},v1=${sig}`, secret),
      ).toBe(true);
    });

    it('returns false for an incorrect secret', () => {
      const payload = '{"type":"test"}';
      const timestamp = Math.floor(Date.now() / 1000);
      const sig = crypto
        .createHmac('sha256', 'wrong_secret')
        .update(`${timestamp}.${payload}`)
        .digest('hex');

      expect(
        service.verifyStripeWebhookSignature(payload, `t=${timestamp},v1=${sig}`, 'real_secret'),
      ).toBe(false);
    });

    it('returns false for a malformed signature header', () => {
      expect(service.verifyStripeWebhookSignature('{}', 'not-a-valid-header', 'secret')).toBe(
        false,
      );
    });
  });

  // ─── handleStripeWebhookEvent ─────────────────────────────────────────────────

  describe('handleStripeWebhookEvent', () => {
    const makePendingOrder = (overrides = {}) => ({
      id: 'order_1',
      status: 'PENDING' as const,
      stripeSessionId: 'cs_123',
      stripePaymentIntentId: null,
      orderNumber: 'SE-001',
      guestEmail: 'test@example.com',
      user: null,
      items: [],
      subtotal: '100',
      shippingCost: '9.99',
      tax: '0',
      total: '109.99',
      shippingAddress: { fullName: 'Alice' },
      ...overrides,
    });

    it('marks order as PROCESSING on checkout.session.completed', async () => {
      const order = makePendingOrder();

      // handleStripeWebhookEvent uses findFirst (with include) to load the full order
      prisma.order.findFirst.mockResolvedValue(order);
      // updateOrderStatusFromWebhook uses findUnique to check current status
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.order.update.mockResolvedValue({ ...order, status: 'PROCESSING' });
      prisma.orderStatusHistory.create.mockResolvedValue({});

      const result = await service.handleStripeWebhookEvent({
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_123', payment_intent: 'pi_test' } },
      });

      expect(result.handled).toBe(true);
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'order_1' },
          data: expect.objectContaining({ status: 'PROCESSING' }),
        }),
      );
    });

    it('marks order as CANCELLED on payment_intent.payment_failed', async () => {
      const order = makePendingOrder({ id: 'order_2', stripeSessionId: null });

      // payment_intent.payment_failed uses findUnique (via metadata.orderId) then findUnique again
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.order.update.mockResolvedValue({ ...order, status: 'CANCELLED' });
      prisma.orderStatusHistory.create.mockResolvedValue({});

      const result = await service.handleStripeWebhookEvent({
        type: 'payment_intent.payment_failed',
        data: { object: { id: 'pi_failed', metadata: { orderId: 'order_2' } } },
      });

      expect(result.handled).toBe(true);
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'CANCELLED' }),
        }),
      );
    });

    it('returns handled=false when order is not found for the session', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      const result = await service.handleStripeWebhookEvent({
        type: 'checkout.session.completed',
        data: { object: { id: 'cs_unknown' } },
      });

      expect(result.handled).toBe(false);
    });

    it('marks order CANCELLED on checkout.session.expired', async () => {
      const order = makePendingOrder({ id: 'order_3', stripeSessionId: 'cs_expired' });

      prisma.order.findFirst.mockResolvedValue(order);
      // updateOrderStatusFromWebhook re-fetches via findUnique
      prisma.order.findUnique.mockResolvedValue(order);
      prisma.order.update.mockResolvedValue({ ...order, status: 'CANCELLED' });
      prisma.orderStatusHistory.create.mockResolvedValue({});

      const result = await service.handleStripeWebhookEvent({
        type: 'checkout.session.expired',
        data: { object: { id: 'cs_expired' } },
      });

      expect(result.handled).toBe(true);
      expect(prisma.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'CANCELLED' }),
        }),
      );
    });

    it('returns handled=false when the event payload is malformed', async () => {
      const result = await service.handleStripeWebhookEvent({
        type: undefined,
        data: undefined,
      });

      expect(result.handled).toBe(false);
    });
  });

  // ─── createOrder ──────────────────────────────────────────────────────────────

  describe('createOrder', () => {
    it('throws 400 when neither userId nor sessionId is provided', async () => {
      await expect(
        service.createOrder({ shippingAddress: SHIPPING_ADDRESS }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws 400 when the cart is empty', async () => {
      prisma.cart.findFirst.mockResolvedValue({ id: 'cart_1', items: [] });

      await expect(
        service.createOrder({ sessionId: 'sess_1', shippingAddress: SHIPPING_ADDRESS }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    it('throws 400 when a product is out of stock', async () => {
      prisma.cart.findFirst.mockResolvedValue({
        id: 'cart_1',
        items: [
          {
            id: 'ci_1',
            productId: 'prod_1',
            quantity: 5,
            product: {
              id: 'prod_1',
              name: 'Chef Knife',
              price: '89.99',
              stock: 2, // less than requested quantity
              isActive: true,
              version: 1,
              images: [],
            },
          },
        ],
      });

      await expect(
        service.createOrder({ sessionId: 'sess_1', shippingAddress: SHIPPING_ADDRESS }),
      ).rejects.toThrow(AppError);
    });

    it('throws 400 when a product is inactive', async () => {
      prisma.cart.findFirst.mockResolvedValue({
        id: 'cart_1',
        items: [
          {
            id: 'ci_1',
            productId: 'prod_2',
            quantity: 1,
            product: {
              id: 'prod_2',
              name: 'Discontinued Knife',
              price: '50.00',
              stock: 10,
              isActive: false,
              version: 1,
              images: [],
            },
          },
        ],
      });

      await expect(
        service.createOrder({ sessionId: 'sess_1', shippingAddress: SHIPPING_ADDRESS }),
      ).rejects.toThrow(AppError);
    });

    it('creates an order, decrements stock, and clears the cart', async () => {
      const product = {
        id: 'prod_3',
        name: 'Santoku',
        price: '120.00',
        stock: 10,
        isActive: true,
        version: 1,
        images: [{ url: 'https://example.com/knife.jpg', position: 0 }],
      };

      prisma.cart.findFirst.mockResolvedValue({
        id: 'cart_2',
        items: [{ id: 'ci_2', productId: 'prod_3', quantity: 2, product }],
      });

      const createdOrder = {
        id: 'order_new',
        orderNumber: 'SE-XYZ',
        status: 'PENDING',
        items: [],
        statusHistory: [],
      };

      prisma.$transaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
        const txMock = {
          order: { create: vi.fn().mockResolvedValue(createdOrder) },
          product: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
          cartItem: { deleteMany: vi.fn().mockResolvedValue({}) },
        };
        return fn(txMock);
      });

      const order = await service.createOrder({
        sessionId: 'sess_2',
        shippingAddress: SHIPPING_ADDRESS,
      });

      expect(order.orderNumber).toMatch(/^SE-/);
      expect(prisma.$transaction).toHaveBeenCalledOnce();
    });
  });
});
