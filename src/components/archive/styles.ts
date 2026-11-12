import { FOCUS_RING } from '@/styles/classes';

// Weights, not caps: a capped track starves fr ones
export const ARCHIVE_ROW =
  'grid h-26 grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)] content-center items-center gap-x-2 gap-y-1.5 px-4 sm:h-20 sm:grid-cols-[minmax(0,1fr)_3.5rem_minmax(0,1fr)] sm:gap-x-3 xl:h-16 xl:grid-cols-[6rem_minmax(0,1fr)_3.5rem_minmax(0,1fr)_minmax(0,1.75fr)_auto] xl:gap-y-0';

export const ARCHIVE_LIST = 'rounded-lg border border-line bg-surface-raised';

// Phones: meta, then actions; sm: side by side
export const ARCHIVE_ROW_FOOT =
  'col-span-3 row-start-2 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center xl:contents';

// Row height: smaller than the secondary button
export const ARCHIVE_PLAY_BUTTON = `shrink-0 rounded-sm border border-line px-3 py-1 text-14 leading-5 font-semibold text-fg hover:bg-surface-card aria-disabled:text-fg-muted aria-disabled:hover:bg-transparent ${FOCUS_RING}`;

export const ARCHIVE_ROW_ACTIONS =
  'flex shrink-0 gap-2 max-sm:self-end xl:col-start-6 xl:row-start-1';
