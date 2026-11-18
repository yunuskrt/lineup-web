import { ICON_TILE } from '@/styles/classes';

// Row gap leaves room for the corner icons
export const TILES =
  'grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-4 sm:gap-x-4';

export const TILE =
  'relative flex flex-col gap-2 rounded-lg border-2 border-line bg-surface-card px-4 pt-8 pb-4 shadow-hard sm:px-6 sm:pt-9 sm:pb-6';

export const CORNER = `absolute -top-4 left-3 size-9 bg-block-butter ${ICON_TILE}`;

// Two label lines kept, so tiles never jump
export const LABEL_BOX = 'min-h-10 sm:min-h-12';
