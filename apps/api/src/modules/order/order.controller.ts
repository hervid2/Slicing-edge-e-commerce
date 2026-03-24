import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { guestOrderTrackingSchema, updateOrderStatusSchema } from '@slicing-edge/shared';
import { OrderService } from './order.service';
import { authenticate, requireAdmin } from '../../middleware/auth';

/**
 * Registers order tracking and order management routes.
 */
export async function orderRoutes(app: FastifyInstance) {
  const orderService = new OrderService(app.prisma);

  app.get(
    '/orders',
    {
      preHandler: [authenticate],
      schema: {
        tags: ['Orders'],
        summary: 'List current user orders',
        description: 'Returns all orders for the authenticated user.',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              orders: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const orders = await orderService.getUserOrders(request.user!.sub);
      return reply.send({ orders });
    },
  );

  app.post(
    '/orders/track',
    {
      schema: {
        tags: ['Orders'],
        summary: 'Track guest order',
        description: 'Returns guest order details by order number and email.',
        body: {
          type: 'object',
          required: ['orderNumber', 'email'],
          properties: {
            orderNumber: { type: 'string' },
            email: { type: 'string', format: 'email' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              order: { type: 'object' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { orderNumber, email } = guestOrderTrackingSchema.parse(request.body);
      const order = await orderService.getOrderByNumber(orderNumber, email);
      return reply.send({ order });
    },
  );

  app.get<{ Querystring: { page?: string; limit?: string } }>(
    '/admin/orders',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'Orders'],
        summary: 'List all orders (admin)',
        description: 'Returns paginated order list for admin users.',
        security: [{ bearerAuth: [] }],
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
              orders: { type: 'array', items: { type: 'object' } },
              pagination: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const page = Number(request.query.page) || 1;
      const limit = Number(request.query.limit) || 20;
      const result = await orderService.getAllOrders(page, limit);
      return reply.send(result);
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/admin/orders/:id/status',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'Orders'],
        summary: 'Update order status (admin)',
        description: 'Updates order status and writes status history entry.',
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
          required: ['status'],
          properties: {
            status: { type: 'string' },
            note: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              order: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { status, note } = updateOrderStatusSchema.parse(request.body);
      const order = await orderService.updateOrderStatus(request.params.id, status, note);
      return reply.send({ order });
    },
  );
}
