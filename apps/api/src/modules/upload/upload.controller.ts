import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { adminUploadSchema } from '@slicing-edge/shared';
import { authenticate, requireAdmin } from '../../middleware/auth';
import { UploadService } from './upload.service';

/**
 * Registers admin image upload routes.
 */
export async function uploadRoutes(app: FastifyInstance) {
  const uploadService = new UploadService();

  app.post(
    '/admin/upload',
    {
      preHandler: [authenticate, requireAdmin],
      schema: {
        tags: ['Admin', 'Uploads'],
        summary: 'Upload image to Cloudinary',
        description: 'Uploads an image and returns Cloudinary metadata for product image persistence.',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['file'],
          properties: {
            file: {
              type: 'string',
              description: 'Image payload as data URI, remote URL, or base64 string accepted by Cloudinary.',
            },
            folder: { type: 'string' },
            publicId: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              image: {
                type: 'object',
                properties: {
                  url: { type: 'string' },
                  publicId: { type: 'string' },
                  width: { type: 'number' },
                  height: { type: 'number' },
                  format: { type: 'string' },
                  bytes: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = adminUploadSchema.parse(request.body);
      const image = await uploadService.uploadImage(body);
      return reply.status(201).send({ image });
    },
  );
}
