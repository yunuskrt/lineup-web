import { cn } from '@/lib/utils';
import {
  PRIMARY_BUTTON_LARGE,
  SECONDARY_BUTTON_LARGE,
  TEXT_LINK,
  TYPE_TITLE,
} from '@/styles/classes';

// Focused from script on a step change
export const STEP_HEADING = `${TYPE_TITLE} outline-none`;

export const STEP_INTRO = 'text-16 text-pretty text-fg-muted';

// Back and Next, Back first
export const STEP_ACTIONS = 'flex flex-wrap items-center gap-2 sm:gap-3';

// Narrower on phones: Back and Start share a row
export const STEP_BACK = cn(SECONDARY_BUTTON_LARGE, 'px-4 sm:px-5');

export const STEP_NEXT = cn(PRIMARY_BUTTON_LARGE, 'max-sm:px-6');

export const STEP_EDIT = `shrink-0 text-14 ${TEXT_LINK}`;

export const FILTER_ROW =
  'grid gap-3 border-t border-rule py-5 last:pb-0 md:grid-cols-[8rem_1fr] md:gap-6';

export const FILTER_LABEL = 'text-14 font-medium md:py-1.5';

export const FILTER_NOTE = 'text-14 text-fg-muted';
