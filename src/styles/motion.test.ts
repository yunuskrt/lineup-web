import { describe, expect, it } from 'vitest';
import { MOTION_DURATION_MS, MOTION_SECONDS } from '@/styles/motion';

describe('MOTION_SECONDS', () => {
  it('mirrors every duration, in seconds', () => {
    expect(Object.keys(MOTION_SECONDS)).toEqual(
      Object.keys(MOTION_DURATION_MS),
    );
    for (const [key, ms] of Object.entries(MOTION_DURATION_MS)) {
      expect(MOTION_SECONDS[key as keyof typeof MOTION_SECONDS]).toBe(
        ms / 1000,
      );
    }
  });
});
