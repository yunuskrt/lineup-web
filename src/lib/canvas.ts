import { SQUAD_SIZE } from '@/lib/api/schemas/common';
import { TURN_LABELS } from '@/lib/duel-status';
import type {
  ActiveRing,
  CanvasClock,
  CanvasMode,
  ClockLabel,
  FoundCount,
  RingSetup,
} from '@/types/canvas';
import type { DuelActor } from '@/types/duel';
import type { RoundTiming } from '@/types/game';
import type { FoundPlayer } from '@/types/player';

export const ROUND_MS = 15_000;

export const ROUND_CLOCK_LABEL = 'Round clock';

// Far in the future, so the ring reads full and still
const UNSTARTED_AT = Number.MAX_SAFE_INTEGER - ROUND_MS;

export const UNSTARTED_ROUND: RoundTiming = {
  startedAt: UNSTARTED_AT,
  endsAt: UNSTARTED_AT + ROUND_MS,
};

const IDLE_RING: RingSetup = { round: UNSTARTED_ROUND, mode: 'waiting' };

// One ring, owned by whoever's turn it is
export function activeRing(
  clock: CanvasClock,
  turn: DuelActor | null,
): ActiveRing {
  if (clock.round === null || turn === null) {
    return { ...IDLE_RING, owner: 'you' };
  }

  return {
    round: clock.round,
    mode: clock.isFrozen ? 'frozen' : 'running',
    owner: turn,
  };
}

export function clockLabel(
  mode: CanvasMode,
  turn: DuelActor | null,
): ClockLabel {
  if (mode === 'solo' || turn === null) {
    return { text: ROUND_CLOCK_LABEL, actor: null };
  }
  return { text: TURN_LABELS[turn], actor: turn };
}

export function foundCountLabel(found: FoundPlayer[]): FoundCount {
  return {
    label: `${found.length}/${SQUAD_SIZE}`,
    spoken: `${found.length} of ${SQUAD_SIZE} found`,
  };
}
