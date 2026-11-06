import { z } from 'zod';
import { idSchema, imageUrlSchema, SQUAD_SIZE } from '@/lib/api/schemas/common';

export const positionGroupSchema = z.enum(['GK', 'DF', 'MF', 'FW']);

export const revealedPlayerSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  slot: z
    .number()
    .int()
    .min(0)
    .max(SQUAD_SIZE - 1),
  position: positionGroupSchema,
  imageUrl: imageUrlSchema.nullable(),
});

// The server caps elapsed time at one round
export const NAMED_ELAPSED_MAX_MS = 15_000;

// End-of-game only: when, and how fast, it was named
export const namedPlayerSchema = revealedPlayerSchema.extend({
  order: z.number().int().min(1).max(SQUAD_SIZE),
  elapsedMs: z.number().int().min(0).max(NAMED_ELAPSED_MAX_MS),
});
