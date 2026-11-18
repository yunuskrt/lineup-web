import { BOARD_LIST, FOCUS_RING } from '@/styles/classes';

// Weights, not caps: a capped track starves fr ones
export const ARCHIVE_ROW =
  'grid h-26 grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)] content-center items-center gap-x-2 gap-y-1.5 px-4 sm:h-20 sm:grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)] sm:gap-x-3 xl:h-16 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_3.5rem_minmax(0,1fr)_auto] xl:gap-y-0';

export const ARCHIVE_LIST = BOARD_LIST;

// Phones: meta, then actions; sm: side by side
export const ARCHIVE_ROW_FOOT =
  'col-span-3 row-start-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center xl:contents';

export const TEAM_NAME =
  'truncate font-display text-14 leading-5 font-bold sm:text-16 sm:leading-6';

// A small secondary button: the row keeps its height
export const ARCHIVE_PLAY_BUTTON = `shrink-0 rounded-md border-2 border-line bg-surface-card px-3 py-0.75 text-14 leading-5 font-semibold text-fg shadow-hard-sm hover:bg-surface-raised not-aria-disabled:active:shadow-none motion-safe:not-aria-disabled:active:translate-x-0.5 motion-safe:not-aria-disabled:active:translate-y-0.5 aria-disabled:cursor-not-allowed aria-disabled:text-fg-muted aria-disabled:shadow-none aria-disabled:hover:bg-surface-card ${FOCUS_RING}`;

export const ARCHIVE_ROW_ACTIONS =
  'flex shrink-0 gap-2 max-sm:self-end xl:col-start-5 xl:row-start-1';
