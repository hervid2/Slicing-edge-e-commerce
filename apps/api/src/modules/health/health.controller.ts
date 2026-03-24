import type { FastifyInstance } from 'fastify';

/**
 * Registers health and readiness endpoints.
 */
export async function healthRoutes(app: FastifyInstance) {
  app.get(
    '/health',
    {
      schema: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Returns API availability and server timestamp.',
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string', example: 'ok' },
              timestamp: { type: 'string', format: 'date-time' },
              service: { type: 'string', example: 'slicing-edge-api' },
            },
          },
        },
      },
    },
    async () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'slicing-edge-api',
      };
    },
  );
}
