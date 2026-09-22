import { z } from 'zod';

export const FIRST_SEASON_START = 2000;
export const LAST_SEASON_START = 2025;

export const idSchema = z.string().min(1);

export const webUrlSchema = z.url({ protocol: /^https?$/ });

export const sideSchema = z.enum(['home', 'away']);

export const competitionKindSchema = z.enum([
  'league',
  'ucl',
  'uel',
  'world_cup',
  'euro',
]);

const seasonStartSchema = z
  .number()
  .int()
  .min(FIRST_SEASON_START)
  .max(LAST_SEASON_START);

export const eraRangeSchema = z
  .object({
    from: seasonStartSchema,
    to: seasonStartSchema,
  })
  .refine((era) => era.from <= era.to, {
    error: 'Era start must not be after its end',
    path: ['to'],
  });

export const filtersSchema = z.object({
  competitionIds: z.array(idSchema),
  clubIds: z.array(idSchema),
  era: eraRangeSchema,
});
