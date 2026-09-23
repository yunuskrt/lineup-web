import { z } from 'zod';
import {
  filtersSchema,
  guessTextSchema,
  idSchema,
  SQUAD_SIZE,
} from '@/lib/api/schemas/common';
import {
  duelOutcomeSchema,
  epochMsSchema,
  livesSchema,
  roundTimingSchema,
} from '@/lib/api/schemas/game';
import {
  maskedMatchSchema,
  matchIdentitySchema,
} from '@/lib/api/schemas/match';
import { revealedPlayerSchema } from '@/lib/api/schemas/player';

export const duelActorSchema = z.enum(['you', 'opponent']);

export const duelPhaseSchema = z.enum([
  'queued',
  'paired',
  'filters',
  'match_ready',
  'playing',
  'finished',
]);

export const duelPlayerSchema = z.object({
  id: idSchema,
  handle: z.string().min(1),
  lives: livesSchema,
});

export const queueStateSchema = z.object({
  phase: duelPhaseSchema.extract(['queued']),
  since: epochMsSchema,
});

export const queueTimeoutSchema = z.object({
  phase: duelPhaseSchema.extract(['queued']),
  waitedMs: z.number().int().nonnegative(),
});

export const pairedStateSchema = z.object({
  phase: duelPhaseSchema.extract(['paired']),
  opponent: duelPlayerSchema,
});

export const filterSubmissionStatusSchema = z.enum(['pending', 'submitted']);

export const filterSubmissionSchema = z.object({
  yours: filterSubmissionStatusSchema,
  theirs: filterSubmissionStatusSchema,
});

export const coinFlipResultSchema = z.object({
  winner: duelActorSchema,
  filters: filtersSchema,
});

export const duelFoundPlayerSchema = revealedPlayerSchema.extend({
  foundBy: duelActorSchema,
});

export const duelSessionSchema = z.object({
  sessionId: idSchema,
  match: maskedMatchSchema,
  you: duelPlayerSchema,
  opponent: duelPlayerSchema,
  turn: duelActorSchema,
  round: roundTimingSchema,
  found: z.array(duelFoundPlayerSchema).max(SQUAD_SIZE),
});

export const connectionStatusSchema = z.enum([
  'connected',
  'reconnecting',
  'forfeited',
]);

export const connectionStateSchema = z.object({
  status: connectionStatusSchema,
  reconnectDeadline: epochMsSchema.nullable(),
});

export const duelLifeLostSchema = z.object({
  who: duelActorSchema,
  lives: livesSchema,
});

export const duelResultSchema = z.object({
  outcome: duelOutcomeSchema,
  match: matchIdentitySchema,
  found: z.array(duelFoundPlayerSchema).max(SQUAD_SIZE),
  you: duelPlayerSchema,
  opponent: duelPlayerSchema,
  isForfeit: z.boolean(),
});

export const duelGuessRequestSchema = z.object({
  sessionId: idSchema,
  guess: guessTextSchema,
});
