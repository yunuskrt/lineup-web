import { describe, expect, it } from 'vitest';
import type { EngineOutcome } from '@/lib/api/mock/engine';
import {
  EMPTY_POOL_MESSAGES,
  emptyPool,
  isGuessable,
  matchInPlayFor,
  toGuessResult,
} from '@/lib/api/mock/shared';
import { FIXTURES, requireFixture } from '@/lib/api/mock/data/fixtures';
import { matchInPlaySchema } from '@/lib/api/schemas/match';
import { apiErrorSchema } from '@/lib/api/schemas/result';

const PLAYER = {
  id: 'pl-01',
  name: 'Emil Vasquez',
  slot: 0,
  position: 'GK' as const,
  imageUrl: null,
};

describe('isGuessable', () => {
  // This guard stops `expired` reading as `not_in_xi`
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

describe('matchInPlayFor', () => {
  // Formations differ by side, so a swap would show
  const fixture = requireFixture('match-crown-2015');

  it('carries the whole match with the chosen side', () => {
    const home = matchInPlayFor(fixture, 'home');
    expect(matchInPlaySchema.parse(home)).toEqual({
      ...fixture.identity,
      side: 'home',
      formation: '4-2-3-1',
    });

    const away = matchInPlayFor(fixture, 'away');
    expect(away.side).toBe('away');
    expect(away.formation).toBe('3-4-3');
  });

  // The squad is never sent ahead of play
  it('carries no player from either XI', () => {
    for (const each of FIXTURES) {
      for (const side of ['home', 'away'] as const) {
        const body = JSON.stringify(matchInPlayFor(each, side));
        for (const entry of [...each.home.squad, ...each.away.squad]) {
          expect(body).not.toContain(entry.playerId);
          expect(body).not.toContain(entry.name);
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

describe('emptyPool', () => {
  it('names the reason beside its message, in the contract shape', () => {
    for (const reason of [
      'competition',
      'club',
      'era',
      'combination',
    ] as const) {
      const result = emptyPool(reason);
      if (result.success) throw new Error('Expected a refusal');
      expect(apiErrorSchema.parse(result.error)).toEqual({
        code: 'empty_pool',
        message: EMPTY_POOL_MESSAGES[reason],
        retryAfterMs: null,
        emptyBecause: reason,
      });
    }
  });

  it('accepts a refused protocol as its own code', () => {
    expect(
      apiErrorSchema.safeParse({
        code: 'protocol_refused',
        message: 'Out of date.',
        retryAfterMs: null,
      }).success,
    ).toBe(true);
  });

  it('keeps the reason optional and closed in the contract', () => {
    const base = { code: 'empty_pool', message: 'None.', retryAfterMs: null };
    expect(apiErrorSchema.safeParse(base).success).toBe(true);
    expect(
      apiErrorSchema.safeParse({ ...base, emptyBecause: 'weather' }).success,
    ).toBe(false);
  });
});
