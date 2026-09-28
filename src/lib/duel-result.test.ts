import { describe, expect, it } from 'vitest';
import {
  SAMPLE_IDENTITY,
  SAMPLE_OPPONENT,
  SAMPLE_YOU,
} from '@/lib/dev/samples';
import {
  duelResultDetail,
  duelResultTitle,
  foundTally,
} from '@/lib/duel-result';
import type { DuelFoundPlayer, DuelResult } from '@/types/duel';

function player(slot: number, foundBy: DuelFoundPlayer['foundBy']) {
  return {
    id: `p-${slot}`,
    name: `Player ${slot}`,
    slot,
    position: 'MF',
    imageUrl: null,
    foundBy,
  } satisfies DuelFoundPlayer;
}

function result(overrides: Partial<DuelResult> = {}): DuelResult {
  return {
    outcome: 'win',
    match: SAMPLE_IDENTITY,
    found: [],
    you: SAMPLE_YOU,
    opponent: SAMPLE_OPPONENT,
    isForfeit: false,
    ...overrides,
  };
}

const HANDLE = SAMPLE_OPPONENT.handle;

describe('duelResultTitle', () => {
  it.each([
    ['win', false, 'You won'],
    ['loss', false, 'You lost'],
    ['draw', false, 'Draw'],
    ['forfeit_win', true, 'Opponent left'],
    ['loss', true, 'You left'],
  ] as const)('reads %s (forfeit %s) as "%s"', (outcome, isForfeit, title) => {
    expect(duelResultTitle(result({ outcome, isForfeit }))).toBe(title);
  });
});

describe('duelResultDetail', () => {
  it('names the opponent who ran out', () => {
    expect(duelResultDetail(result())).toBe(`${HANDLE} ran out of lives.`);
  });

  it('owns your own loss', () => {
    expect(duelResultDetail(result({ outcome: 'loss' }))).toBe(
      'You ran out of lives.',
    );
  });

  it('never ranks a draw by lives', () => {
    const detail = duelResultDetail(result({ outcome: 'draw' }));
    expect(detail).toBe('All eleven named. Neither side lost.');
    expect(detail).not.toMatch(/li(fe|ves)/);
  });

  it('says who left on either forfeit', () => {
    expect(
      duelResultDetail(result({ outcome: 'forfeit_win', isForfeit: true })),
    ).toBe(`${HANDLE} left the duel.`);
    expect(duelResultDetail(result({ outcome: 'loss', isForfeit: true }))).toBe(
      'You left the duel.',
    );
  });
});

describe('foundTally', () => {
  it('counts each finder', () => {
    const found = [
      player(0, 'you'),
      player(1, 'opponent'),
      player(2, 'you'),
      player(3, 'you'),
    ];
    expect(foundTally(found)).toEqual({ you: 3, opponent: 1 });
  });

  it('is zero each with nothing found', () => {
    expect(foundTally([])).toEqual({ you: 0, opponent: 0 });
  });
});
