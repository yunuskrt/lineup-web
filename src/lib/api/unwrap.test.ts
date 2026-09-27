import { describe, expect, it } from 'vitest';
import { ApiRequestError, unwrap } from '@/lib/api/unwrap';
import type { ApiError, ApiResult } from '@/types/api';

const RATE_LIMITED: ApiError = {
  code: 'rate_limited',
  message: 'Slow down.',
  retryAfterMs: 1_500,
};

describe('unwrap', () => {
  it('returns the data of a successful result', () => {
    const result: ApiResult<{ id: string }> = {
      success: true,
      data: { id: 'user-1' },
    };
    expect(unwrap(result)).toEqual({ id: 'user-1' });
  });

  it('returns undefined data for an acknowledgement', () => {
    const result: ApiResult<void> = { success: true, data: undefined };
    expect(unwrap(result)).toBeUndefined();
  });

  it('throws an ApiRequestError carrying the api error', () => {
    const result: ApiResult<string> = { success: false, error: RATE_LIMITED };

    let thrown: unknown;
    try {
      unwrap(result);
    } catch (caught) {
      thrown = caught;
    }

    expect(thrown).toBeInstanceOf(ApiRequestError);
    expect(thrown).toBeInstanceOf(Error);
    if (thrown instanceof ApiRequestError) {
      expect(thrown.error).toEqual(RATE_LIMITED);
      expect(thrown.message).toBe('Slow down.');
      expect(thrown.name).toBe('ApiRequestError');
    }
  });
});
