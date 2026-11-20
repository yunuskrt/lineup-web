import type { Side } from '@/types/match';

// Phones: crest over name. From sm both pack toward the score
export const TEAM: Record<Side, string> = {
  home: 'flex min-w-0 flex-col items-center gap-1 sm:flex-row-reverse sm:gap-3',
  away: 'flex min-w-0 flex-col items-center gap-1 sm:flex-row sm:gap-3',
};
