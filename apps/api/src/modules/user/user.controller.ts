import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { UserService } from './user.service';
import { authenticate, requireAdmin } from '../../middleware/auth';

const updateRoleSchema = z.object({
  role: z.enum(['CUSTOMER', 'ADMIN']),
});

/**
 * Registers admin user management routes.
 */
export async function userRoutes(app: FastifyInstance) {
  const userService = new UserService(app.prisma);

  app.get<{ Querystring: { page?: string; limit?: string } }>(
    '/admin/users',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'Users'],
        summary: 'List users (admin)',
        description: 'Returns a paginated list of all users with order count.',
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
              users: { type: 'array', items: { type: 'object' } },
              pagination: { type: 'object' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const page = Number(request.query.page) || 1;
      const limit = Number(request.query.limit) || 20;
      const result = await userService.listUsers(page, limit);
      return reply.send(result);
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/admin/users/:id/role',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'Users'],
        summary: 'Update user role (admin)',
        description: 'Changes a user role to CUSTOMER or ADMIN. Admins cannot change their own role.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        body: {
          type: 'object',
          required: ['role'],
          properties: {
            role: { type: 'string', enum: ['CUSTOMER', 'ADMIN'] },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: { user: { type: 'object' } },
          },
        },
      },
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { role } = updateRoleSchema.parse(request.body);
      const user = await userService.updateRole(request.params.id, role, request.user!.sub);
      return reply.send({ user });
    },
  );
}
