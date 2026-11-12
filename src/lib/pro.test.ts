import { describe, expect, it } from 'vitest';
import { proAccess, showsPro } from '@/lib/pro';
import type { AppConfig } from '@/types/config';
import type { Tier, User } from '@/types/user';

const ON: AppConfig = { proEnabled: true };
const OFF: AppConfig = { proEnabled: false };

function user(tier: Tier): User {
  return {
    id: 'user-1',
    handle: 'northgate_no9',
    isGuest: true,
    emailVerified: false,
    tier,
  };
}

describe('proAccess', () => {
  it('is pending until the config is known', () => {
    expect(proAccess(null, user('pro'))).toBe('pending');
    expect(proAccess(null, null)).toBe('pending');
  });

  it('is open for everyone while the split is off', () => {
    expect(proAccess(OFF, user('free'))).toBe('open');
    expect(proAccess(OFF, user('pro'))).toBe('open');
    expect(proAccess(OFF, null)).toBe('open');
  });

  it('follows the tier while the split is on', () => {
    expect(proAccess(ON, user('pro'))).toBe('open');
    expect(proAccess(ON, user('free'))).toBe('locked');
  });

  it('locks a visitor with no session while the split is on', () => {
    expect(proAccess(ON, null)).toBe('locked');
  });
});

describe('showsPro', () => {
  it('is true only while the split is on', () => {
    expect(showsPro(ON)).toBe(true);
    expect(showsPro(OFF)).toBe(false);
    expect(showsPro(null)).toBe(false);
  });
});
