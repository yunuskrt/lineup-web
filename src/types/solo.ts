import type { z } from 'zod';
import type {
  soloGuessRequestSchema,
  soloGuessResponseSchema,
  soloMatchOfferSchema,
  soloSessionSchema,
  soloSessionStatusSchema,
  soloSummarySchema,
} from '@/lib/api/schemas/solo';

export type SoloSessionStatus = z.infer<typeof soloSessionStatusSchema>;
export type SoloMatchOffer = z.infer<typeof soloMatchOfferSchema>;
export type SoloSession = z.infer<typeof soloSessionSchema>;
export type SoloGuessRequest = z.infer<typeof soloGuessRequestSchema>;
export type SoloGuessResponse = z.infer<typeof soloGuessResponseSchema>;
export type SoloSummary = z.infer<typeof soloSummarySchema>;
