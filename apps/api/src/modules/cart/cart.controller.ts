import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { addToCartSchema, updateCartItemSchema } from '@slicing-edge/shared';
import { CartService } from './cart.service';
import { optionalAuth } from '../../middleware/auth';

/**
 * Registers cart endpoints for guest and authenticated users.
 */
export async function cartRoutes(app: FastifyInstance) {
  const cartService = new CartService(app.prisma);

  app.get(
    '/cart',
    {
      preHandler: [optionalAuth],
      schema: {
        tags: ['Cart'],
        summary: 'Get current cart',
        description: 'Returns cart for authenticated user or guest session.',
        headers: {
          type: 'object',
          properties: {
            'x-session-id': { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              cart: { type: 'object' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const userId = request.user?.sub;
      const sessionId = (request.headers['x-session-id'] as string) || undefined;
      const cart = await cartService.getOrCreateCart(userId, sessionId);
      return reply.send({ cart });
    },
  );

  app.post(
    '/cart/items',
    {
      preHandler: [optionalAuth],
      schema: {
        tags: ['Cart'],
        summary: 'Add item to cart',
        description: 'Adds a product to cart or increments existing quantity.',
        headers: {
          type: 'object',
          properties: {
            'x-session-id': { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['productId', 'quantity'],
          properties: {
            productId: { type: 'string' },
            quantity: { type: 'integer', minimum: 1 },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              item: { type: 'object' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { productId, quantity } = addToCartSchema.parse(request.body);
      const userId = request.user?.sub;
      const sessionId = (request.headers['x-session-id'] as string) || undefined;
      const cart = await cartService.getOrCreateCart(userId, sessionId);
      const item = await cartService.addItem(cart.id, productId, quantity);
      return reply.status(201).send({ item });
    },
  );

  app.patch<{ Params: { itemId: string } }>(
    '/cart/items/:itemId',
    {
      preHandler: [optionalAuth],
      schema: {
        tags: ['Cart'],
        summary: 'Update cart item quantity',
        description: 'Updates quantity for an existing cart item.',
        params: {
          type: 'object',
          required: ['itemId'],
          properties: {
            itemId: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['quantity'],
          properties: {
            quantity: { type: 'integer', minimum: 1 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              item: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { quantity } = updateCartItemSchema.parse(request.body);
      const item = await cartService.updateItemQuantity(request.params.itemId, quantity);
      return reply.send({ item });
    },
  );

  app.delete<{ Params: { itemId: string } }>(
    '/cart/items/:itemId',
    {
      preHandler: [optionalAuth],
      schema: {
        tags: ['Cart'],
        summary: 'Remove cart item',
        description: 'Removes one item from cart.',
        params: {
          type: 'object',
          required: ['itemId'],
          properties: {
            itemId: { type: 'string' },
          },
        },
        response: {
          204: {
            type: 'null',
          },
        },
      },
    },
    async (request, reply) => {
      await cartService.removeItem(request.params.itemId);
      return reply.status(204).send();
    },
  );
}
