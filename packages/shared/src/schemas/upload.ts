import { z } from 'zod';

export const adminUploadSchema = z.object({
  file: z.string().min(1, 'file is required'),
  folder: z.string().min(1).optional(),
  publicId: z.string().min(1).optional(),
});

export type AdminUploadInput = z.infer<typeof adminUploadSchema>;
