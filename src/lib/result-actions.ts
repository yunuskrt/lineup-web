import type { ProAccess } from '@/types/pro';

export type ResultPrimary = 'playAgain' | 'newRoom' | 'backToPlay' | 'playDuel';
export type ResultSecondary = 'changeFilters' | 'backToPlay' | 'lockedNewRoom';

export type ResultActionsLayout = {
  primary: ResultPrimary;
  secondary: ResultSecondary;
};

// A Free room player can't host the next room
export function resultActionsLayout(
  isPrivate: boolean,
  hostAccess: ProAccess = 'open',
  // Solo at its daily cap (R11): no Play again
  isSoloCapped = false,
): ResultActionsLayout {
  if (isSoloCapped) return { primary: 'playDuel', secondary: 'backToPlay' };
  if (!isPrivate) return { primary: 'playAgain', secondary: 'changeFilters' };
  if (hostAccess === 'open') {
    return { primary: 'newRoom', secondary: 'backToPlay' };
  }
  return { primary: 'backToPlay', secondary: 'lockedNewRoom' };
}
