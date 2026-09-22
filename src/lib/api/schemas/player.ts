import { z } from 'zod';
import { idSchema, webUrlSchema } from '@/lib/api/schemas/common';

export const positionGroupSchema = z.enum(['GK', 'DF', 'MF', 'FW']);

export const revealedPlayerSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  slot: z.number().int().min(0).max(10),
  position: positionGroupSchema,
  imageUrl: webUrlSchema.nullable(),
});
