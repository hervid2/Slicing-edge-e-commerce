import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { FaqService } from './faq.service';
import { authenticate, requireAdmin } from '../../middleware/auth';

const createFaqSchema = z.object({
  question: z.string().min(5).max(500),
  answer: z.string().min(5).max(5000),
  position: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const updateFaqSchema = z.object({
  question: z.string().min(5).max(500).optional(),
  answer: z.string().min(5).max(5000).optional(),
  position: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Registers FAQ routes (public read + admin CRUD).
 */
export async function faqRoutes(app: FastifyInstance) {
  const service = new FaqService(app.prisma);

  // Public: list active FAQs
  app.get(
    '/faq',
    {
      schema: {
        tags: ['FAQ'],
        summary: 'List active FAQ entries',
        response: {
          200: { type: 'object', additionalProperties: true },
        },
      },
    },
    async (_request, reply) => {
      const entries = await service.listPublic();
      return reply.send({ entries });
    },
  );

  // Admin: list all FAQs
  app.get(
    '/admin/faq',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'FAQ'],
        summary: 'List all FAQ entries (admin)',
        security: [{ bearerAuth: [] }],
        response: {
          200: { type: 'object', additionalProperties: true },
        },
      },
    },
    async (_request, reply) => {
      const entries = await service.listAll();
      return reply.send({ entries });
    },
  );

  // Admin: create FAQ entry
  app.post(
    '/admin/faq',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'FAQ'],
        summary: 'Create FAQ entry (admin)',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['question', 'answer'],
          properties: {
            question: { type: 'string' },
            answer: { type: 'string' },
            position: { type: 'number' },
            isActive: { type: 'boolean' },
          },
        },
        response: {
          201: { type: 'object', additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const data = createFaqSchema.parse(request.body);
      const entry = await service.createEntry(data);
      return reply.status(201).send({ entry });
    },
  );

  // Admin: update FAQ entry
  app.put<{ Params: { id: string } }>(
    '/admin/faq/:id',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'FAQ'],
        summary: 'Update FAQ entry (admin)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        body: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            answer: { type: 'string' },
            position: { type: 'number' },
            isActive: { type: 'boolean' },
          },
        },
        response: {
          200: { type: 'object', additionalProperties: true },
        },
      },
    },
    async (request, reply) => {
      const data = updateFaqSchema.parse(request.body);
      const entry = await service.updateEntry(request.params.id, data);
      return reply.send({ entry });
    },
  );

  // Admin: delete FAQ entry
  app.delete<{ Params: { id: string } }>(
    '/admin/faq/:id',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'FAQ'],
        summary: 'Delete FAQ entry (admin)',
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
      const result = await service.deleteEntry(request.params.id);
      return reply.send(result);
    },
  );
}
