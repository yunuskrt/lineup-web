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
