import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { checkoutSchema } from '@slicing-edge/shared';
import { CheckoutService } from './checkout.service';
import { optionalAuth } from '../../middleware/auth';

export async function checkoutRoutes(app: FastifyInstance) {
  const checkoutService = new CheckoutService(app.prisma);

  // POST /api/checkout/webhook
  app.post(
    '/checkout/webhook',
    { config: { rawBody: true } },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const signature = request.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        return reply.status(500).send({
          error: 'Configuration Error',
          message: 'Missing STRIPE_WEBHOOK_SECRET',
        });
      }

      if (typeof signature !== 'string' || !signature) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Missing stripe-signature header',
        });
      }

      const payload = request.rawBody;

      if (typeof payload !== 'string' || !payload) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Missing raw webhook payload',
        });
      }

      const isValidSignature = checkoutService.verifyStripeWebhookSignature(
        payload,
        signature,
        webhookSecret,
      );

      if (!isValidSignature) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid Stripe webhook signature',
        });
      }

      let event: { type?: string; data?: { object?: Record<string, unknown> } };
      try {
        event = JSON.parse(payload) as { type?: string; data?: { object?: Record<string, unknown> } };
      } catch {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'Invalid JSON payload',
        });
      }

      const result = await checkoutService.handleStripeWebhookEvent(event);

      if (!result.handled && result.reason === 'Malformed event payload') {
        return reply.status(400).send({
          error: 'Validation Error',
          message: result.reason,
        });
      }

      return reply.status(200).send({ received: true });
    },
  );

  // POST /api/checkout
  app.post(
    '/checkout',
    { preHandler: [optionalAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = checkoutSchema.parse(request.body);
      const sessionId = (request.headers['x-session-id'] as string) || undefined;

      if (!request.user?.sub && !body.guestEmail) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'guestEmail is required for guest checkout',
        });
      }

      if (!request.user?.sub && !sessionId) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'x-session-id is required for guest checkout',
        });
      }

      if (!body.shippingAddress) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'shippingAddress is required',
        });
      }

      const order = await checkoutService.createOrder({
        userId: request.user?.sub,
        sessionId,
        guestEmail: body.guestEmail,
        shippingAddress: body.shippingAddress,
      });

      const stripeSession = await checkoutService.createStripeCheckoutSession({
        orderId: order.id,
        orderNumber: order.orderNumber,
        currency: order.currency,
        items: order.items.map((item) => ({
          productName: item.productName,
          productPrice: Number(item.productPrice),
          quantity: item.quantity,
        })),
        shippingCost: Number(order.shippingCost),
        customerEmail: order.guestEmail || request.user?.email,
      });

      return reply.status(201).send({
        order,
        checkoutUrl: stripeSession.url,
        stripeSessionId: stripeSession.id,
      });
    },
  );
}
