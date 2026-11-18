import type { z } from 'zod';
import type {
  soloAllowanceSchema,
  soloGuessRequestSchema,
  soloGuessResponseSchema,
  soloMatchOfferSchema,
  soloSessionSchema,
  soloStartRequestSchema,
  soloSummarySchema,
} from '@/lib/api/schemas/solo';

export type SoloMatchOffer = z.infer<typeof soloMatchOfferSchema>;
export type SoloSession = z.infer<typeof soloSessionSchema>;
export type SoloGuessRequest = z.infer<typeof soloGuessRequestSchema>;
export type SoloGuessResponse = z.infer<typeof soloGuessResponseSchema>;
export type SoloSummary = z.infer<typeof soloSummarySchema>;
export type SoloAllowance = z.infer<typeof soloAllowanceSchema>;
export type SoloStartRequest = z.infer<typeof soloStartRequestSchema>;
