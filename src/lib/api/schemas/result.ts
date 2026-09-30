import { z } from 'zod';

export const apiErrorCodeSchema = z.enum([
  'unauthorized',
  'forbidden',
  'not_found',
  'invalid_input',
  'empty_pool',
  'rate_limited',
  'session_over',
  'network',
  'server_error',
  // This build is older than the server accepts
  'protocol_refused',
]);

// Which filter emptied the pool, to offer a widen
export const emptyPoolReasonSchema = z.enum([
  'competition',
  'club',
  'era',
  'combination',
]);

export const apiErrorSchema = z.object({
  code: apiErrorCodeSchema,
  message: z.string().min(1),
  retryAfterMs: z.number().int().nonnegative().nullable(),
  // Set only with `empty_pool`
  emptyBecause: emptyPoolReasonSchema.optional(),
});

export function apiResultSchema<T extends z.ZodType>(dataSchema: T) {
  return z.discriminatedUnion('success', [
    z.object({
      success: z.literal(true),
      data: dataSchema,
    }),
    z.object({
      success: z.literal(false),
      error: apiErrorSchema,
    }),
  ]);
}
