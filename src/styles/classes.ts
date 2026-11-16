import { cva } from 'class-variance-authority';
import type { DuelActor } from '@/types/duel';

export const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus';

export const SITE_CONTAINER = 'mx-auto w-full max-w-6xl px-4 sm:px-6';

// Reaches the game rail's edges, so its rules run edge to edge
export const RAIL_SECTION = '-mx-3 px-3 sm:-mx-4 sm:px-4';

export const BOARD =
  'mx-auto w-full max-w-4xl rounded-lg border-2 border-line bg-surface-raised shadow-hard';

// Full-width rows, so the rules run edge to edge
export const BOARD_SECTION =
  'flex flex-col gap-4 px-4 py-6 not-first:border-t-2 not-first:border-line sm:px-8 sm:py-8';

// The rail's label look, as the Lives section
export const SECTION_LABEL = 'text-12 font-medium text-fg-muted uppercase';

// A full-bleed home band: an edge-to-edge ink rule
export const HOME_BAND = 'border-t-2 border-line';

// An outlined icon tile, as the mode cards
export const ICON_TILE =
  'flex items-center justify-center rounded-md border-2 border-line';

// A you / opponent colour bar
export const ACTOR_BAR = 'h-2.5 w-10 rounded-full border-2 border-line';

export const DUEL_ACTOR_BG: Record<DuelActor, string> = {
  you: 'bg-you',
  opponent: 'bg-opponent',
};

export const DUEL_ACTOR_TEXT: Record<DuelActor, string> = {
  you: 'text-you-text',
  opponent: 'text-opponent-text',
};

export const DUEL_ACTOR_BORDER: Record<DuelActor, string> = {
  you: 'border-you',
  opponent: 'border-opponent',
};

export const TYPE_DISPLAY =
  'font-display text-34 leading-none font-extrabold font-stretch-semi-expanded md:text-72 md:font-stretch-expanded';

export const TYPE_TITLE =
  'font-display text-30 leading-tight font-extrabold font-stretch-semi-expanded md:text-40';

export const TYPE_SECTION =
  'font-display text-24 leading-tight font-extrabold font-stretch-semi-expanded md:text-28';

export const TYPE_CARD_TITLE =
  'font-display text-20 leading-tight font-extrabold font-stretch-semi-expanded';

// Titles over ~20 characters
export const TYPE_TITLE_LONG =
  'font-display text-20 leading-tight font-bold font-stretch-normal';

export const TYPE_NUMBER =
  'font-display font-black font-stretch-expanded tabular-nums slashed-zero';

// One character box: the join field and the room code
export const CODE_BOX =
  'relative flex items-center justify-center border-y-2 border-r-2 border-line bg-surface-card text-fg first:rounded-l-md first:border-l-2 last:rounded-r-md';

// The 6-character code; its alphabet has no look-alikes
export const TYPE_ROOM_CODE =
  'font-display text-20 font-extrabold font-stretch-semi-expanded';

export const TYPE_STICKER =
  'font-display text-12 font-extrabold uppercase font-stretch-semi-expanded';

// Sinks into its shadow; no shift with reduced motion
const PRESS =
  'shadow-hard not-disabled:not-aria-disabled:active:shadow-none motion-safe:not-disabled:not-aria-disabled:active:translate-x-1 motion-safe:not-disabled:not-aria-disabled:active:translate-y-1';

// One source for ui/button and the call sites
export const buttonVariants = cva(
  `rounded-md border-2 border-line font-semibold disabled:cursor-not-allowed ${PRESS} ${FOCUS_RING}`,
  {
    variants: {
      variant: {
        primary: 'bg-brand text-on-accent disabled:opacity-70',
        secondary:
          'bg-surface-card text-fg hover:bg-surface-raised disabled:text-fg-muted disabled:hover:bg-surface-card',
      },
      size: {
        default: 'px-4 text-14',
        large: 'px-8 py-2.5 text-16',
        icon: 'size-10',
      },
    },
    // 2px outline; padding trimmed to keep each height
    compoundVariants: [
      { variant: 'primary', size: 'default', className: 'py-1' },
      { variant: 'secondary', size: 'default', className: 'py-1.75' },
    ],
    defaultVariants: { variant: 'primary', size: 'default' },
  },
);

