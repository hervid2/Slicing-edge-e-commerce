import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createCategorySchema, updateCategorySchema } from '@slicing-edge/shared';
import { authenticate, requireAdmin } from '../../middleware/auth';

/**
 * Registers category catalog and category management routes.
 */
export async function categoryRoutes(app: FastifyInstance) {
  app.get(
    '/categories',
    {
      schema: {
        tags: ['Categories'],
        summary: 'List categories',
        description: 'Returns all active categories sorted by display position.',
        response: {
          200: {
            type: 'object',
            properties: {
              categories: { type: 'array', items: { type: 'object', additionalProperties: true } },
            },
          },
        },
      },
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const categories = await app.prisma.category.findMany({
        where: { isActive: true },
        orderBy: { position: 'asc' },
        include: { _count: { select: { products: true } } },
      });
      return reply.send({ categories });
    },
  );

  app.get(
    '/categories/:slug',
    {
      schema: {
        tags: ['Categories'],
        summary: 'Get category by slug',
        description: 'Returns one active category by slug.',
        params: {
          type: 'object',
          required: ['slug'],
          properties: {
            slug: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              category: { type: 'object', additionalProperties: true },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
      const category = await app.prisma.category.findUnique({
        where: { slug: request.params.slug, isActive: true },
        include: { _count: { select: { products: true } } },
      });
      if (!category) {
        return reply.status(404).send({ error: 'Category not found' });
      }
      return reply.send({ category });
    },
  );

  app.post(
    '/categories',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'Categories'],
        summary: 'Create category',
        description: 'Admin endpoint to create a category.',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name', 'slug'],
          properties: {
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string' },
            imageUrl: { type: 'string' },
            position: { type: 'integer' },
            isActive: { type: 'boolean' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              category: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createCategorySchema.parse(request.body);
      const category = await app.prisma.category.create({ data: body });
      return reply.status(201).send({ category });
    },
  );

  app.get(
    '/admin/categories',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'Categories'],
        summary: 'List all categories (admin)',
        description: 'Admin endpoint returning all categories including inactive ones.',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              categories: { type: 'array', items: { type: 'object', additionalProperties: true } },
            },
          },
        },
      },
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const categories = await app.prisma.category.findMany({
        orderBy: { position: 'asc' },
        include: { _count: { select: { products: true } } },
      });
      return reply.send({ categories });
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/categories/:id',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'Categories'],
        summary: 'Update category',
        description: 'Admin endpoint to update a category by id.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string' },
            imageUrl: { type: 'string' },
            position: { type: 'integer' },
            isActive: { type: 'boolean' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              category: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const body = updateCategorySchema.parse(request.body);
      const category = await app.prisma.category.update({
        where: { id: request.params.id },
        data: body,
      });
      return reply.send({ category });
    },
  );
}
