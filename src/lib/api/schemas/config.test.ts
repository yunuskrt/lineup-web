import { describe, expect, it } from 'vitest';
import { appConfigSchema } from '@/lib/api/schemas/config';
import { apiErrorSchema } from '@/lib/api/schemas/result';

describe('appConfigSchema', () => {
  it.each([true, false])('accepts proEnabled %s', (proEnabled) => {
    expect(appConfigSchema.parse({ proEnabled })).toEqual({ proEnabled });
  });

  it.each([{}, { proEnabled: 'true' }, { proEnabled: null }])(
    'rejects %j',
    (value) => {
      expect(appConfigSchema.safeParse(value).success).toBe(false);
    },
  );
});

describe('apiErrorSchema reason', () => {
  const FORBIDDEN = {
    code: 'forbidden',
    message: 'That needs Pro.',
    retryAfterMs: null,
  };

  it('parses an error without a reason', () => {
    expect(apiErrorSchema.parse(FORBIDDEN).reason).toBeUndefined();
  });

  it.each(['pro_required', 'daily_cap'])('parses reason %s', (reason) => {
    expect(apiErrorSchema.parse({ ...FORBIDDEN, reason }).reason).toBe(reason);
  });

  it('rejects an unknown reason', () => {
    const error = { ...FORBIDDEN, reason: 'banned' };
    expect(apiErrorSchema.safeParse(error).success).toBe(false);
  });
});
