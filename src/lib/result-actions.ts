import type { ProAccess } from '@/types/pro';

export type ResultPrimary = 'playAgain' | 'newRoom' | 'backToPlay';
export type ResultSecondary = 'changeFilters' | 'backToPlay' | 'lockedNewRoom';

export type ResultActionsLayout = {
  primary: ResultPrimary;
  secondary: ResultSecondary;
};

// A Free room player can't host the next room
export function resultActionsLayout(
  isPrivate: boolean,
  hostAccess: ProAccess = 'open',
): ResultActionsLayout {
  if (!isPrivate) return { primary: 'playAgain', secondary: 'changeFilters' };
  if (hostAccess === 'open') {
    return { primary: 'newRoom', secondary: 'backToPlay' };
  }
  return { primary: 'backToPlay', secondary: 'lockedNewRoom' };
}
