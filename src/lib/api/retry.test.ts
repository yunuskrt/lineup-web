import { describe, expect, it } from 'vitest';
import { MAX_QUERY_RETRIES, shouldRetryQuery } from '@/lib/api/retry';
import { ApiRequestError } from '@/lib/api/unwrap';
import type { ApiErrorCode } from '@/types/api';

function failure(code: ApiErrorCode): ApiRequestError {
  return new ApiRequestError({ code, message: 'x', retryAfterMs: null });
}

describe('shouldRetryQuery', () => {
  it.each(['network', 'server_error'] as const)(
    'retries %s up to the limit',
    (code) => {
      expect(shouldRetryQuery(0, failure(code))).toBe(true);
      expect(shouldRetryQuery(MAX_QUERY_RETRIES - 1, failure(code))).toBe(true);
      expect(shouldRetryQuery(MAX_QUERY_RETRIES, failure(code))).toBe(false);
    },
  );

  it.each([
    'unauthorized',
    'forbidden',
    'not_found',
    'invalid_input',
    'empty_pool',
    'rate_limited',
    'session_over',
    'protocol_refused',
  ] as const)('never retries %s', (code) => {
    expect(shouldRetryQuery(0, failure(code))).toBe(false);
  });

  it('retries an unknown throw as a server error', () => {
    expect(shouldRetryQuery(0, new Error('boom'))).toBe(true);
  });
});
