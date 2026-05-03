import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ReturnService } from './return.service';
import { authenticate, requireAdmin } from '../../middleware/auth';

const createReturnSchema = z.object({
  orderNumber: z.string().min(1),
  email: z.string().email(),
  reason: z.string().min(1).max(120),
  description: z.string().min(10).max(2000),
});

const createReturnByAdminSchema = z.object({
  reason: z.string().min(1).max(120),
  description: z.string().min(10).max(2000),
  adminNote: z.string().max(1000).optional(),
});

const ALL_RETURN_STATUSES = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'LABEL_ISSUED',
  'RECEIVED',
  'REFUNDED',
  'CLOSED',
] as const;

const updateStatusSchema = z.object({
  status: z.enum(ALL_RETURN_STATUSES),
  adminNote: z.string().max(1000).optional(),
});

/**
 * Registers return-request routes (public submission + admin management).
 */
export async function returnRoutes(app: FastifyInstance) {
  const service = new ReturnService(app.prisma);

  // Public: submit a return request
  app.post(
    '/returns',
    {
      schema: {
        tags: ['Returns'],
        summary: 'Submit a return request',
        body: {
          type: 'object',
          required: ['orderNumber', 'email', 'reason', 'description'],
          properties: {
            orderNumber: { type: 'string' },
            email: { type: 'string', format: 'email' },
            reason: { type: 'string' },
            description: { type: 'string' },
          },
        },
        response: {
          201: { type: 'object', additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const data = createReturnSchema.parse(request.body);
      const returnRequest = await service.createReturn(data);
      return reply.status(201).send({ returnRequest });
    },
  );

  // Admin: initiate a return for any order (bypasses customer email verification)
  app.post<{ Params: { orderId: string } }>(
    '/admin/orders/:orderId/return',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'Returns'],
        summary: 'Initiate a return for an order (admin)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['orderId'],
          properties: { orderId: { type: 'string' } },
        },
        body: {
          type: 'object',
          required: ['reason', 'description'],
          properties: {
            reason: { type: 'string' },
            description: { type: 'string' },
            adminNote: { type: 'string' },
          },
        },
        response: {
          201: { type: 'object', additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const { reason, description, adminNote } = createReturnByAdminSchema.parse(request.body);
      const returnRequest = await service.createReturnByAdmin({
        orderId: request.params.orderId,
        reason,
        description,
        adminNote,
      });
      return reply.status(201).send({ returnRequest });
    },
  );

  // Admin: list all return requests
  app.get<{ Querystring: { page?: string; limit?: string; status?: string } }>(
    '/admin/returns',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'Returns'],
        summary: 'List return requests (admin)',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string' },
            limit: { type: 'string' },
            status: { type: 'string', enum: ALL_RETURN_STATUSES },
          },
        },
        response: {
          200: { type: 'object', additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const page = Number(request.query.page) || 1;
      const limit = Number(request.query.limit) || 20;
      const status = request.query.status as import('./return.service').ReturnStatus | undefined;
      const result = await service.listReturns(page, limit, status);
      return reply.send(result);
    },
  );

  // Admin: update return status
  app.patch<{ Params: { id: string } }>(
    '/admin/returns/:id/status',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'Returns'],
        summary: 'Update return request status (admin)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        body: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ALL_RETURN_STATUSES },
            adminNote: { type: 'string' },
          },
        },
        response: {
          200: { type: 'object', additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const { status, adminNote } = updateStatusSchema.parse(request.body);
      const returnRequest = await service.updateStatus(request.params.id, status, adminNote);
      return reply.send({ returnRequest });
    },
  );
}
