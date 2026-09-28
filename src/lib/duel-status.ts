import type { DuelActor } from '@/types/duel';

export const TURN_LABELS: Record<DuelActor, string> = {
  you: 'Your turn',
  opponent: 'Their turn',
};

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
