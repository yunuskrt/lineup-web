import { z } from 'zod';
import { eraRangeSchema } from '@/lib/api/schemas/common';
import { clubRefSchema, competitionRefSchema } from '@/lib/api/schemas/match';

export const filterOptionsSchema = z.object({
  competitions: z.array(competitionRefSchema),
  clubs: z.array(clubRefSchema),
  era: eraRangeSchema,
});
