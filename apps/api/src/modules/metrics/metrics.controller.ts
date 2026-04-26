import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MetricsService } from './metrics.service';
import { authenticate, requireAdmin } from '../../middleware/auth';

/**
 * Registers admin metrics routes.
 */
export async function metricsRoutes(app: FastifyInstance) {
  const metricsService = new MetricsService(app.prisma);

  app.get(
    '/admin/metrics',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'Metrics'],
        summary: 'Get dashboard metrics',
        description:
          'Returns KPIs, orders-by-day chart data, recent orders, and low-stock products.',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            additionalProperties: true,
            properties: {
              kpis: { type: 'object', additionalProperties: true },
              ordersByDay: { type: 'array', items: { type: 'object', additionalProperties: true } },
              recentOrders: { type: 'array', items: { type: 'object', additionalProperties: true } },
              lowStockProducts: { type: 'array', items: { type: 'object', additionalProperties: true } },
            },
          },
        },
      },
    },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const data = await metricsService.getDashboardMetrics();
      return reply.send(data);
    },
  );
}
