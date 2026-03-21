import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { productQuerySchema, createProductSchema, updateProductSchema } from '@slicing-edge/shared';
import { ProductService } from './product.service';
import { authenticate, requireAdmin } from '../../middleware/auth';

export async function productRoutes(app: FastifyInstance) {
  const productService = new ProductService(app.prisma);

  // GET /api/products — public product listing with filtering
  app.get('/products', async (request: FastifyRequest, reply: FastifyReply) => {
    const query = productQuerySchema.parse(request.query);
    const result = await productService.list(query);
    return reply.send(result);
  });

  // GET /api/products/featured — featured products
  app.get('/products/featured', async (_request: FastifyRequest, reply: FastifyReply) => {
    const products = await productService.getFeatured();
    return reply.send({ products });
  });

  // GET /api/products/:slug — single product by slug
  app.get(
    '/products/:slug',
    async (request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
      const product = await productService.getBySlug(request.params.slug);
      return reply.send({ product });
    },
  );

  // POST /api/products — admin create product
  app.post(
    '/products',
    { preHandler: [authenticate, requireAdmin] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createProductSchema.parse(request.body);
      const product = await productService.create(body);
      return reply.status(201).send({ product });
    },
  );

  // PATCH /api/products/:id — admin update product
  app.patch<{ Params: { id: string } }>(
    '/products/:id',
    { preHandler: [authenticate, requireAdmin] },
    async (request, reply) => {
      const body = updateProductSchema.parse(request.body);
      const product = await productService.update(request.params.id, body);
      return reply.send({ product });
    },
  );
}
