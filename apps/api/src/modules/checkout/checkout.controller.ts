import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { checkoutSchema } from '@slicing-edge/shared';
import { CheckoutService } from './checkout.service';
import { optionalAuth } from '../../middleware/auth';

export async function checkoutRoutes(app: FastifyInstance) {
  const checkoutService = new CheckoutService(app.prisma);

  // POST /api/checkout
  app.post(
    '/checkout',
    { preHandler: [optionalAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = checkoutSchema.parse(request.body);

      if (!request.user?.sub && !body.guestEmail) {
        return reply.status(400).send({
          error: 'Validation Error',
          message: 'guestEmail is required for guest checkout',
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
        guestEmail: body.guestEmail,
        shippingAddress: body.shippingAddress,
      });

      // TODO: Create Stripe Checkout Session and return URL
      return reply.status(201).send({
        order,
        message: 'Order created. Stripe checkout session integration pending.',
      });
    },
  );
}
