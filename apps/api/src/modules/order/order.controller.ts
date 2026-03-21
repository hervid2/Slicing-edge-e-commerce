import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { guestOrderTrackingSchema, updateOrderStatusSchema } from '@slicing-edge/shared';
import { OrderService } from './order.service';
import { authenticate, requireAdmin, optionalAuth } from '../../middleware/auth';

export async function orderRoutes(app: FastifyInstance) {
  const orderService = new OrderService(app.prisma);

  // GET /api/orders — authenticated user's orders
  app.get(
    '/orders',
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const orders = await orderService.getUserOrders(request.user!.sub);
      return reply.send({ orders });
    },
  );

  // POST /api/orders/track — guest order tracking
  app.post('/orders/track', async (request: FastifyRequest, reply: FastifyReply) => {
    const { orderNumber, email } = guestOrderTrackingSchema.parse(request.body);
    const order = await orderService.getOrderByNumber(orderNumber, email);
    return reply.send({ order });
  });

  // GET /api/admin/orders — admin list all orders
  app.get<{ Querystring: { page?: string; limit?: string } }>(
    '/admin/orders',
    { preHandler: [authenticate, requireAdmin] },
    async (request, reply) => {
      const page = Number(request.query.page) || 1;
      const limit = Number(request.query.limit) || 20;
      const result = await orderService.getAllOrders(page, limit);
      return reply.send(result);
    },
  );

  // PATCH /api/admin/orders/:id/status — admin update order status
  app.patch<{ Params: { id: string } }>(
    '/admin/orders/:id/status',
    { preHandler: [authenticate, requireAdmin] },
    async (request, reply) => {
      const { status, note } = updateOrderStatusSchema.parse(request.body);
      const order = await orderService.updateOrderStatus(request.params.id, status, note);
      return reply.send({ order });
    },
  );
}
