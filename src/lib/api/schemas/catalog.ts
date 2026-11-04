import { z } from 'zod';
import {
  eraRangeSchema,
  idSchema,
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
