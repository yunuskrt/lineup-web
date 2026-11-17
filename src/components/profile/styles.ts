import { cn } from '@/lib/utils';
import { BOARD_SECTION, TYPE_NUMBER } from '@/styles/classes';

// The record and stats section of the page
export const PROFILE_FIGURES = cn(BOARD_SECTION, 'grid gap-6 lg:grid-cols-12');

// The record: the page's one lavender block
export const RECORD_BLOCK =
  'flex flex-col gap-6 rounded-lg border-2 border-line bg-block-lavender p-4 text-on-accent shadow-hard sm:p-6 lg:col-span-7';

export const RECORD_HEADER =
  'flex items-baseline justify-between gap-4 border-b-2 border-line pb-3';

export const RECORD_NUMERAL = cn(
  TYPE_NUMBER,
  'text-40 leading-none sm:text-48',
);

export const RECORD_BAR =
  'flex h-4 gap-0.5 overflow-hidden rounded-full border-2 border-line';

// W / D / L beside each label, as profile/03-record-b
export const LETTER_TILE =
  'relative flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-sm border-2 border-line font-display text-12 leading-none font-black';

// Four stats in a 2 × 2 grid split by ink rules
export const STATS_BLOCK =
  'grid grid-cols-2 grid-rows-2 overflow-hidden rounded-lg border-2 border-line bg-surface-card';

export const STAT_TILE =
  'flex flex-col justify-center gap-1 p-4 odd:border-r-2 odd:border-line nth-[-n+2]:border-b-2 nth-[-n+2]:border-line sm:p-5';

export const STAT_LABEL =
  'text-12 leading-4 font-medium text-fg-muted uppercase';

export const HISTORY_LIST =
  'divide-y-2 divide-line overflow-hidden rounded-lg border-2 border-line bg-surface-card';

// Two lines on phones, one from sm; lg adds pips
export const HISTORY_ROW =
  'grid h-18 grid-cols-[minmax(0,1fr)_auto] content-center items-center gap-x-3 gap-y-1 px-3 sm:h-14 sm:px-4 sm:grid-cols-[4rem_6.5rem_7rem_minmax(0,1fr)_4.5rem_6rem] sm:gap-y-0 lg:grid-cols-[4rem_6.5rem_7rem_minmax(0,1fr)_4.5rem_4.5rem_6rem] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus';
