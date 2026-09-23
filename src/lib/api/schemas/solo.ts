import { z } from 'zod';
import {
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
  maskedMatchSchema,
  matchIdentitySchema,
} from '@/lib/api/schemas/match';
import { revealedPlayerSchema } from '@/lib/api/schemas/player';

export const soloSessionStatusSchema = z.enum(['active', 'over']);

export const soloMatchOfferSchema = z.object({
  sessionId: idSchema,
  home: clubRefSchema,
  away: clubRefSchema,
});

export const soloSessionSchema = z.object({
  sessionId: idSchema,
  status: soloSessionStatusSchema,
  match: maskedMatchSchema,
  lives: livesSchema,
  found: z.array(revealedPlayerSchema).max(SQUAD_SIZE),
  round: roundTimingSchema.nullable(),
});

export const soloGuessRequestSchema = z.object({
  sessionId: idSchema,
  guess: guessTextSchema,
});

export const soloGuessResponseSchema = z.object({
  result: guessResultSchema,
  session: soloSessionSchema,
});

export const soloSummarySchema = z.object({
  match: matchIdentitySchema,
  found: z.array(revealedPlayerSchema).max(SQUAD_SIZE),
  missedCount: squadCountSchema,
  // Populated for Pro, null for free — the backend decides
  missed: z.array(revealedPlayerSchema).max(SQUAD_SIZE).nullable(),
  livesRemaining: livesSchema,
  endReason: soloEndReasonSchema,
  accuracy: ratioSchema,
  bestStreak: squadCountSchema,
  roundTimesMs: z.array(z.number().int().nonnegative()),
});
