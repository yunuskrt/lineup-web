import type { ProAccess } from '@/types/pro';

export type ResultPrimary =
  | 'playAgain'
  | 'playItAgain'
  | 'practiseAgain'
  | 'newRoom'
  | 'backToPlay'
  | 'playDuel';
export type ResultSecondary =
  'changeFilters' | 'backToPlay' | 'backToArchive' | 'lockedNewRoom';

export type ResultActionsLayout = {
  primary: ResultPrimary;
  secondary: ResultSecondary;
};

export type ResultContext = {
  // A room game: New room and Back to play
  isPrivate?: boolean;
  // Hosting is Pro (R10); open when unset
  hostAccess?: ProAccess;
  // Solo at its daily cap (R11): no Play again
  isSoloCapped?: boolean;
  // One match from the archive (R13)
  isPicked?: boolean;
  // No clock, not saved: the same again (R14)
  isPractice?: boolean;
};

// A Free room player can't host the next room
export function resultActionsLayout({
  isPrivate = false,
  hostAccess = 'open',
  isSoloCapped = false,
  isPicked = false,
  isPractice = false,
}: ResultContext = {}): ResultActionsLayout {
  if (isSoloCapped) return { primary: 'playDuel', secondary: 'backToPlay' };
  if (isPractice) {
    const secondary = isPicked ? 'backToArchive' : 'backToPlay';
    return { primary: 'practiseAgain', secondary };
  }
  if (isPicked) return { primary: 'playItAgain', secondary: 'backToArchive' };
  if (!isPrivate) return { primary: 'playAgain', secondary: 'changeFilters' };
  if (hostAccess === 'open') {
    return { primary: 'newRoom', secondary: 'backToPlay' };
  }
  return { primary: 'backToPlay', secondary: 'lockedNewRoom' };
}
