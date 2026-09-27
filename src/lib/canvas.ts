import { SQUAD_SIZE } from '@/lib/api/schemas/common';
import type { CanvasClock, FoundCount, RingSetup } from '@/types/canvas';
import type { DuelActor } from '@/types/duel';
import type { RoundTiming } from '@/types/game';
import type { FoundPlayer } from '@/types/player';

export const ROUND_MS = 15_000;

// Far in the future, so the ring reads full and still
const UNSTARTED_AT = Number.MAX_SAFE_INTEGER - ROUND_MS;

export const UNSTARTED_ROUND: RoundTiming = {
  startedAt: UNSTARTED_AT,
  endsAt: UNSTARTED_AT + ROUND_MS,
};

const IDLE_RING: RingSetup = { round: UNSTARTED_ROUND, mode: 'waiting' };

export function ringSetups(
  clock: CanvasClock,
  turn: DuelActor | null,
): Record<DuelActor, RingSetup> {
  if (clock.round === null || turn === null) {
    return { you: IDLE_RING, opponent: IDLE_RING };
  }

  const live: RingSetup = {
    round: clock.round,
    mode: clock.isFrozen ? 'frozen' : 'running',
  };

  return turn === 'you'
    ? { you: live, opponent: IDLE_RING }
    : { you: IDLE_RING, opponent: live };
}

export function foundCountLabel(found: FoundPlayer[]): FoundCount {
  return {
    label: `${found.length}/${SQUAD_SIZE}`,
    spoken: `${found.length} of ${SQUAD_SIZE} found`,
  };
}
