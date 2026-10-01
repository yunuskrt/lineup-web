import { z } from 'zod';
import {
  competitionKindSchema,
  idSchema,
  imageUrlSchema,
  sideSchema,
} from '@/lib/api/schemas/common';

export const clubRefSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  shortName: z.string().min(1),
  crestUrl: imageUrlSchema.nullable(),
});

export const competitionRefSchema = z.object({
  id: idSchema,
  kind: competitionKindSchema,
  name: z.string().min(1),
});

export const formationSchema = z.string().regex(/^\d(-\d){2,4}$/);

export const matchIdentitySchema = z.object({
  id: idSchema,
  competition: competitionRefSchema,
  // `2004-05` for leagues, `2006` for tournaments
  season: z.string().regex(/^\d{4}(-\d{2})?$/),
  date: z.iso.date(),
  stage: z.string().min(1).nullable(),
  home: clubRefSchema,
  away: clubRefSchema,
  score: z.object({
    home: z.number().int().nonnegative(),
    away: z.number().int().nonnegative(),
  }),
  nickname: z.string().min(1).nullable(),
});

// The whole match, plus the side being named
export const matchInPlaySchema = matchIdentitySchema.extend({
  side: sideSchema,
  formation: formationSchema,
});
