import { z } from 'zod';
import { RATING_MIN, RATING_MAX } from '../constants';

export const createReviewSchema = z.object({
  productId: z.string().cuid(),
  rating: z.number().int().min(RATING_MIN).max(RATING_MAX),
  comment: z.string().min(10, 'Comment must be at least 10 characters').max(1000),
});

export const updateReviewSchema = z.object({
  rating: z.number().int().min(RATING_MIN).max(RATING_MAX).optional(),
  comment: z.string().min(10).max(1000).optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
