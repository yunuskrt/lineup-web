import { describe, expect, it } from 'vitest';
import {
  accuracyStat,
  duelCountLabel,
  duelRecord,
  favouriteClubStat,
  historyOutcomeLabel,
  historyTone,
  playedAtLabel,
  profileScreenView,
  recordShares,
  soloRunCount,
} from '@/lib/profile';
import { ApiRequestError } from '@/lib/api/unwrap';
import { AUTH_ERROR_MESSAGES } from '@/lib/auth';
import { SAMPLE_IDENTITY } from '@/lib/dev/samples';
import type { DuelOutcome, SoloEndReason } from '@/types/game';
import type { HistoryEntry, Profile, UserStats } from '@/types/profile';
import type { ProfileScreenInput } from '@/types/profile-screen';

const STATS: UserStats = {
  played: 34,
  wins: 14,
  losses: 6,
  draws: 2,
  accuracy: 0.64,
  bestStreak: 7,
  perfectClears: 1,
  favouriteClub: SAMPLE_IDENTITY.home,
};

const NO_GAMES: UserStats = {
  ...STATS,
  played: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  accuracy: 0,
  favouriteClub: null,
};

const BASE = {
  id: 'history-1',
  playedAt: '2026-09-29T12:00:00.000Z',
  match: SAMPLE_IDENTITY,
  foundCount: 6,
  livesRemaining: 2,
} as const;

function solo(outcome: SoloEndReason): HistoryEntry {
  return { ...BASE, mode: 'solo', outcome };
}

function duel(outcome: DuelOutcome): HistoryEntry {
  return { ...BASE, mode: 'duel', outcome };
}

// Local wall-clock times, so the viewer's zone is the test's
function local(year: number, month: number, day: number, hour = 12) {
  return new Date(year, month - 1, day, hour);
}

describe('duelRecord', () => {
  it('totals wins, draws and losses', () => {
    expect(duelRecord(STATS)).toEqual({
      wins: 14,
      draws: 2,
      losses: 6,
      total: 22,
    });
  });
});

describe('recordShares', () => {
  it('splits the record into fractions that sum to 1', () => {
    const shares = recordShares(STATS);
    expect(shares.wins).toBeCloseTo(14 / 22);
    expect(shares.draws).toBeCloseTo(2 / 22);
    expect(shares.losses).toBeCloseTo(6 / 22);
    expect(shares.wins + shares.draws + shares.losses).toBeCloseTo(1);
  });

  it('is all zero with no duels', () => {
    expect(recordShares(NO_GAMES)).toEqual({ wins: 0, draws: 0, losses: 0 });
  });

  it('gives the whole bar to draws when every duel was drawn', () => {
    expect(recordShares({ ...NO_GAMES, played: 3, draws: 3 })).toEqual({
      wins: 0,
      draws: 1,
      losses: 0,
    });
  });
});

describe('duelCountLabel', () => {
  it.each([
    [0, 'No duels yet'],
    [1, '1 duel'],
    [22, '22 duels'],
  ])('reads %i as %s', (total, label) => {
    expect(duelCountLabel(total)).toBe(label);
  });
});

describe('soloRunCount', () => {
  it('is played minus duels', () => {
    expect(soloRunCount(STATS)).toBe(12);
  });

  it('never goes below zero', () => {
    expect(soloRunCount({ ...STATS, played: 3 })).toBe(0);
  });
});

describe('historyOutcomeLabel', () => {
  it.each<[HistoryEntry, string]>([
    [solo('perfect_clear'), 'Perfect clear'],
    [solo('lives_out'), 'Run over'],
    [solo('quit'), 'Run ended'],
    [duel('win'), 'Win'],
    [duel('loss'), 'Loss'],
    [duel('draw'), 'Draw'],
    [duel('forfeit_win'), 'Forfeit win'],
  ])('labels %o', (entry, label) => {
    expect(historyOutcomeLabel(entry)).toBe(label);
  });
});

describe('historyTone', () => {
  it.each<[HistoryEntry, string]>([
    [solo('perfect_clear'), 'clear'],
    [solo('lives_out'), 'neutral'],
    [solo('quit'), 'neutral'],
    [duel('win'), 'win'],
    [duel('forfeit_win'), 'win'],
    [duel('loss'), 'loss'],
    [duel('draw'), 'draw'],
  ])('tones %o', (entry, tone) => {
    expect(historyTone(entry)).toBe(tone);
  });
});

