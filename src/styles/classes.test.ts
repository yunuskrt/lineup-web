import { describe, expect, it } from 'vitest';
import {
  buttonVariants,
  DOT_BUTTON,
  DUEL_ACTOR_BG,
  DUEL_ACTOR_BORDER,
  DUEL_ACTOR_TEXT,
  FILTER_CHIP,
  FILTER_SEARCH,
  FOCUS_RING,
  LIFE_LOST_FILL_SHIFT,
  MARQUEE_LOOP_DURATION,
  NAV_LINK,
  PRIMARY_BUTTON,
  PRIMARY_BUTTON_LARGE,
  QUIT_CHIP,
  SECONDARY_BUTTON,
  SECONDARY_BUTTON_LARGE,
  SELECT_TRIGGER,
  SOUND_TOGGLE,
  TEXT_INPUT,
  TEXT_LINK,
  TIMER_COLOR_SHIFT,
  TYPE_CARD_TITLE,
  TYPE_DISPLAY,
  TYPE_NUMBER,
  TYPE_SECTION,
  TYPE_STICKER,
  TYPE_TITLE,
  TYPE_TITLE_LONG,
} from '@/styles/classes';
import { MOTION_DURATION_MS, MOTION_EASING } from '@/styles/motion';

describe('transition classes', () => {
  it.each([
    ['life lost', LIFE_LOST_FILL_SHIFT, MOTION_DURATION_MS.lifeLost],
    ['timer colour', TIMER_COLOR_SHIFT, MOTION_DURATION_MS.timerColorShift],
  ])('keeps the %s duration in step with motion.ts', (_, classes, ms) => {
    expect(classes.split(' ')).toContain(`duration-${ms}`);
  });

  it('keeps the marquee loop in step with motion.ts', () => {
    expect(MARQUEE_LOOP_DURATION).toBe(
      `[animation-duration:${MOTION_DURATION_MS.marqueeLoop}ms]`,
    );
  });

  it('uses the timer colour curve from motion.ts', () => {
    const curve = MOTION_EASING.timerColorShift.join(',');
    expect(TIMER_COLOR_SHIFT.split(' ')).toContain(
      `ease-[cubic-bezier(${curve})]`,
    );
  });
});

describe('duel actor classes', () => {
  // Swapping blue and orange is the worst duel failure
  it.each([
    ['background', DUEL_ACTOR_BG, 'bg', ''],
    ['text', DUEL_ACTOR_TEXT, 'text', '-text'],
    ['border', DUEL_ACTOR_BORDER, 'border', ''],
  ])('gives each actor its own %s token', (_, classes, prefix, suffix) => {
    expect(classes).toEqual({
      you: `${prefix}-you${suffix}`,
      opponent: `${prefix}-opponent${suffix}`,
    });
  });
});

describe('focus rings', () => {
  it('draws a visible outline in the focus colour', () => {
    const classes = FOCUS_RING.split(' ');
    expect(classes).toContain('focus-visible:outline-2');
    expect(classes).toContain('focus-visible:outline-focus');
  });

  // A control without it is invisible to the keyboard
  it.each([
    ['PRIMARY_BUTTON', PRIMARY_BUTTON],
    ['PRIMARY_BUTTON_LARGE', PRIMARY_BUTTON_LARGE],
    ['SECONDARY_BUTTON', SECONDARY_BUTTON],
    ['TEXT_LINK', TEXT_LINK],
    ['TEXT_INPUT', TEXT_INPUT],
    ['QUIT_CHIP', QUIT_CHIP],
    ['SOUND_TOGGLE', SOUND_TOGGLE],
    ['FILTER_CHIP', FILTER_CHIP],
    ['SELECT_TRIGGER', SELECT_TRIGGER],
    ['FILTER_SEARCH', FILTER_SEARCH],
    ['DOT_BUTTON', DOT_BUTTON],
  ])('gives %s the shared focus ring', (_, classes) => {
    expect(classes).toContain(FOCUS_RING);
  });
});

