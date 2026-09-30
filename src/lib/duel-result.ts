import type { DuelActor, DuelFoundPlayer, DuelResult } from '@/types/duel';

export type DuelResultCopyOptions = { isConnectionLost?: boolean };

// Your forfeit arrives as a loss marked isForfeit
export function isYourForfeit(result: DuelResult): boolean {
  return result.outcome === 'loss' && result.isForfeit;
}

export function duelResultTitle(
  result: DuelResult,
  { isConnectionLost = false }: DuelResultCopyOptions = {},
): string {
  if (isYourForfeit(result)) {
    return isConnectionLost ? 'Disconnected' : 'You left';
  }

  switch (result.outcome) {
    case 'win':
      return 'You won';
    case 'loss':
      return 'You lost';
    case 'draw':
      return 'Draw';
    case 'forfeit_win':
      return 'Opponent left';
  }
}

export function duelResultDetail(
  result: DuelResult,
  { isConnectionLost = false }: DuelResultCopyOptions = {},
): string {
  if (isYourForfeit(result)) {
    return isConnectionLost
      ? "You didn't reconnect in time."
      : 'You left the duel.';
  }

  const { handle } = result.opponent;
  switch (result.outcome) {
    case 'win':
      return `${handle} ran out of lives.`;
    case 'loss':
      return 'You ran out of lives.';
    case 'draw':
      return 'All eleven named. Neither side lost.';
    case 'forfeit_win':
      return `${handle} left the duel.`;
  }
}

export function foundTally(
  found: readonly DuelFoundPlayer[],
): Record<DuelActor, number> {
  return {
    you: found.filter((player) => player.foundBy === 'you').length,
    opponent: found.filter((player) => player.foundBy === 'opponent').length,
  };
}
