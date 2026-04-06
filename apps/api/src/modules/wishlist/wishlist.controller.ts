import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { WishlistService } from './wishlist.service';
import { authenticate } from '../../middleware/auth';

const toggleBodySchema = z.object({
  productId: z.string().cuid(),
});

/**
 * Registers wishlist routes. All routes require authentication.
 */
export async function wishlistRoutes(app: FastifyInstance) {
  const wishlistService = new WishlistService(app.prisma);

  app.get(
    '/wishlist',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Wishlist'],
        summary: 'Get wishlist',
        description: 'Returns all wishlist items with product details for the authenticated user.',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              items: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const items = await wishlistService.getWishlist(request.user!.sub);
      return reply.send({ items });
    },
  );

  app.post(
    '/wishlist',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Wishlist'],
        summary: 'Toggle wishlist item',
        description: 'Adds the product to the wishlist if not present; removes it if already saved.',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['productId'],
          properties: {
            productId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              added: { type: 'boolean' },
              productId: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { productId } = toggleBodySchema.parse(request.body);
      const result = await wishlistService.toggle(request.user!.sub, productId);
      return reply.send(result);
    },
  );
}
