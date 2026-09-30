import type { z } from 'zod';
import type {
  apiErrorCodeSchema,
  apiErrorSchema,
  emptyPoolReasonSchema,
} from '@/lib/api/schemas/result';

export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;
export type ApiError = z.infer<typeof apiErrorSchema>;
export type EmptyPoolReason = z.infer<typeof emptyPoolReasonSchema>;

// Generic unions cannot be produced by z.infer
export type ApiResult<T> =
  { success: true; data: T } | { success: false; error: ApiError };
