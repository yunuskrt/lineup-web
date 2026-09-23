import { z } from 'zod';
import {
  idSchema,
  ratioSchema,
  squadCountSchema,
} from '@/lib/api/schemas/common';
import {
  duelOutcomeSchema,
  livesSchema,
  soloEndReasonSchema,
} from '@/lib/api/schemas/game';
import { clubRefSchema, matchIdentitySchema } from '@/lib/api/schemas/match';
import { userSchema } from '@/lib/api/schemas/user';

export const DEFAULT_HISTORY_LIMIT = 20;
export const MAX_HISTORY_LIMIT = 50;

const countSchema = z.number().int().nonnegative();

export const userStatsSchema = z.object({
  played: countSchema,
  wins: countSchema,
  losses: countSchema,
  draws: countSchema,
  accuracy: ratioSchema,
  bestStreak: countSchema,
  perfectClears: countSchema,
  favouriteClub: clubRefSchema.nullable(),
});

const historyEntryBase = {
  id: idSchema,
  playedAt: z.iso.datetime(),
  match: matchIdentitySchema,
  foundCount: squadCountSchema,
  livesRemaining: livesSchema,
};

export const historyEntrySchema = z.discriminatedUnion('mode', [
  z.object({
    ...historyEntryBase,
    mode: z.literal('solo'),
    outcome: soloEndReasonSchema,
  }),
  z.object({
    ...historyEntryBase,
    mode: z.literal('duel'),
    outcome: duelOutcomeSchema,
  }),
]);

export const historyQuerySchema = z.object({
  cursor: idSchema.nullable(),
  limit: z.number().int().min(1).max(MAX_HISTORY_LIMIT),
});

export const historyPageSchema = z.object({
  entries: z.array(historyEntrySchema),
  nextCursor: idSchema.nullable(),
});

export const profileSchema = z.object({
  user: userSchema,
  stats: userStatsSchema,
});
