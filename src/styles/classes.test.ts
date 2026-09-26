import { describe, expect, it } from 'vitest';
import {
  LIFE_LOST_FILL_SHIFT,
  TIMER_COLOR_SHIFT,
  TURN_BORDER_SHIFT,
} from '@/styles/classes';
import { MOTION_DURATION_MS, MOTION_EASING } from '@/styles/motion';

describe('transition classes', () => {
  it.each([
    ['life lost', LIFE_LOST_FILL_SHIFT, MOTION_DURATION_MS.lifeLost],
    ['turn handover', TURN_BORDER_SHIFT, MOTION_DURATION_MS.turnHandover],
    ['timer colour', TIMER_COLOR_SHIFT, MOTION_DURATION_MS.timerColorShift],
  ])('keeps the %s duration in step with motion.ts', (_, classes, ms) => {
    expect(classes.split(' ')).toContain(`duration-${ms}`);
  });

  it('eases the turn handover out, as motion.ts does', () => {
    expect(MOTION_EASING.turnHandover).toBe('easeOut');
    expect(TURN_BORDER_SHIFT.split(' ')).toContain('ease-[ease-out]');
  });

  it('uses the timer colour curve from motion.ts', () => {
    const curve = MOTION_EASING.timerColorShift.join(',');
    expect(TIMER_COLOR_SHIFT.split(' ')).toContain(
      `ease-[cubic-bezier(${curve})]`,
    );
  });
});
