import { z } from 'zod';
import {
  filtersSchema,
  guessTextSchema,
  idSchema,
  ratioSchema,
  squadCountSchema,
  SQUAD_SIZE,
} from '@/lib/api/schemas/common';
import {
  guessResultSchema,
  livesSchema,
  roundTimingSchema,
  soloEndReasonSchema,
} from '@/lib/api/schemas/game';
import {
  clubRefSchema,
  matchInPlaySchema,
  matchIdentitySchema,
} from '@/lib/api/schemas/match';
import {
  namedPlayerSchema,
  revealedPlayerSchema,
} from '@/lib/api/schemas/player';

export const soloSessionStatusSchema = z.enum(['active', 'over']);

// Backend R13: `matchId` overrides the filters
export const soloStartRequestSchema = filtersSchema.extend({
  matchId: idSchema.optional(),
  // No clock, no lives, not saved (R14, Pro)
  practice: z.boolean().optional(),
});

export const soloMatchOfferSchema = z.object({
  sessionId: idSchema,
  // No player: safe to show before the pick
  match: matchIdentitySchema,
  // Deprecated by the backend; read `match`
  home: clubRefSchema,
  away: clubRefSchema,
});

export const soloSessionSchema = z.object({
  sessionId: idSchema,
  status: soloSessionStatusSchema,
  match: matchInPlaySchema,
  lives: livesSchema,
  found: z.array(revealedPlayerSchema).max(SQUAD_SIZE),
  // Always null in practice
  round: roundTimingSchema.nullable(),
  practice: z.boolean(),
});

export const soloGuessRequestSchema = z.object({
  sessionId: idSchema,
  guess: guessTextSchema,
});

export const soloGuessResponseSchema = z.object({
  result: guessResultSchema,
  session: soloSessionSchema,
});

// Backend R11: the server counts, the web shows
export const soloAllowanceSchema = z.object({
  // Null when unlimited
  limit: z.number().int().positive().nullable(),
  used: z.number().int().nonnegative(),
  // The next UTC midnight, epoch ms
  resetsAt: z.number().int().nonnegative(),
});

export const soloSummarySchema = z.object({
  match: matchIdentitySchema,
  // Sorted by order
  found: z.array(namedPlayerSchema).max(SQUAD_SIZE),
  missedCount: squadCountSchema,
  // Pro gets the list, free gets null; server decides
  missed: z.array(revealedPlayerSchema).max(SQUAD_SIZE).nullable(),
  livesRemaining: livesSchema,
  endReason: soloEndReasonSchema,
  accuracy: ratioSchema,
  bestStreak: squadCountSchema,
  roundTimesMs: z.array(z.number().int().nonnegative()),
  practice: z.boolean(),
});
