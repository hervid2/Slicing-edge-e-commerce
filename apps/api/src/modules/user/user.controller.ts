import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { UserService } from './user.service';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { sendEmail, AdminInviteEmail } from '@slicing-edge/email';

const updateRoleSchema = z.object({
  role: z.enum(['CUSTOMER', 'ADMIN']),
});

const inviteAdminSchema = z.object({
  email: z.string().email('Invalid email address'),
});

/**
 * Registers admin user management routes.
 */
export async function userRoutes(app: FastifyInstance) {
  const userService = new UserService(app.prisma);

  app.get<{ Querystring: { page?: string; limit?: string; search?: string } }>(
    '/admin/users',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'Users'],
        summary: 'List users (admin)',
        description: 'Returns a paginated list of all users with order count. Supports search by name or email.',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string' },
            limit: { type: 'string' },
            search: { type: 'string' },
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
      const search = request.query.search?.trim() || undefined;
      const result = await userService.listUsers(page, limit, search);
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

  app.delete<{ Params: { id: string } }>(
    '/admin/users/:id',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'Users'],
        summary: 'Delete user (admin)',
        description: 'Permanently deletes a user account. Admins cannot delete their own account.',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        response: {
          200: {
            type: 'object',
            properties: { deleted: { type: 'boolean' } },
          },
        },
      },
    },
    async (request, reply) => {
      const result = await userService.deleteUser(request.params.id, request.user!.sub);
      return reply.send(result);
    },
  );

  app.post(
    '/admin/users/invite',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'Users'],
        summary: 'Invite admin user',
        description: 'Creates a new admin account and sends an activation email with a setup link.',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: { invited: { type: 'boolean' }, email: { type: 'string' } },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { email } = inviteAdminSchema.parse(request.body);

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const { setupToken } = await userService.inviteAdmin(email);
      const setupUrl = `${frontendUrl}/auth/reset-password?token=${setupToken}`;

      try {
        await sendEmail({
          to: email,
          subject: "You've been invited to manage Slicing Edge",
          react: AdminInviteEmail({ email, setupUrl }),
        });
      } catch (emailErr) {
        request.log.warn({ err: emailErr, email }, 'Invite email could not be sent');
      }

      return reply.status(201).send({ invited: true, email });
    },
  );
}
