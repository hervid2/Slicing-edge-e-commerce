import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { RATING_MIN, RATING_MAX } from '@slicing-edge/shared';
import { ReviewService } from './review.service';
import { authenticate, optionalAuth } from '../../middleware/auth';

const reviewBodySchema = z.object({
  rating: z.number().int().min(RATING_MIN).max(RATING_MAX),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000),
});

/**
 * Registers product review routes.
 */
export async function reviewRoutes(app: FastifyInstance) {
  const reviewService = new ReviewService(app.prisma);

  app.get<{ Params: { productId: string }; Querystring: { page?: string; limit?: string } }>(
    '/products/:productId/reviews',
    {
      schema: {
        tags: ['Reviews'],
        summary: 'List reviews for a product',
        description: 'Returns paginated reviews for the given product.',
        params: {
          type: 'object',
          required: ['productId'],
          properties: { productId: { type: 'string' } },
        },
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string' },
            limit: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              reviews: { type: 'array', items: { type: 'object' } },
              pagination: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { productId } = request.params;
      const page = Number(request.query.page) || 1;
      const limit = Number(request.query.limit) || 10;
      const result = await reviewService.list(productId, page, limit);
      return reply.send(result);
    },
  );

  app.post<{ Params: { productId: string } }>(
    '/products/:productId/reviews',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Reviews'],
        summary: 'Create a review',
        description: 'Authenticated users may submit one review per product.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['productId'],
          properties: { productId: { type: 'string' } },
        },
        body: {
          type: 'object',
          required: ['rating', 'comment'],
          properties: {
            rating: { type: 'integer', minimum: RATING_MIN, maximum: RATING_MAX },
            comment: { type: 'string', minLength: 10, maxLength: 1000 },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: { review: { type: 'object', additionalProperties: true } },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { productId: string } }>, reply: FastifyReply) => {
      const { productId } = request.params;
      const { rating, comment } = reviewBodySchema.parse(request.body);
      const review = await reviewService.create(request.user!.sub, productId, rating, comment);
      return reply.status(201).send({ review });
    },
  );

  app.delete<{ Params: { productId: string; reviewId: string } }>(
    '/products/:productId/reviews/:reviewId',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Reviews'],
        summary: 'Delete a review',
        description: 'Users may delete their own review. Admins may delete any review.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['productId', 'reviewId'],
          properties: {
            productId: { type: 'string' },
            reviewId: { type: 'string' },
          },
        },
        response: {
          204: { type: 'null', description: 'Review deleted' },
        },
      },
    },
    async (request, reply) => {
      const { reviewId } = request.params;
      const isAdmin = request.user!.role === 'ADMIN';
      await reviewService.delete(reviewId, request.user!.sub, isAdmin);
      return reply.status(204).send();
    },
  );
}
