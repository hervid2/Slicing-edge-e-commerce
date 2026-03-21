import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { addToCartSchema, updateCartItemSchema } from '@slicing-edge/shared';
import { CartService } from './cart.service';
import { authenticate, optionalAuth } from '../../middleware/auth';

export async function cartRoutes(app: FastifyInstance) {
  const cartService = new CartService(app.prisma);

  // GET /api/cart — get current cart
  app.get(
    '/cart',
    { preHandler: [optionalAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user?.sub;
      const sessionId = (request.headers['x-session-id'] as string) || undefined;
      const cart = await cartService.getOrCreateCart(userId, sessionId);
      return reply.send({ cart });
    },
  );

  // POST /api/cart/items — add item to cart
  app.post(
    '/cart/items',
    { preHandler: [optionalAuth] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { productId, quantity } = addToCartSchema.parse(request.body);
      const userId = request.user?.sub;
      const sessionId = (request.headers['x-session-id'] as string) || undefined;
      const cart = await cartService.getOrCreateCart(userId, sessionId);
      const item = await cartService.addItem(cart.id, productId, quantity);
      return reply.status(201).send({ item });
    },
  );

  // PATCH /api/cart/items/:itemId — update item quantity
  app.patch<{ Params: { itemId: string } }>(
    '/cart/items/:itemId',
    { preHandler: [optionalAuth] },
    async (request, reply) => {
      const { quantity } = updateCartItemSchema.parse(request.body);
      const item = await cartService.updateItemQuantity(request.params.itemId, quantity);
      return reply.send({ item });
    },
  );

  // DELETE /api/cart/items/:itemId — remove item from cart
  app.delete<{ Params: { itemId: string } }>(
    '/cart/items/:itemId',
    { preHandler: [optionalAuth] },
    async (request, reply) => {
      await cartService.removeItem(request.params.itemId);
      return reply.status(204).send();
    },
  );
}
