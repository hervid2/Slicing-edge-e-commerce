import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { productQuerySchema, createProductSchema, updateProductSchema } from '@slicing-edge/shared';
import { ProductService } from './product.service';
import { authenticate, requireAdmin } from '../../middleware/auth';

const adminProductQuerySchema = productQuerySchema.extend({
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

/**
 * Registers product catalog and product management routes.
 */
export async function productRoutes(app: FastifyInstance) {
  const productService = new ProductService(app.prisma);

  app.get(
    '/products',
    {
      schema: {
        tags: ['Products'],
        summary: 'List products',
        description: 'Returns paginated products with optional filtering and sorting.',
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string' },
            limit: { type: 'string' },
            categorySlug: { type: 'string' },
            minPrice: { type: 'string' },
            maxPrice: { type: 'string' },
            search: { type: 'string' },
            sortBy: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              products: { type: 'array', items: { type: 'object', additionalProperties: true } },
              pagination: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = productQuerySchema.parse(request.query);
      const result = await productService.list(query);
      return reply.send(result);
    },
  );

  app.get(
    '/products/featured',
    {
      schema: {
        tags: ['Products'],
        summary: 'Get featured products',
        description: 'Returns products flagged as featured.',
        response: {
          200: {
            type: 'object',
            properties: {
              products: { type: 'array', items: { type: 'object', additionalProperties: true } },
            },
          },
        },
      },
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const products = await productService.getFeatured();
      return reply.send({ products });
    },
  );

  app.get(
    '/products/:slug',
    {
      schema: {
        tags: ['Products'],
        summary: 'Get product by slug',
        description: 'Returns a single product detail payload.',
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
              product: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { slug: string } }>, reply: FastifyReply) => {
      const product = await productService.getBySlug(request.params.slug);
      return reply.send({ product });
    },
  );

  app.post(
    '/admin/products',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'Products'],
        summary: 'Create product',
        description: 'Admin endpoint to create a product.',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name', 'slug', 'description', 'price', 'categoryId', 'stock'],
          properties: {
            name: { type: 'string' },
            slug: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            compareAtPrice: { type: 'number' },
            currency: { type: 'string' },
            stock: { type: 'integer' },
            categoryId: { type: 'string' },
            isFeatured: { type: 'boolean' },
            isActive: { type: 'boolean' },
            images: {
              type: 'array',
              items: {
                type: 'object',
                required: ['url'],
                properties: {
                  url: { type: 'string' },
                  cloudinaryPublicId: { type: 'string' },
                  altText: { type: 'string' },
                  position: { type: 'integer' },
                },
              },
            },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              product: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = createProductSchema.parse(request.body);
      const product = await productService.create(body);
      return reply.status(201).send({ product });
    },
  );

  app.get(
    '/admin/products',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'Products'],
        summary: 'List products (admin)',
        description: 'Returns paginated products for admin, including inactive items.',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string' },
            limit: { type: 'string' },
            categorySlug: { type: 'string' },
            minPrice: { type: 'string' },
            maxPrice: { type: 'string' },
            search: { type: 'string' },
            sortBy: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              products: { type: 'array', items: { type: 'object', additionalProperties: true } },
              pagination: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const query = adminProductQuerySchema.parse(request.query);
      const result = await productService.listAdmin(query);
      return reply.send(result);
    },
  );

  app.get<{ Params: { id: string } }>(
    '/admin/products/:id',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'Products'],
        summary: 'Get product by id (admin)',
        description: 'Returns a product by internal id, including inactive products.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              product: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const product = await productService.getById(request.params.id);
      return reply.send({ product });
    },
  );

  app.put<{ Params: { id: string } }>(
    '/admin/products/:id',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'Products'],
        summary: 'Update product',
        description: 'Admin endpoint to update a product by id.',
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
            price: { type: 'number' },
            compareAtPrice: { type: 'number' },
            currency: { type: 'string' },
            stock: { type: 'integer' },
            categoryId: { type: 'string' },
            isFeatured: { type: 'boolean' },
            isActive: { type: 'boolean' },
            images: {
              type: 'array',
              items: {
                type: 'object',
                required: ['url'],
                properties: {
                  url: { type: 'string' },
                  cloudinaryPublicId: { type: 'string' },
                  altText: { type: 'string' },
                  position: { type: 'integer' },
                },
              },
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              product: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const body = updateProductSchema.parse(request.body);
      const product = await productService.update(request.params.id, body);
      return reply.send({ product });
    },
  );

  app.delete<{ Params: { id: string } }>(
    '/admin/products/:id',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'Products'],
        summary: 'Deactivate product',
        description: 'Soft-deletes a product by setting isActive=false.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              product: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const product = await productService.deactivate(request.params.id);
      return reply.send({ product });
    },
  );
}