describe('pressed buttons', () => {
  const BUTTONS = [
    ['PRIMARY_BUTTON', PRIMARY_BUTTON],
    ['PRIMARY_BUTTON_LARGE', PRIMARY_BUTTON_LARGE],
    ['SECONDARY_BUTTON', SECONDARY_BUTTON],
    ['SECONDARY_BUTTON_LARGE', SECONDARY_BUTTON_LARGE],
  ];

  it.each(BUTTONS)('gives %s the hard shadow it sinks into', (_, classes) => {
    const tokens = classes.split(' ');
    expect(tokens).toContain('shadow-hard');
    expect(tokens.some((token) => token.endsWith('active:shadow-none'))).toBe(
      true,
    );
  });

  // Reduced motion keeps the shadow change, never the shift
  it.each(BUTTONS)('moves %s only under motion-safe', (_, classes) => {
    const shifts = classes
      .split(' ')
      .filter((token) => token.includes('translate-'));
    expect(shifts.length).toBeGreaterThan(0);
    for (const shift of shifts) expect(shift).toMatch(/^motion-safe:/);
  });

  it.each(BUTTONS)('keeps %s still while disabled', (_, classes) => {
    for (const token of classes.split(' ')) {
      if (token.includes('active:')) {
        expect(token).toContain('not-disabled:not-aria-disabled:');
      }
    }
  });
});

describe('type roles', () => {
  it.each([
    ['TYPE_DISPLAY', TYPE_DISPLAY],
    ['TYPE_TITLE', TYPE_TITLE],
    ['TYPE_SECTION', TYPE_SECTION],
    ['TYPE_CARD_TITLE', TYPE_CARD_TITLE],
    ['TYPE_TITLE_LONG', TYPE_TITLE_LONG],
    ['TYPE_NUMBER', TYPE_NUMBER],
    ['TYPE_STICKER', TYPE_STICKER],
  ])('sets %s in Archivo with an explicit width', (_, classes) => {
    const tokens = classes.split(' ');
    expect(tokens).toContain('font-display');
    expect(tokens.some((token) => token.startsWith('font-stretch-'))).toBe(
      true,
    );
  });

  // The clock's digits must not change width each second
  it('keeps numerals tabular, with the slashed zero', () => {
    const tokens = TYPE_NUMBER.split(' ');
    expect(tokens).toContain('tabular-nums');
    expect(tokens).toContain('slashed-zero');
  });

  // Width 125 overflows a 320px phone; it waits for md
  it('widens the display only from md', () => {
    const tokens = TYPE_DISPLAY.split(' ');
    expect(tokens).toContain('font-stretch-semi-expanded');
    expect(tokens).toContain('md:font-stretch-expanded');
    expect(tokens).not.toContain('font-stretch-expanded');
  });
});

describe('button variants', () => {
  // ui/button and the call sites share one source
  it('builds the shared constants from buttonVariants', () => {
    expect(PRIMARY_BUTTON).toBe(buttonVariants());
    expect(PRIMARY_BUTTON_LARGE).toBe(buttonVariants({ size: 'large' }));
    expect(SECONDARY_BUTTON).toBe(buttonVariants({ variant: 'secondary' }));
    expect(SECONDARY_BUTTON_LARGE).toBe(
      buttonVariants({ variant: 'secondary', size: 'large' }),
    );
  });

  // Each size keeps its height with the 2px outline
  it.each([
    ['primary', 'default', 'py-1'],
    ['secondary', 'default', 'py-1.75'],
    ['primary', 'large', 'py-2.5'],
    ['secondary', 'large', 'py-2.5'],
  ] as const)('pads %s %s with %s only', (variant, size, padding) => {
    const paddings = buttonVariants({ variant, size })
      .split(' ')
      .filter((token) => token.startsWith('py-'));
    expect(paddings).toEqual([padding]);
  });

  it.each([
    ['primary', 'bg-brand'],
    ['secondary', 'bg-surface-card'],
  ] as const)('fills %s with %s', (variant, fill) => {
    expect(buttonVariants({ variant }).split(' ')).toContain(fill);
  });
});

describe('nav links', () => {
  // theme.md: never colour alone
  it('marks the current page with an underline bar', () => {
    const tokens = NAV_LINK.split(' ');
    expect(tokens).toContain('aria-[current=page]:underline');
    expect(tokens).toContain('decoration-2');
  });

  it('gives nav links the shared focus ring', () => {
    expect(NAV_LINK).toContain(FOCUS_RING);
  });
});