// A choice that presses like a button; flat while busy
export const CHOICE_TILE = `rounded-md border-2 border-line bg-surface-card aria-disabled:shadow-none ${PRESS} ${FOCUS_RING}`;

export const PRIMARY_BUTTON = buttonVariants();

export const PRIMARY_BUTTON_LARGE = buttonVariants({ size: 'large' });

export const SECONDARY_BUTTON = buttonVariants({ variant: 'secondary' });

export const SECONDARY_BUTTON_LARGE = buttonVariants({
  variant: 'secondary',
  size: 'large',
});

export const TEXT_INPUT = `w-full rounded-md border-2 border-line bg-surface-card px-3 py-2.25 text-16 text-fg placeholder:text-fg-dim aria-invalid:border-danger read-only:text-fg-muted disabled:cursor-not-allowed disabled:opacity-70 ${FOCUS_RING}`;

export const TEXT_LINK = `rounded-sm font-medium text-fg underline decoration-fg-dim underline-offset-4 hover:decoration-fg ${FOCUS_RING}`;

// Current page: a 2px underline bar, not colour alone
export const NAV_LINK = `rounded-sm text-14 font-medium whitespace-nowrap text-fg-muted decoration-2 underline-offset-8 hover:text-fg aria-[current=page]:text-fg aria-[current=page]:underline ${FOCUS_RING}`;

export const QUIT_CHIP = `inline-flex items-center gap-1 rounded-md border-2 border-line bg-surface-card px-3 py-0.75 text-12 font-semibold uppercase text-fg hover:bg-surface-raised ${FOCUS_RING}`;

// Quit's height from sm; 24px stacked on phones
export const SOUND_TOGGLE = `flex size-6 items-center justify-center rounded-md border-2 border-line bg-surface-card text-fg hover:bg-surface-raised sm:size-7 ${FOCUS_RING}`;

export const FILTER_CHIP = `rounded-full border-2 border-line bg-surface-card px-3 py-1.25 text-14 font-medium text-fg hover:bg-surface-raised aria-pressed:bg-brand ${FOCUS_RING}`;

export const SELECT_TRIGGER = `inline-flex items-center justify-between gap-2 rounded-md border-2 border-line bg-surface-card px-3 py-1.75 text-14 text-fg tabular-nums hover:bg-surface data-popup-open:shadow-hard-sm data-disabled:cursor-not-allowed data-disabled:opacity-70 ${FOCUS_RING}`;

// 16px on phones stops iOS zooming on focus
// Room for the search icon on the left
export const FILTER_SEARCH = `w-full rounded-md border-2 border-line bg-surface-card py-1.25 pr-3 pl-9 text-16 text-fg placeholder:text-fg-dim sm:text-14 ${FOCUS_RING}`;

// 24px hit area around a small dot (WCAG 2.5.8)
export const DOT_BUTTON = `flex size-6 items-center justify-center rounded-sm disabled:cursor-not-allowed ${FOCUS_RING}`;

export const DEV_PREVIEW_BUTTON = `rounded-md border-2 border-line bg-surface-card px-3 py-1.25 text-14 text-fg hover:bg-surface-raised disabled:text-fg-dim disabled:hover:bg-surface-card aria-pressed:bg-brand ${FOCUS_RING}`;

// Literal for Tailwind; checked against motion.ts
export const LIFE_LOST_FILL_SHIFT =
  'transition-[fill] duration-480 ease-[ease]';

// A stage change, never the sweep
export const TIMER_COLOR_SHIFT =
  'transition-[stroke,stroke-width,color] duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]';
