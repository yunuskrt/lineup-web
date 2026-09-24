import { describe, expect, it } from 'vitest';
import type { EngineOutcome } from '@/lib/api/mock/engine';
import {
  isGuessable,
  maskedMatchFor,
  toGuessResult,
} from '@/lib/api/mock/shared';
import {
  SEED_AWAY_CLUB,
  SEED_FORMATION,
  SEED_HOME_CLUB,
} from '@/lib/api/mock/data/seed';

const PLAYER = {
  id: 'pl-01',
  name: 'Emil Vasquez',
  slot: 0,
  position: 'GK' as const,
  imageUrl: null,
};

describe('isGuessable', () => {
  // This guard is what stops `expired` being reported as `not_in_xi`
  it('accepts the three outcomes the contract can express', () => {
    const outcomes: EngineOutcome[] = [
      { kind: 'correct_new', player: PLAYER, foundBy: 'you' },
      { kind: 'already_found', playerId: 'pl-01' },
      { kind: 'not_in_xi' },
    ];

    for (const outcome of outcomes) {
      expect(isGuessable(outcome)).toBe(true);
    }
  });

  it('rejects the outcomes that have no GuessResult', () => {
    const expired: EngineOutcome = {
      kind: 'expired',
      actor: 'you',
      livesRemaining: 2,
    };

    expect(isGuessable(expired)).toBe(false);
    expect(isGuessable({ kind: 'ignored' })).toBe(false);
  });
});

describe('toGuessResult', () => {
  it('maps each guessable outcome onto its contract shape', () => {
    expect(
      toGuessResult({ kind: 'correct_new', player: PLAYER, foundBy: 'you' }),
    ).toEqual({ outcome: 'correct_new', player: PLAYER });

    expect(toGuessResult({ kind: 'already_found', playerId: 'pl-01' })).toEqual(
      {
        outcome: 'already_found',
        playerId: 'pl-01',
      },
    );

    expect(toGuessResult({ kind: 'not_in_xi' })).toEqual({
      outcome: 'not_in_xi',
    });
  });
});

describe('maskedMatchFor', () => {
  it('returns the chosen side and never the other club', () => {
    const home = maskedMatchFor('home');
    expect(home.side).toBe('home');
    expect(home.team).toEqual(SEED_HOME_CLUB);
    expect(home.formation).toBe(SEED_FORMATION);

    const away = maskedMatchFor('away');
    expect(away.side).toBe('away');
    expect(away.team).toEqual(SEED_AWAY_CLUB);
  });

  it('carries no competition, date or score', () => {
    const body = JSON.stringify(maskedMatchFor('home'));

    expect(body).not.toContain('Northern League');
    expect(body).not.toContain('2005-04-16');
    expect(body).not.toContain('Placeholder Derby');
  });
});
