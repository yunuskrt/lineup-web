import { describe, expect, it } from 'vitest';
import {
  foundCountLabel,
  ringSetups,
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

describe('ringSetups', () => {
  it('stops both rings before the first round', () => {
    const setups = ringSetups({ round: null, isFrozen: false }, 'you');
    expect(setups.you).toEqual({ round: UNSTARTED_ROUND, mode: 'waiting' });
    expect(setups.opponent).toEqual({
      round: UNSTARTED_ROUND,
      mode: 'waiting',
    });
  });

  it('stops both rings while no one has a turn', () => {
    const setups = ringSetups({ round: ROUND, isFrozen: false }, null);
    expect(setups.you.mode).toBe('waiting');
    expect(setups.opponent.mode).toBe('waiting');
  });

  it('runs the ring of the side whose turn it is', () => {
    const clock = { round: ROUND, isFrozen: false };
    expect(ringSetups(clock, 'you').you).toEqual({
      round: ROUND,
      mode: 'running',
    });
    expect(ringSetups(clock, 'you').opponent.mode).toBe('waiting');
    expect(ringSetups(clock, 'opponent').opponent).toEqual({
      round: ROUND,
      mode: 'running',
    });
    expect(ringSetups(clock, 'opponent').you.mode).toBe('waiting');
  });

  it('freezes the live ring when the server froze the round', () => {
    const setups = ringSetups({ round: ROUND, isFrozen: true }, 'you');
    expect(setups.you.mode).toBe('frozen');
    expect(setups.opponent.mode).toBe('waiting');
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
