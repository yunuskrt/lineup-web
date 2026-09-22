import { z } from 'zod';
import { idSchema } from '@/lib/api/schemas/common';

export const tierSchema = z.enum(['free', 'pro']);

export const userSchema = z.object({
  id: idSchema,
  handle: z.string().min(1),
  isGuest: z.boolean(),
  tier: tierSchema,
});
