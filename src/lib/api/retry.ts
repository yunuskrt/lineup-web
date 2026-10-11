import { apiErrorOf } from '@/lib/api/unwrap';
import type { ApiErrorCode } from '@/types/api';

export const MAX_QUERY_RETRIES = 2;

// Only a transient failure can succeed on retry
const RETRYABLE_CODES: readonly ApiErrorCode[] = ['network', 'server_error'];

export function shouldRetryQuery(
  failureCount: number,
  error: unknown,
): boolean {
  return (
    failureCount < MAX_QUERY_RETRIES &&
    RETRYABLE_CODES.includes(apiErrorOf(error).code)
  );
}
