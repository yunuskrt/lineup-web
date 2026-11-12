import { z } from 'zod';
import {
  directoryKeySchema,
  idSchema,
  imageUrlSchema,
  SQUAD_SIZE,
} from '@/lib/api/schemas/common';

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
  // Marks this player in the guess suggestions
  directoryKey: directoryKeySchema,
});

// A duel caps elapsed time at one round
export const NAMED_ELAPSED_MAX_MS = 15_000;

// End-of-game only: when, and how fast, it was named
export const namedPlayerSchema = revealedPlayerSchema.extend({
  order: z.number().int().min(1).max(SQUAD_SIZE),
  // Uncapped: practice has no clock (R14)
  elapsedMs: z.number().int().min(0),
});
