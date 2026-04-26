import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { chatbotMessageSchema } from '@slicing-edge/shared';
import { ChatbotService } from './chatbot.service';

/**
 * Registers the chatbot endpoint with a restrictive per-route rate limit.
 */
export async function chatbotRoutes(app: FastifyInstance) {
  const chatbotService = new ChatbotService(app.prisma);

  app.post(
    '/chatbot',
    {
      config: {
        rateLimit: {
          max: 10,
          timeWindow: '1 minute',
        },
      },
      schema: {
        tags: ['Chatbot'],
        summary: 'Send a message to the AI assistant',
        description:
          'Sends a user message to the Slicing Edge AI shopping assistant. Supports multi-turn conversations via the history array. The assistant can search products, recommend by category, and track orders using tool-use.',
        body: {
          type: 'object',
          required: ['message'],
          properties: {
            message: {
              type: 'string',
              minLength: 1,
              maxLength: 1000,
              description: 'The user message to send to the assistant',
            },
            history: {
              type: 'array',
              maxItems: 20,
              description: 'Previous conversation turns for multi-turn context',
              items: {
                type: 'object',
                required: ['role', 'content'],
                properties: {
                  role: { type: 'string', enum: ['user', 'assistant'] },
                  content: { type: 'string', maxLength: 2000 },
                },
              },
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              reply: { type: 'string', description: 'The assistant reply text' },
              products: {
                type: 'array',
                description: 'Products surfaced by product-search tools (may be empty)',
                items: { type: 'object', additionalProperties: true },
              },
            },
          },
          429: {
            type: 'object',
            properties: {
              statusCode: { type: 'number' },
              error: { type: 'string' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const input = chatbotMessageSchema.parse(request.body);
      const result = await chatbotService.chat(input);
      return reply.send(result);
    },
  );
}
