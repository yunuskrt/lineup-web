import { describe, expect, it } from 'vitest';
import { soloAllowanceSchema } from '@/lib/api/schemas/solo';
import {
  allowanceLine,
  capLine,
  isDailyCap,
  isSoloCapped,
  refetchAtReset,
  RESET_REFETCH_FLOOR_MS,
  resetTimeOf,
  runsLeft,
} from '@/lib/solo-allowance';
import type { ApiError } from '@/types/api';
import type { SoloAllowance } from '@/types/solo';

// 2026-11-13T00:00:00Z, the next UTC midnight
const RESETS_AT = Date.UTC(2026, 10, 13);

function allowance(used: number, limit: number | null = 5): SoloAllowance {
  return { limit, used, resetsAt: RESETS_AT };
}

describe('allowanceLine', () => {
  it('counts down the server runs left today', () => {
    expect(allowanceLine(allowance(0))).toBe('5 of 5 solo runs left today');
    expect(allowanceLine(allowance(2))).toBe('3 of 5 solo runs left today');
    expect(allowanceLine(allowance(4))).toBe('1 of 5 solo runs left today');
  });

  it('names the reset in the local time at 0 left', () => {
    expect(allowanceLine(allowance(5), 'UTC')).toBe(
      "You've played your 5 solo runs today. More at 00:00.",
    );
    expect(allowanceLine(allowance(5), 'Europe/Istanbul')).toBe(
      "You've played your 5 solo runs today. More at 03:00.",
    );
  });

  it('shows nothing while unlimited or before a session', () => {
    expect(allowanceLine(allowance(9, null))).toBeNull();
    expect(allowanceLine(null)).toBeNull();
  });

  it('never counts below 0', () => {
    expect(runsLeft(allowance(7))).toBe(0);
    expect(isSoloCapped(allowance(7))).toBe(true);
  });
});

describe('capLine', () => {
  it('only words the cap once the runs are used up', () => {
    expect(capLine(allowance(4))).toBeNull();
    expect(capLine(allowance(5, null))).toBeNull();
    expect(capLine(allowance(5), 'UTC')).toMatch(/More at 00:00\.$/);
  });
});

describe('isSoloCapped', () => {
  it('is never capped while unlimited or unknown', () => {
    expect(isSoloCapped(allowance(50, null))).toBe(false);
    expect(isSoloCapped(null)).toBe(false);
    expect(isSoloCapped(allowance(4))).toBe(false);
  });
});

describe('resetTimeOf', () => {
  it('uses a 24-hour clock', () => {
    expect(resetTimeOf(RESETS_AT + 13 * 3_600_000, 'UTC')).toBe('13:00');
  });
});

describe('refetchAtReset', () => {
  const NOW = RESETS_AT - 5 * 3_600_000;

  it('asks again exactly when the server day turns, at 0 left', () => {
    expect(refetchAtReset(allowance(5), NOW)).toBe(5 * 3_600_000);
  });

  it('waits at least the floor once the reset has passed', () => {
    expect(refetchAtReset(allowance(5), RESETS_AT + 10)).toBe(
      RESET_REFETCH_FLOOR_MS,
    );
  });

  it('never polls with runs left, while unlimited or unknown', () => {
    expect(refetchAtReset(allowance(4), NOW)).toBe(false);
    expect(refetchAtReset(allowance(9, null), NOW)).toBe(false);
    expect(refetchAtReset(null, NOW)).toBe(false);
  });
});

describe('isDailyCap', () => {
  const base: ApiError = {
    code: 'forbidden',
    message: 'no',
    retryAfterMs: 1_000,
  };

  it('needs a forbidden with the daily_cap reason', () => {
    expect(isDailyCap({ ...base, reason: 'daily_cap' })).toBe(true);
    expect(isDailyCap({ ...base, reason: 'pro_required' })).toBe(false);
    expect(isDailyCap(base)).toBe(false);
  });
});

describe('soloAllowanceSchema', () => {
  it('reads R11 for Free and for unlimited', () => {
    expect(soloAllowanceSchema.safeParse(allowance(3)).success).toBe(true);
    expect(soloAllowanceSchema.safeParse(allowance(3, null)).success).toBe(
      true,
    );
    expect(soloAllowanceSchema.safeParse(allowance(-1)).success).toBe(false);
  });
});
