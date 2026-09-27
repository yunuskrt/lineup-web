import { describe, expect, it } from 'vitest';
import {
  DUEL_ACTOR_BG,
  DUEL_ACTOR_BORDER,
  DUEL_ACTOR_TEXT,
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

describe('duel actor classes', () => {
  // Swapping amber and blue is the worst duel failure
  it.each([
    ['background', DUEL_ACTOR_BG, 'bg'],
    ['text', DUEL_ACTOR_TEXT, 'text'],
    ['border', DUEL_ACTOR_BORDER, 'border'],
  ])('gives each actor its own %s token', (_, classes, prefix) => {
    expect(classes).toEqual({
      you: `${prefix}-you`,
      opponent: `${prefix}-opponent`,
    });
  });
});
