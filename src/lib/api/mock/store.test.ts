import { describe, expect, it } from 'vitest';
import {
  createIdentity,
  favouriteClubOf,
  recordGame,
  type GameRecord,
} from '@/lib/api/mock/store';
import type { DuelOutcome, SoloEndReason } from '@/types/game';
import type { ClubRef, MatchIdentity } from '@/types/match';
import type { User } from '@/types/user';

function club(id: string): ClubRef {
  return { id, name: id, shortName: id.slice(0, 3), crestUrl: null };
}

const NORTH = club('north');
const SOUTH = club('south');
const EAST = club('east');

describe('favouriteClubOf', () => {
  it('has no favourite before any run', () => {
    expect(favouriteClubOf([])).toBeNull();
  });

  it('picks the most-played club even when another was played last', () => {
    expect(favouriteClubOf([NORTH, NORTH, SOUTH])).toEqual(NORTH);
  });

  it('breaks a tie in favour of the most recent club', () => {
    expect(favouriteClubOf([NORTH, SOUTH])).toEqual(SOUTH);
    expect(favouriteClubOf([NORTH, SOUTH, EAST, SOUTH, NORTH])).toEqual(NORTH);
  });
});

const USER: User = {
  id: 'guest-1',
  handle: 'Guest 1',
  isGuest: true,
  tier: 'free',
};

const MATCH: MatchIdentity = {
  id: 'match-1',
  competition: { id: 'comp-1', kind: 'league', name: 'Crown League' },
  season: '2003-04',
  date: '2003-10-04',
  stage: null,
  home: NORTH,
  away: SOUTH,
  score: { home: 1, away: 0 },
  nickname: null,
};

let sequence = 0;

function game(
  result:
    | { mode: 'solo'; outcome: SoloEndReason }
    | { mode: 'duel'; outcome: DuelOutcome },
  overrides: Partial<Omit<GameRecord, 'entry'>> = {},
): GameRecord {
  sequence += 1;
  return {
    entry: {
      ...result,
      id: `history-${sequence}`,
      playedAt: '2026-01-01T00:00:00.000Z',
      match: MATCH,
      foundCount: 4,
      livesRemaining: 1,
    },
    club: NORTH,
    guesses: 0,
    hits: 0,
    bestStreak: 0,
    ...overrides,
  };
}

describe('recordGame', () => {
  it('puts the newest game first', () => {
    const identity = createIdentity(USER);
    const first = game({ mode: 'solo', outcome: 'quit' });
    const second = game({ mode: 'duel', outcome: 'win' });

    recordGame(identity, first);
    recordGame(identity, second);

    expect(identity.history).toEqual([second.entry, first.entry]);
    expect(identity.stats.played).toBe(2);
  });

  it.each<[DuelOutcome, 'wins' | 'losses' | 'draws']>([
    ['win', 'wins'],
    ['forfeit_win', 'wins'],
    ['loss', 'losses'],
    ['draw', 'draws'],
  ])('counts a duel %s under %s', (outcome, counter) => {
    const identity = createIdentity(USER);
    recordGame(identity, game({ mode: 'duel', outcome }));

    const { wins, losses, draws } = identity.stats;
    expect({ wins, losses, draws }).toEqual({
      wins: 0,
      losses: 0,
      draws: 0,
      [counter]: 1,
    });
    expect(identity.stats.perfectClears).toBe(0);
  });

  it('counts a perfect clear, and no solo run as a duel', () => {
    const identity = createIdentity(USER);
    recordGame(identity, game({ mode: 'solo', outcome: 'perfect_clear' }));
    recordGame(identity, game({ mode: 'solo', outcome: 'lives_out' }));

    const { wins, losses, draws, perfectClears, played } = identity.stats;
    expect({ wins, losses, draws, perfectClears, played }).toEqual({
      wins: 0,
      losses: 0,
      draws: 0,
      perfectClears: 1,
      played: 2,
    });
  });

  it('keeps accuracy over every game, not just the last', () => {
    const identity = createIdentity(USER);
    recordGame(
      identity,
      game({ mode: 'solo', outcome: 'quit' }, { guesses: 4, hits: 3 }),
    );
    recordGame(
      identity,
      game({ mode: 'duel', outcome: 'loss' }, { guesses: 4, hits: 1 }),
    );

    expect(identity.stats.accuracy).toBe(0.5);
  });

  it('reads 0 accuracy while no guess has been made', () => {
    const identity = createIdentity(USER);
    recordGame(identity, game({ mode: 'solo', outcome: 'quit' }));

    expect(identity.stats.accuracy).toBe(0);
  });

  it('keeps the best streak and follows the favourite club', () => {
    const identity = createIdentity(USER);
    recordGame(
      identity,
      game({ mode: 'solo', outcome: 'quit' }, { bestStreak: 5, club: SOUTH }),
    );
    recordGame(
      identity,
      game({ mode: 'duel', outcome: 'win' }, { bestStreak: 0, club: SOUTH }),
    );
    recordGame(
      identity,
      game({ mode: 'solo', outcome: 'quit' }, { bestStreak: 2, club: null }),
    );

    expect(identity.stats.bestStreak).toBe(5);
    expect(identity.stats.favouriteClub).toEqual(SOUTH);
    expect(identity.playedAs).toEqual([SOUTH, SOUTH]);
  });
});
