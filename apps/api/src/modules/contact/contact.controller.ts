import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { ContactService } from './contact.service';
import { authenticate, requireAdmin } from '../../middleware/auth';

const createMessageSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(10).max(5000),
});

/**
 * Registers contact form routes (public submission + admin management).
 */
export async function contactRoutes(app: FastifyInstance) {
  const service = new ContactService(app.prisma);

  // Public: submit contact message
  app.post(
    '/contact',
    {
      schema: {
        tags: ['Contact'],
        summary: 'Submit a contact message',
        body: {
          type: 'object',
          required: ['name', 'email', 'subject', 'message'],
          properties: {
            name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            subject: { type: 'string' },
            message: { type: 'string' },
          },
        },
        response: {
          201: { type: 'object', additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const data = createMessageSchema.parse(request.body);
      const contactMessage = await service.createMessage(data);
      return reply.status(201).send({ contactMessage });
    },
  );

  // Admin: list messages
  app.get<{ Querystring: { page?: string; limit?: string; unread?: string } }>(
    '/admin/contact',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'Contact'],
        summary: 'List contact messages (admin)',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'string' },
            limit: { type: 'string' },
            unread: { type: 'string' },
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
      const unreadOnly = request.query.unread === 'true';
      const result = await service.listMessages(page, limit, unreadOnly || undefined);
      return reply.send(result);
    },
  );

  // Admin: mark message as read
  app.patch<{ Params: { id: string } }>(
    '/admin/contact/:id/read',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'Contact'],
        summary: 'Mark contact message as read (admin)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        response: {
          200: { type: 'object', additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const message = await service.markRead(request.params.id);
      return reply.send({ message });
    },
  );

  // Admin: reply to message (sends email to customer)
  app.post<{ Params: { id: string }; Body: { reply: string } }>(
    '/admin/contact/:id/reply',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'Contact'],
        summary: 'Reply to a contact message via email (admin)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        body: {
          type: 'object',
          required: ['reply'],
          properties: { reply: { type: 'string', minLength: 1 } },
        },
        response: {
          200: { type: 'object', properties: { replied: { type: 'boolean' } } },
        },
      },
    },
    async (request, reply) => {
      const { reply: replyText } = request.body as { reply: string };
      const result = await service.replyToMessage(request.params.id, replyText);
      return reply.send(result);
    },
  );

  // Admin: delete message
  app.delete<{ Params: { id: string } }>(
    '/admin/contact/:id',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'Contact'],
        summary: 'Delete contact message (admin)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        response: {
          200: { type: 'object', properties: { deleted: { type: 'boolean' } } },
        },
      },
    },
    async (request, reply) => {
      const result = await service.deleteMessage(request.params.id);
      return reply.send(result);
    },
  );
}
