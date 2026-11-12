import { describe, expect, it } from 'vitest';
import { isSwitchOffIn } from '@/lib/api/pro-switch';

describe('isSwitchOffIn', () => {
  it('is off only when the server says so', () => {
    expect(isSwitchOffIn({ success: true, data: { proEnabled: false } })).toBe(
      true,
    );
    expect(isSwitchOffIn({ success: true, data: { proEnabled: true } })).toBe(
      false,
    );
  });

  it('never reads an error or a bad body as off', () => {
    const error = {
      success: false,
      error: { code: 'server_error', message: 'Down.', retryAfterMs: null },
    };
    expect(isSwitchOffIn(error)).toBe(false);
    expect(isSwitchOffIn({ proEnabled: false })).toBe(false);
    expect(isSwitchOffIn(null)).toBe(false);
  });
});
