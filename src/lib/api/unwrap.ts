import type { ApiError, ApiResult } from '@/types/api';

export class ApiRequestError extends Error {
  readonly error: ApiError;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiRequestError';
    this.error = error;
  }
}

export function unwrap<T>(result: ApiResult<T>): T {
  if (!result.success) throw new ApiRequestError(result.error);
  return result.data;
}

// Anything thrown outside the API is our own failure
export function apiErrorOf(error: unknown): ApiError {
  if (error instanceof ApiRequestError) return error.error;
  return {
    code: 'server_error',
    message: 'Unexpected client error.',
    retryAfterMs: null,
  };
}
