import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { AppError } from '../../middleware/error-handler';
import { UploadService } from './upload.service';

/**
 * Registers admin image upload routes (local file storage).
 */
export async function uploadRoutes(app: FastifyInstance) {
  const uploadService = new UploadService();

  app.post(
    '/admin/upload',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'Uploads'],
        summary: 'Upload product image',
        description: 'Accepts a multipart/form-data file upload and saves it locally. Returns the public URL.',
        security: [{ bearerAuth: [] }],
        consumes: ['multipart/form-data'],
        response: {
          201: {
            type: 'object',
            additionalProperties: true,
            properties: {
              image: {
                type: 'object',
                additionalProperties: true,
                properties: {
                  url: { type: 'string' },
                  publicId: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const data = await request.file({ limits: { fileSize: 10 * 1024 * 1024 } });

      if (!data) {
        throw new AppError('No file provided', 400);
      }

      const buffer = await data.toBuffer();
      const saved = await uploadService.saveFile(buffer, data.filename);

      // Build absolute URL so stored paths work from any origin (Vercel, Railway, etc.)
      const proto =
        (request.headers['x-forwarded-proto'] as string | undefined)
          ?.split(',')[0]
          .trim() ?? 'http';
      const host = request.headers['host'] ?? 'localhost:3001';
      const image = { ...saved, url: `${proto}://${host}${saved.url}` };

      return reply.status(201).send({ image });
    },
  );
}
