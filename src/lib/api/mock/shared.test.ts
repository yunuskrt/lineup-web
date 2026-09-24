import { describe, expect, it } from 'vitest';
import type { EngineOutcome } from '@/lib/api/mock/engine';
import {
  EMPTY_POOL_MESSAGES,
  isGuessable,
  maskedMatchFor,
  toGuessResult,
} from '@/lib/api/mock/shared';
import { FIXTURES, requireFixture } from '@/lib/api/mock/data/fixtures';

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
  // Formations differ by side, so a swap would show
  const fixture = requireFixture('match-crown-2015');

  it('returns the chosen side and never the other club', () => {
    const home = maskedMatchFor(fixture, 'home');
    expect(home.id).toBe(fixture.identity.id);
    expect(home.side).toBe('home');
    expect(home.team).toEqual(fixture.identity.home);
    expect(home.formation).toBe('4-2-3-1');

    const away = maskedMatchFor(fixture, 'away');
    expect(away.side).toBe('away');
    expect(away.team).toEqual(fixture.identity.away);
    expect(away.formation).toBe('3-4-3');
  });

  it('carries no competition, date, score or nickname', () => {
    for (const each of FIXTURES) {
      for (const side of ['home', 'away'] as const) {
        const body = JSON.stringify(maskedMatchFor(each, side));
        const other = each.identity[side === 'home' ? 'away' : 'home'];

        expect(body).not.toContain(each.identity.competition.name);
        expect(body).not.toContain(each.identity.date);
        expect(body).not.toContain(other.id);
        if (each.identity.nickname) {
          expect(body).not.toContain(each.identity.nickname);
        }
      }
    }
  });
});

describe('EMPTY_POOL_MESSAGES', () => {
  it('gives every reason its own message naming what to widen', () => {
    const messages = Object.values(EMPTY_POOL_MESSAGES);
    expect(new Set(messages).size).toBe(4);
    expect(EMPTY_POOL_MESSAGES.competition).toMatch(/competition/);
    expect(EMPTY_POOL_MESSAGES.club).toMatch(/club/);
    expect(EMPTY_POOL_MESSAGES.era).toMatch(/era/);
  });
});
