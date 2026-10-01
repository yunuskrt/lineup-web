import { describe, expect, it } from 'vitest';
import {
  activeRing,
  clockLabel,
  foundCountLabel,
  ROUND_CLOCK_LABEL,
  ROUND_MS,
  UNSTARTED_ROUND,
} from '@/lib/canvas';
import { displaySeconds, remainingMs, sweepFraction } from '@/lib/countdown';
import type { RoundTiming } from '@/types/game';
import type { FoundPlayer } from '@/types/player';

const START = 1_700_000_000_000;

const ROUND: RoundTiming = { startedAt: START, endsAt: START + ROUND_MS };

function playersOf(count: number): FoundPlayer[] {
  return Array.from({ length: count }, (_, slot) => ({
    id: `p-${slot}`,
    name: `Player ${slot}`,
    slot,
    position: 'MF',
    imageUrl: null,
  }));
}

describe('UNSTARTED_ROUND', () => {
  it('reads as a full, unmoved round at any real time', () => {
    const remaining = remainingMs(UNSTARTED_ROUND, START);
    expect(displaySeconds(remaining)).toBe(15);
    expect(sweepFraction(remaining, UNSTARTED_ROUND)).toBe(1);
  });
});

describe('activeRing', () => {
  const live = { round: ROUND, isFrozen: false };

  it('waits, unowned, before the first round', () => {
    expect(activeRing({ round: null, isFrozen: false }, 'you')).toEqual({
      round: UNSTARTED_ROUND,
      mode: 'waiting',
      owner: 'you',
    });
  });

  it('waits while no one has a turn', () => {
    expect(activeRing(live, null).mode).toBe('waiting');
  });

  it.each(['you', 'opponent'] as const)(
    'runs as the clock of %s on their turn',
    (turn) => {
      expect(activeRing(live, turn)).toEqual({
        round: ROUND,
        mode: 'running',
        owner: turn,
      });
    },
  );

  it('freezes when the server froze the round', () => {
    expect(activeRing({ round: ROUND, isFrozen: true }, 'opponent')).toEqual({
      round: ROUND,
      mode: 'frozen',
      owner: 'opponent',
    });
  });
});

describe('clockLabel', () => {
  it('reads as the round clock in solo', () => {
    expect(clockLabel('solo', 'you')).toEqual({
      text: ROUND_CLOCK_LABEL,
      actor: null,
    });
  });

  it('reads as the round clock before the first duel round', () => {
    expect(clockLabel('duel', null)).toEqual({
      text: ROUND_CLOCK_LABEL,
      actor: null,
    });
  });

  it('names whose turn it is during a duel round', () => {
    expect(clockLabel('duel', 'you')).toEqual({
      text: 'Your turn',
      actor: 'you',
    });
    expect(clockLabel('duel', 'opponent')).toEqual({
      text: 'Their turn',
      actor: 'opponent',
    });
  });
});

describe('foundCountLabel', () => {
  it('labels the count against the squad size', () => {
    expect(foundCountLabel(playersOf(4))).toEqual({
      label: '4/11',
      spoken: '4 of 11 found',
    });
    expect(foundCountLabel([]).label).toBe('0/11');
    expect(foundCountLabel(playersOf(11)).spoken).toBe('11 of 11 found');
  });
});
