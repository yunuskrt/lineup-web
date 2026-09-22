import { z } from 'zod';
import { idSchema } from '@/lib/api/schemas/common';
import { revealedPlayerSchema } from '@/lib/api/schemas/player';

export const guessResultSchema = z.discriminatedUnion('outcome', [
  z.object({
    outcome: z.literal('correct_new'),
    player: revealedPlayerSchema,
  }),
  z.object({
    outcome: z.literal('already_found'),
    playerId: idSchema,
  }),
  z.object({
    outcome: z.literal('not_in_xi'),
  }),
]);

export const livesSchema = z.number().int().min(0).max(3);

const epochMsSchema = z.number().int().nonnegative();

export const roundTimingSchema = z
  .object({
    startedAt: epochMsSchema,
    endsAt: epochMsSchema,
  })
  .refine((round) => round.endsAt > round.startedAt, {
    error: 'Round must end after it starts',
    path: ['endsAt'],
  });

export const soloEndReasonSchema = z.enum([
  'lives_out',
  'quit',
  'perfect_clear',
]);

export const duelOutcomeSchema = z.enum(['win', 'loss', 'draw', 'forfeit_win']);
