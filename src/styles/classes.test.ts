import { describe, expect, it } from 'vitest';
import {
  CHOICE_BUTTON,
  DOT_BUTTON,
  DUEL_ACTOR_BG,
  DUEL_ACTOR_BORDER,
  DUEL_ACTOR_TEXT,
  FILTER_CHIP,
  FILTER_SELECT,
  FOCUS_RING,
  LIFE_LOST_BORDER_SHIFT,
  LIFE_LOST_FILL_SHIFT,
  PRIMARY_BUTTON,
  PRIMARY_BUTTON_LARGE,
  QUIT_CHIP,
  SECONDARY_BUTTON,
  TEXT_INPUT,
  TEXT_LINK,
  TIMER_COLOR_SHIFT,
} from '@/styles/classes';
import { MOTION_DURATION_MS, MOTION_EASING } from '@/styles/motion';

describe('transition classes', () => {
  it.each([
    ['life lost', LIFE_LOST_FILL_SHIFT, MOTION_DURATION_MS.lifeLost],
    ['tile border', LIFE_LOST_BORDER_SHIFT, MOTION_DURATION_MS.lifeLost],
    ['timer colour', TIMER_COLOR_SHIFT, MOTION_DURATION_MS.timerColorShift],
  ])('keeps the %s duration in step with motion.ts', (_, classes, ms) => {
    expect(classes.split(' ')).toContain(`duration-${ms}`);
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

describe('focus rings', () => {
  it('draws a visible outline in the brand colour', () => {
    const classes = FOCUS_RING.split(' ');
    expect(classes).toContain('focus-visible:outline-2');
    expect(classes).toContain('focus-visible:outline-brand');
  });

  // A control without it is invisible to the keyboard
  it.each([
    ['PRIMARY_BUTTON', PRIMARY_BUTTON],
    ['PRIMARY_BUTTON_LARGE', PRIMARY_BUTTON_LARGE],
    ['SECONDARY_BUTTON', SECONDARY_BUTTON],
    ['CHOICE_BUTTON', CHOICE_BUTTON],
    ['TEXT_LINK', TEXT_LINK],
    ['TEXT_INPUT', TEXT_INPUT],
    ['QUIT_CHIP', QUIT_CHIP],
    ['FILTER_CHIP', FILTER_CHIP],
    ['FILTER_SELECT', FILTER_SELECT],
    ['DOT_BUTTON', DOT_BUTTON],
  ])('gives %s the shared focus ring', (_, classes) => {
    expect(classes).toContain(FOCUS_RING);
  });
});