describe('playedAtLabel', () => {
  const now = local(2026, 9, 29, 9);

  it('reads the same calendar day as Today', () => {
    expect(playedAtLabel(local(2026, 9, 29, 0).toISOString(), now)).toBe(
      'Today',
    );
  });

  it('reads the day before as Yesterday, even late at night', () => {
    expect(playedAtLabel(local(2026, 9, 28, 23).toISOString(), now)).toBe(
      'Yesterday',
    );
  });

  it('reads an older date this year without the year', () => {
    expect(playedAtLabel(local(2026, 9, 12).toISOString(), now)).toBe('12 Sep');
  });

  it('adds the year for an earlier year', () => {
    expect(playedAtLabel(local(2025, 12, 14).toISOString(), now)).toBe(
      '14 Dec 2025',
    );
  });

  it('reads a timestamp slightly ahead of the clock as Today', () => {
    expect(playedAtLabel(local(2026, 9, 29, 10).toISOString(), now)).toBe(
      'Today',
    );
  });

  it("reads 31 December as Yesterday on New Year's Day", () => {
    const newYear = local(2026, 1, 1, 9);
    expect(playedAtLabel(local(2025, 12, 31, 20).toISOString(), newYear)).toBe(
      'Yesterday',
    );
  });

  it('adds the year two days back across New Year', () => {
    const newYear = local(2026, 1, 1, 9);
    expect(playedAtLabel(local(2025, 12, 30).toISOString(), newYear)).toBe(
      '30 Dec 2025',
    );
  });

  it('counts calendar days across a clock change', () => {
    // Late October holds a DST end in many zones
    const after = local(2026, 10, 27, 9);
    expect(playedAtLabel(local(2026, 10, 24, 12).toISOString(), after)).toBe(
      '24 Oct',
    );
    expect(playedAtLabel(local(2026, 10, 26, 0).toISOString(), after)).toBe(
      'Yesterday',
    );
  });
});

describe('accuracyStat', () => {
  it('reads a dash before any game', () => {
    expect(accuracyStat(NO_GAMES)).toBe('—');
  });

  it('reads a whole percentage', () => {
    expect(accuracyStat(STATS)).toBe('64%');
  });
});

describe('favouriteClubStat', () => {
  it('names the club', () => {
    expect(favouriteClubStat(STATS)).toBe('Northgate United');
  });

  it('reads None yet without one', () => {
    expect(favouriteClubStat(NO_GAMES)).toBe('None yet');
  });
});

describe('profileScreenView', () => {
  const user = {
    id: 'guest-1',
    handle: 'Guest 1',
    isGuest: true,
    tier: 'free',
  } as const;
  const profile: Profile = { user, stats: STATS };
  const networkError = new ApiRequestError({
    code: 'network',
    message: 'fetch failed',
    retryAfterMs: null,
  });
  const idle = { data: undefined, error: null, isPending: false };
  const pending = { data: undefined, error: null, isPending: true };

  function input(
    overrides: Partial<ProfileScreenInput> = {},
  ): ProfileScreenInput {
    return {
      session: { ...idle, data: { user } },
      profile: { ...idle, data: profile },
      history: {
        ...idle,
        data: [
          { entries: [solo('quit')], nextCursor: 'history-2' },
          { entries: [duel('win')], nextCursor: null },
        ],
        hasNextPage: false,
        isFetchingNextPage: false,
        isFetchNextPageError: false,
      },
      ...overrides,
    };
  }

  function history(overrides: Partial<ProfileScreenInput['history']>) {
    return { ...input().history, ...overrides };
  }

  it('loads while the session is pending, without a guest strip', () => {
    expect(profileScreenView(input({ session: pending }))).toEqual({
      status: 'loading',
      isGuest: false,
    });
  });

  it('is signed out with no session, even while queries are disabled', () => {
    const view = profileScreenView(
      input({
        session: { ...idle, data: null },
        profile: pending,
        history: history(pending),
      }),
    );
    expect(view).toEqual({ status: 'signedOut' });
  });

  it('loads with the guest strip while the first pages are pending', () => {
    expect(profileScreenView(input({ profile: pending }))).toEqual({
      status: 'loading',
      isGuest: true,
    });
    expect(profileScreenView(input({ history: history(pending) }))).toEqual({
      status: 'loading',
      isGuest: true,
    });
  });

  it('shows an error when the profile or first page fails', () => {
    const expected = { status: 'error', message: AUTH_ERROR_MESSAGES.network };

    expect(
      profileScreenView(input({ profile: { ...idle, error: networkError } })),
    ).toEqual(expected);
    expect(
      profileScreenView(
        input({ history: history({ data: undefined, error: networkError }) }),
      ),
    ).toEqual(expected);
    expect(
      profileScreenView(input({ session: { ...idle, error: networkError } })),
    ).toEqual(expected);
  });

  it('keeps the page when a background refetch fails', () => {
    const view = profileScreenView(
      input({ profile: { ...idle, data: profile, error: networkError } }),
    );
    expect(view.status).toBe('ready');
  });

  it('takes the user from the session, not a stale cached profile', () => {
    const upgraded = { ...user, handle: 'keeper', isGuest: false };
    const view = profileScreenView(
      input({ session: { ...idle, data: { user: upgraded } } }),
    );
    if (view.status !== 'ready') throw new Error('Expected ready');
    expect(view.profile.user).toEqual(upgraded);
    expect(view.profile.stats).toBe(STATS);
  });

  it('flattens the pages, newest first', () => {
    const view = profileScreenView(input());
    if (view.status !== 'ready') throw new Error('Expected ready');
    expect(view.history.map((entry) => entry.mode)).toEqual(['solo', 'duel']);
    expect(view.more).toBe('end');
  });

  it.each<[Partial<ProfileScreenInput['history']>, string]>([
    [{ hasNextPage: true }, 'idle'],
    [{ hasNextPage: true, isFetchingNextPage: true }, 'loading'],
    [
      { hasNextPage: true, isFetchNextPageError: true, error: networkError },
      'failed',
    ],
    [{ hasNextPage: false }, 'end'],
  ])('maps %o to more: %s', (overrides, more) => {
    const view = profileScreenView(input({ history: history(overrides) }));
    if (view.status !== 'ready') throw new Error('Expected ready');
    expect(view.more).toBe(more);
  });
});
