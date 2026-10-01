import type { DuelActor } from '@/types/duel';
import type { Lives } from '@/types/game';

export const TURN_LABELS: Record<DuelActor, string> = {
  you: 'Your turn',
  opponent: 'Their turn',
};

export type LivesByActor = Record<DuelActor, Lives | null>;

const ACTORS: DuelActor[] = ['you', 'opponent'];

// Display only: whose pip just emptied, if anyone's
export function droppedLifeActor(
  before: LivesByActor,
  after: LivesByActor,
): DuelActor | null {
  const dropped = ACTORS.find((actor) => {
    const [was, now] = [before[actor], after[actor]];
    return was !== null && now !== null && now < was;
  });
  return dropped ?? null;
}

// A peek beats a hold, which beats the turn
export function shownLivesActor(
  peek: DuelActor | null,
  hold: DuelActor | null,
  turn: DuelActor | null,
): DuelActor {
  return peek ?? hold ?? turn ?? 'you';
}

// Display only; the server decides the forfeit
export function reconnectSecondsLeft(deadline: number, now: number): number {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}

// Their clock only runs on their turn; say so then
export function turnAnnouncement(
  turn: DuelActor | null,
  isReconnecting: boolean,
): string {
  const turnLabel = turn ? `${TURN_LABELS[turn]}.` : '';
  if (!isReconnecting) return turnLabel;
  const running = turn === 'opponent' ? ' Their clock keeps running.' : '';
  return `${turnLabel} Your opponent is reconnecting.${running}`.trim();
}

// Said outright, or a reconnect reads as a freeze
export function waitingLine(
  handle: string | null,
  isReconnecting: boolean,
): string {
  const name = handle ?? 'Your opponent';
  if (isReconnecting)
    return `${name} is reconnecting. Their clock keeps running.`;
  return `Waiting for ${handle ?? 'your opponent'}`;
}
