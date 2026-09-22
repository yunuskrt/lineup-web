import type { z } from 'zod';
import type {
  duelOutcomeSchema,
  guessResultSchema,
  livesSchema,
  roundTimingSchema,
  soloEndReasonSchema,
} from '@/lib/api/schemas/game';

export type GuessResult = z.infer<typeof guessResultSchema>;
export type GuessOutcome = GuessResult['outcome'];
export type Lives = z.infer<typeof livesSchema>;
export type RoundTiming = z.infer<typeof roundTimingSchema>;
export type SoloEndReason = z.infer<typeof soloEndReasonSchema>;
export type DuelOutcome = z.infer<typeof duelOutcomeSchema>;
