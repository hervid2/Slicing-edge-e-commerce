import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createCategorySchema, updateCategorySchema } from '@slicing-edge/shared';
import { authenticate, requireAdmin } from '../../middleware/auth';

export async function categoryRoutes(app: FastifyInstance) {
  // GET /api/categories — public list all active categories
  app.get('/categories', async (_request: FastifyRequest, reply: FastifyReply) => {
    const categories = await app.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { position: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    return reply.send({ categories });
  });

  // GET /api/categories/:slug — single category by slug
  app.get(
    '/categories/:slug',
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

  // POST /api/categories — admin create
  app.post(
    '/categories',
    { preHandler: [authenticate, requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createCategorySchema.parse(request.body);
      const category = await app.prisma.category.create({ data: body });
      return reply.status(201).send({ category });
    },
  );

  // PATCH /api/categories/:id — admin update
  app.patch<{ Params: { id: string } }>(
    '/categories/:id',
    { preHandler: [authenticate, requireAdmin] },
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
