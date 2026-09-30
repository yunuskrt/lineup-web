import { describe, expect, it } from 'vitest';
import {
  cooldownAnnouncement,
  cooldownLabel,
  cooldownUntil,
  emptyPoolGate,
  heldCooldown,
  reconnectingDetail,
  reconnectingGate,
  widenReasonOf,
} from '@/lib/system-states';
import type { ApiError, EmptyPoolReason } from '@/types/api';

const NOW = 1_700_000_000_000;

const RATE_LIMITED: ApiError = {
  code: 'rate_limited',
  message: 'Too many guesses at once. Wait a moment.',
  retryAfterMs: 2_000,
};

function emptyPool(emptyBecause?: EmptyPoolReason): ApiError {
  return {
    code: 'empty_pool',
    message: 'No match fits.',
    retryAfterMs: null,
    emptyBecause,
  };
}

describe('widenReasonOf', () => {
  it('names a single group to widen', () => {
    expect(widenReasonOf(emptyPool('competition'))).toBe('competition');
    expect(widenReasonOf(emptyPool('club'))).toBe('club');
    expect(widenReasonOf(emptyPool('era'))).toBe('era');
  });

  it('has none for a combination, a missing reason or another code', () => {
    expect(widenReasonOf(emptyPool('combination'))).toBeNull();
    expect(widenReasonOf(emptyPool())).toBeNull();
    expect(widenReasonOf({ ...RATE_LIMITED, emptyBecause: 'club' })).toBeNull();
  });
});

describe('emptyPoolGate', () => {
  it.each([
    [
      'competition',
      'No match in those competitions',
      'Include every competition',
    ],
    ['club', 'No match for those clubs', 'Include every club'],
    ['era', 'No match in those seasons', 'Include every season'],
  ] as const)(
    'names the %s filter and offers to widen it',
    (reason, title, action) => {
      expect(emptyPoolGate(emptyPool(reason))).toEqual({
        title,
        detail: 'No match fits.',
        actionLabel: action,
        secondaryActionLabel: 'Change filters',
      });
    },
  );

  it.each([undefined, 'combination'] as const)(
    'only changes filters when blamed on %s',
    (reason) => {
      expect(emptyPoolGate(emptyPool(reason))).toEqual({
        title: 'No match for these filters together',
        detail: 'No match fits.',
        actionLabel: 'Change filters',
      });
    },
  );

  it('drops the widen when the caller cannot act on it', () => {
    expect(emptyPoolGate(emptyPool('club'), false)).toEqual({
      title: 'No match for these filters together',
      detail: 'No match fits.',
      actionLabel: 'Change filters',
    });
  });
});

describe('cooldownUntil', () => {
  it('adds the server retry time', () => {
    expect(cooldownUntil(RATE_LIMITED, NOW)).toBe(NOW + 2_000);
  });

  it('locks for a second when the server gives no time', () => {
    expect(cooldownUntil({ ...RATE_LIMITED, retryAfterMs: null }, NOW)).toBe(
      NOW + 1_000,
    );
  });
});

describe('heldCooldown', () => {
  it('keeps a running lockout', () => {
    expect(heldCooldown(NOW + 2_000, RATE_LIMITED, NOW + 5)).toBe(NOW + 2_000);
  });

  it('starts a new one once the last has passed', () => {
    expect(heldCooldown(null, RATE_LIMITED, NOW)).toBe(NOW + 2_000);
    expect(heldCooldown(NOW, RATE_LIMITED, NOW + 10)).toBe(NOW + 2_010);
  });
});

describe('cooldown copy', () => {
  it('rounds up to whole seconds', () => {
    expect(cooldownLabel(3_000)).toBe('Too many guesses. Try again in 3s');
    expect(cooldownLabel(2_001)).toBe('Too many guesses. Try again in 3s');
    expect(cooldownLabel(1_000)).toBe('Too many guesses. Try again in 1s');
  });

  it('never counts below one second', () => {
    expect(cooldownLabel(0)).toBe('Too many guesses. Try again in 1s');
    expect(cooldownLabel(-400)).toBe('Too many guesses. Try again in 1s');
  });

  it('spells the unit out for screen readers', () => {
    expect(cooldownAnnouncement(3_000)).toBe(
      'Too many guesses. Try again in 3 seconds.',
    );
    expect(cooldownAnnouncement(800)).toBe(
      'Too many guesses. Try again in 1 second.',
    );
  });
});

describe('reconnectingGate', () => {
  it('counts down to the server deadline, with no action', () => {
    const gate = reconnectingGate({
      status: 'reconnecting',
      reconnectDeadline: NOW + 18_000,
    });
    expect(gate?.title).toBe('Reconnecting');
    expect(gate?.countdown?.deadline).toBe(NOW + 18_000);
    expect(gate?.actionLabel).toBeUndefined();
    expect(gate?.detail).toBeUndefined();
  });

  it('keeps a stable title without a deadline', () => {
    expect(
      reconnectingGate({ status: 'reconnecting', reconnectDeadline: null }),
    ).toEqual({ title: 'Reconnecting' });
  });

  it('has no gate unless you are reconnecting', () => {
    expect(reconnectingGate(null)).toBeNull();
    expect(
      reconnectingGate({ status: 'connected', reconnectDeadline: null }),
    ).toBeNull();
    expect(
      reconnectingGate({ status: 'forfeited', reconnectDeadline: null }),
    ).toBeNull();
  });

  it('says the clock keeps running and what happens at zero', () => {
    expect(reconnectingDetail(18)).toBe(
      "The clock keeps running. If you're not back in 18s, you forfeit the duel.",
    );
  });
});
