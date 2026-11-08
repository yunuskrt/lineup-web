import { z } from 'zod';
import {
  directoryKeySchema,
  eraRangeSchema,
  idSchema,
  imageUrlSchema,
  seasonStartSchema,
} from '@/lib/api/schemas/common';
import { clubRefSchema, competitionRefSchema } from '@/lib/api/schemas/match';

// The pool's view of one competition
export const competitionOptionSchema = competitionRefSchema.extend({
  clubIds: z.array(idSchema),
  seasonStarts: z.array(seasonStartSchema).min(1),
});

export const filterOptionsSchema = z.object({
  competitions: z.array(competitionOptionSchema),
  clubs: z.array(clubRefSchema),
  era: eraRangeSchema,
});

// Every player, unscoped: searched, never shown
export const directoryPlayerSchema = z.object({
  key: directoryKeySchema,
  name: z.string().min(1),
  imageUrl: imageUrlSchema.nullable(),
  terms: z.array(z.string().min(1)).min(1),
});

export const playerDirectorySchema = z.object({
  players: z.array(directoryPlayerSchema),
});
