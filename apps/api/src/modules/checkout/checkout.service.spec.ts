import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { CheckoutService } from './checkout.service';

type OrderRecord = {
  id: string;
  status: 'PENDING' | 'PROCESSING' | 'CANCELLED';
  stripeSessionId?: string | null;
  stripePaymentIntentId?: string | null;
};

function createMockPrisma(initialOrders: OrderRecord[]) {
  const orders = new Map(initialOrders.map((order) => [order.id, { ...order }]));
  const history: Array<{ orderId: string; status: string; note?: string }> = [];

  const prisma = {
    order: {
      findUnique: async ({ where: { id } }: { where: { id: string } }) => {
        return orders.get(id) ?? null;
      },
      findFirst: async ({ where }: { where: { stripeSessionId?: string; stripePaymentIntentId?: string } }) => {
        for (const order of orders.values()) {
          if (where.stripeSessionId && order.stripeSessionId === where.stripeSessionId) {
            return order;
          }
          if (where.stripePaymentIntentId && order.stripePaymentIntentId === where.stripePaymentIntentId) {
            return order;
          }
        }
        return null;
      },
      update: async ({
        where: { id },
        data,
      }: {
        where: { id: string };
        data: Partial<OrderRecord>;
      }) => {
        const current = orders.get(id);
        if (!current) throw new Error('Order not found in mock');
        const updated = { ...current, ...data };
        orders.set(id, updated);
        return updated;
      },
    },
    orderStatusHistory: {
      create: async ({
        data,
      }: {
        data: { orderId: string; status: string; note?: string };
      }) => {
        history.push(data);
        return data;
      },
    },
    $transaction: async (operations: Array<Promise<unknown>>) => {
      return Promise.all(operations);
    },
  };

  return {
    prisma,
    getOrder: (id: string) => orders.get(id),
    getHistory: () => history,
  };
}

async function testVerifyStripeWebhookSignature() {
  const mock = createMockPrisma([]);
  const service = new CheckoutService(mock.prisma as never);

  const webhookSecret = 'whsec_test_secret';
  const payload = JSON.stringify({ type: 'checkout.session.completed' });
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(signedPayload)
    .digest('hex');

  const valid = service.verifyStripeWebhookSignature(
    payload,
    `t=${timestamp},v1=${signature}`,
    webhookSecret,
  );

  assert.equal(valid, true, 'Expected Stripe signature verification to pass');
}

async function testHandlePaymentFailedEventCancelsOrder() {
  const mock = createMockPrisma([
    {
      id: 'order_failed_1',
      status: 'PENDING',
      stripeSessionId: 'cs_test_failed_1',
      stripePaymentIntentId: null,
    },
  ]);

  const service = new CheckoutService(mock.prisma as never);

  const result = await service.handleStripeWebhookEvent({
    type: 'payment_intent.payment_failed',
    data: {
      object: {
        id: 'pi_test_failed_1',
        metadata: {
          orderId: 'order_failed_1',
        },
      },
    },
  });

  assert.equal(result.handled, true, 'Expected failed payment event to be handled');

  const updatedOrder = mock.getOrder('order_failed_1');
  assert.equal(updatedOrder?.status, 'CANCELLED', 'Expected order status to become CANCELLED');
  assert.equal(
    updatedOrder?.stripePaymentIntentId,
    'pi_test_failed_1',
    'Expected payment intent id to be persisted',
  );

  const history = mock.getHistory();
  assert.equal(history.length, 1, 'Expected one status history entry');
  assert.equal(history[0]?.status, 'CANCELLED', 'Expected CANCELLED history status');
}

async function testHandleCheckoutCompletedEventMovesToProcessing() {
  const mock = createMockPrisma([
    {
      id: 'order_success_1',
      status: 'PENDING',
      stripeSessionId: 'cs_test_success_1',
      stripePaymentIntentId: null,
    },
  ]);

  const service = new CheckoutService(mock.prisma as never);

  const result = await service.handleStripeWebhookEvent({
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_success_1',
        payment_intent: 'pi_test_success_1',
      },
    },
  });

  assert.equal(result.handled, true, 'Expected completed checkout event to be handled');

  const updatedOrder = mock.getOrder('order_success_1');
  assert.equal(updatedOrder?.status, 'PROCESSING', 'Expected order status to become PROCESSING');
  assert.equal(
    updatedOrder?.stripePaymentIntentId,
    'pi_test_success_1',
    'Expected payment intent id to be persisted',
  );

  const history = mock.getHistory();
  assert.equal(history.length, 1, 'Expected one status history entry');
  assert.equal(history[0]?.status, 'PROCESSING', 'Expected PROCESSING history status');
}

async function run() {
  await testVerifyStripeWebhookSignature();
  await testHandlePaymentFailedEventCancelsOrder();
  await testHandleCheckoutCompletedEventMovesToProcessing();
  console.log('checkout.service webhook tests passed');
}

run().catch((error) => {
  console.error('checkout.service webhook tests failed');
  console.error(error);
  process.exit(1);
});
