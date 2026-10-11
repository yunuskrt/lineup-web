import { describe, expect, it } from 'vitest';
import { isSessionLost } from '@/lib/api/session-loss';
import { ApiRequestError } from '@/lib/api/unwrap';
import type { ApiErrorCode } from '@/types/api';

function failure(code: ApiErrorCode): ApiRequestError {
  return new ApiRequestError({ code, message: 'x', retryAfterMs: null });
}

describe('isSessionLost', () => {
  it('reads unauthorized from a query as a lost session', () => {
    expect(isSessionLost(failure('unauthorized'))).toBe(true);
  });

  it('reads unauthorized from an unmarked mutation as lost', () => {
    expect(isSessionLost(failure('unauthorized'), {})).toBe(true);
  });

  it('keeps the session on a credential check', () => {
    expect(
      isSessionLost(failure('unauthorized'), { isCredentialCheck: true }),
    ).toBe(false);
  });

  it.each([
    'forbidden',
    'not_found',
    'invalid_input',
    'empty_pool',
    'rate_limited',
    'session_over',
    'network',
    'server_error',
    'protocol_refused',
  ] as const)('keeps the session on %s', (code) => {
    expect(isSessionLost(failure(code))).toBe(false);
  });

  it('keeps the session on an error from outside the API', () => {
    expect(isSessionLost(new Error('unauthorized'))).toBe(false);
  });
});
