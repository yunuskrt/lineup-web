import { FOCUS_RING } from '@/styles/classes';

// A fixed score column lines results up
export const ARCHIVE_ROW =
  'grid h-18 grid-cols-[minmax(0,1fr)_3rem_minmax(0,1fr)] content-center items-center gap-x-2 gap-y-1.5 px-4 sm:h-16 sm:grid-cols-[6rem_minmax(0,1fr)_3.5rem_minmax(0,1fr)_minmax(0,14rem)_auto] sm:gap-x-3 sm:gap-y-0';

export const ARCHIVE_LIST = 'rounded-lg border border-line bg-surface-raised';

// Phones: line two holds the meta and Play
export const ARCHIVE_ROW_FOOT =
  'col-span-3 row-start-2 flex min-w-0 items-center gap-2 sm:contents';

// Row height: smaller than the secondary button
export const ARCHIVE_PLAY_BUTTON = `shrink-0 rounded-sm border border-line px-3 py-1 text-14 leading-5 font-semibold text-fg hover:bg-surface-card aria-disabled:text-fg-muted aria-disabled:hover:bg-transparent ${FOCUS_RING}`;

export const ARCHIVE_ROW_ACTIONS =
  'flex shrink-0 gap-2 sm:col-start-6 sm:row-start-1';
