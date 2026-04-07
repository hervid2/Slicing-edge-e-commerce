import { z } from 'zod';

/**
 * Input schema for a chatbot message request.
 * Includes the new user message and up to 20 prior turns for context.
 */
export const chatbotMessageSchema = z.object({
  /** The user's current message. */
  message: z.string().min(1).max(1000).trim(),
  /** Previous conversation turns sent by the client for multi-turn context. */
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(2000),
      }),
    )
    .max(20)
    .default([]),
});

export type ChatbotMessageInput = z.infer<typeof chatbotMessageSchema>;
