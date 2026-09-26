import { beforeEach, describe, expect, it } from 'vitest';
import type { ApiClient } from '@/lib/api/client';
import { createMockApiClient } from '@/lib/api/mock/api-client';
import { GRACE_WINDOW_MS, ROUND_DURATION_MS } from '@/lib/api/mock/clock';
import {
  FIXTURES,
  requireFixture,
  squadFor,
} from '@/lib/api/mock/data/fixtures';
import { EMPTY_POOL_MESSAGES } from '@/lib/api/mock/shared';
import type { ApiResult } from '@/types/api';
import type { Filters } from '@/types/filters';
import type { Side } from '@/types/match';

const T0 = 1_700_000_000_000;

const ALL_FILTERS: Filters = {
  competitionIds: [],
  clubIds: [],
  era: { from: 2000, to: 2025 },
};

// Northgate v Riverton, drawn when random() is 0
const CROWN_2003 = 'match-crown-2003';

function unwrap<T>(result: ApiResult<T>): T {
  if (!result.success) {
    throw new Error(`Expected success, got ${result.error.code}`);
  }
  return result.data;
}

function errorOf<T>(result: ApiResult<T>) {
  if (result.success) throw new Error('Expected a failure');
  return result.error;
}

// The draw that hits a fixture with no filter set
function drawFor(fixtureId: string): number {
  const index = FIXTURES.findIndex((f) => f.identity.id === fixtureId);
  if (index < 0) throw new Error(`Unknown fixture ${fixtureId}`);
  return (index + 0.5) / FIXTURES.length;
}

describe('mock api client', () => {
  let clock: number;
  let draw: number;
  let api: ApiClient;

  beforeEach(() => {
    clock = T0;
    draw = 0;
    api = createMockApiClient({ now: () => clock, random: () => draw });
  });

  async function startRun(side: Side = 'home', filters = ALL_FILTERS) {
    const offer = unwrap(await api.solo.findMatch(filters));
    const session = unwrap(await api.solo.chooseSide(offer.sessionId, side));
    return { sessionId: offer.sessionId, offer, session };
  }

  it('drives a full solo run through the interface', async () => {
    const session = unwrap(await api.auth.continueAsGuest());
    expect(session.user.isGuest).toBe(true);

    const offer = unwrap(await api.solo.findMatch(ALL_FILTERS));
    expect(offer.home.id).toBe('club-northgate');
    expect(offer.away.id).toBe('club-riverton');

    const started = unwrap(await api.solo.chooseSide(offer.sessionId, 'home'));
    expect(started.lives).toBe(3);
    expect(started.found).toHaveLength(0);
    expect(started.round).not.toBeNull();
    expect(started.match.id).toBe(CROWN_2003);

    const correct = unwrap(
      await api.solo.guess({ sessionId: offer.sessionId, guess: 'Moss' }),
    );
    expect(correct.result.outcome).toBe('correct_new');
    expect(correct.session.found).toHaveLength(1);
    expect(correct.session.lives).toBe(3);

    clock += 100;
    const repeat = unwrap(
      await api.solo.guess({ sessionId: offer.sessionId, guess: 'Moss' }),
    );
    expect(repeat.result.outcome).toBe('already_found');
    expect(repeat.session.lives).toBe(3);

    clock += 100;
    const wrong = unwrap(
      await api.solo.guess({ sessionId: offer.sessionId, guess: 'Zidane' }),
    );
    expect(wrong.result.outcome).toBe('not_in_xi');
    expect(wrong.session.lives).toBe(3);

    clock += ROUND_DURATION_MS + GRACE_WINDOW_MS + 1;
    const afterExpiry = unwrap(await api.solo.syncSession(offer.sessionId));
    expect(afterExpiry.lives).toBe(2);
    expect(afterExpiry.status).toBe('active');
  });

  it('never returns an unrevealed player, on any fixture or side', async () => {
    for (const fixture of FIXTURES) {
      for (const side of ['home', 'away'] as const) {
        draw = drawFor(fixture.identity.id);
        api = createMockApiClient({ now: () => clock, random: () => draw });
        await api.auth.continueAsGuest();

        const squad = squadFor(fixture, side);
        const { sessionId, session } = await startRun(side);
        const startBody = JSON.stringify(session);

        for (const entry of squad) {
          expect(startBody).not.toContain(entry.name);
        }

        const [named, ...hidden] = squad;
        const guessed = unwrap(
          await api.solo.guess({ sessionId, guess: named.name }),
        );
        const body = JSON.stringify(guessed);

        expect(guessed.session.found).toHaveLength(1);
        expect(body).toContain(named.name);
        for (const entry of hidden) {
          expect(body).not.toContain(entry.name);
        }
      }
    }
  });

  it('ends the run when the third life goes, then serves a summary', async () => {
    await api.auth.continueAsGuest();
    const { sessionId } = await startRun();

    for (let i = 0; i < 3; i += 1) {
      clock += ROUND_DURATION_MS + GRACE_WINDOW_MS + 1;
      await api.solo.syncSession(sessionId);
    }

    const finished = unwrap(await api.solo.syncSession(sessionId));
    expect(finished.lives).toBe(0);
    expect(finished.status).toBe('over');
    expect(finished.round).toBeNull();

    const summary = unwrap(await api.solo.getSummary(sessionId));
    expect(summary.endReason).toBe('lives_out');
    expect(summary.missedCount).toBe(11);
    expect(summary.missed).toBeNull();
    expect(summary.match).toEqual(requireFixture(CROWN_2003).identity);
  });

  it('records a perfect clear when all eleven are named', async () => {
    await api.auth.continueAsGuest();
    const { sessionId } = await startRun();

    for (const entry of squadFor(requireFixture(CROWN_2003), 'home')) {
      clock += 10;
      await api.solo.guess({ sessionId, guess: entry.name });
    }

    const summary = unwrap(await api.solo.getSummary(sessionId));
    expect(summary.endReason).toBe('perfect_clear');
    expect(summary.found).toHaveLength(11);
    expect(summary.missedCount).toBe(0);
    expect(summary.livesRemaining).toBe(3);

    const profile = unwrap(await api.profile.getProfile());
    expect(profile.stats.played).toBe(1);
    expect(profile.stats.perfectClears).toBe(1);
    expect(profile.stats.bestStreak).toBe(11);
  });

  it('plays the away XI when away is chosen', async () => {
    await api.auth.continueAsGuest();
    const { sessionId, session } = await startRun('away');

    expect(session.match.side).toBe('away');
    expect(session.match.team.id).toBe('club-riverton');

    const homeName = unwrap(
      await api.solo.guess({ sessionId, guess: 'Kieran Moss' }),
    );
    expect(homeName.result.outcome).toBe('not_in_xi');

    const awayName = unwrap(await api.solo.guess({ sessionId, guess: 'Ravn' }));
    expect(awayName.result.outcome).toBe('correct_new');
  });

  it('honours each filter it is given', async () => {
    await api.auth.continueAsGuest();
    draw = 0.99;

    const cases: { filters: Filters; accepts: (id: string) => boolean }[] = [
      {
        filters: { ...ALL_FILTERS, competitionIds: ['comp-nations-cup'] },
        accepts: (id) =>
          requireFixture(id).identity.competition.id === 'comp-nations-cup',
      },
      {
        filters: { ...ALL_FILTERS, clubIds: ['club-yildirimspor'] },
        accepts: (id) => id === 'match-federation-2012-final',
      },
      {
        filters: { ...ALL_FILTERS, era: { from: 2002, to: 2004 } },
        accepts: (id) =>
          ['match-crown-2003', 'match-continental-2005-final'].includes(id),
      },
    ];

    for (const { filters, accepts } of cases) {
      const { sessionId } = await startRun('home', filters);
      const summary = unwrap(await api.solo.quit(sessionId));
      expect(accepts(summary.match.id)).toBe(true);
    }
  });

  it('names the filter to widen when the pool is empty', async () => {
    await api.auth.continueAsGuest();

    const cases: { filters: Filters; message: string }[] = [
      {
        filters: { ...ALL_FILTERS, competitionIds: ['comp-nowhere'] },
        message: EMPTY_POOL_MESSAGES.competition,
      },
      {
        filters: {
          competitionIds: ['comp-crown-league'],
          clubIds: ['club-yildirimspor'],
          era: { from: 2000, to: 2003 },
        },
        message: EMPTY_POOL_MESSAGES.club,
      },
      {
        filters: { ...ALL_FILTERS, era: { from: 2019, to: 2020 } },
        message: EMPTY_POOL_MESSAGES.era,
      },
      {
        filters: {
          competitionIds: ['comp-crown-league'],
          clubIds: ['club-yildirimspor'],
          era: { from: 2020, to: 2025 },
        },
        message: EMPTY_POOL_MESSAGES.combination,
      },
    ];

    for (const { filters, message } of cases) {
      const error = errorOf(await api.solo.findMatch(filters));
      expect(error.code).toBe('empty_pool');
      expect(error.message).toBe(message);
    }
  });

  it('records each run against its own match and follows the favourite club', async () => {
    await api.auth.continueAsGuest();

    const play = async (fixtureId: string, side: Side) => {
      draw = drawFor(fixtureId);
      const { sessionId } = await startRun(side);
      await api.solo.quit(sessionId);
      return unwrap(await api.profile.getProfile()).stats.favouriteClub?.id;
    };

    expect(await play(CROWN_2003, 'home')).toBe('club-northgate');
    // A tie goes to the club played most recently
    expect(await play(CROWN_2003, 'away')).toBe('club-riverton');
    expect(await play('match-continental-2005-final', 'away')).toBe(
      'club-northgate',
    );

    const history = unwrap(
      await api.profile.getHistory({ cursor: null, limit: 20 }),
    );
    expect(history.entries.map((entry) => entry.match.id)).toEqual([
      'match-continental-2005-final',
      CROWN_2003,
      CROWN_2003,
    ]);
  });

  it('rejects a guess once the run is over', async () => {
    await api.auth.continueAsGuest();
    const { sessionId } = await startRun();
    await api.solo.quit(sessionId);

    const result = await api.solo.guess({ sessionId, guess: 'Moss' });
    expect(errorOf(result).code).toBe('session_over');
  });

  it('surfaces each failure branch the screens render', async () => {
    expect(errorOf(await api.solo.findMatch(ALL_FILTERS)).code).toBe(
      'unauthorized',
    );

    await api.auth.continueAsGuest();

    expect(errorOf(await api.solo.syncSession('session-nope')).code).toBe(
      'not_found',
    );

    const { sessionId } = await startRun();
    expect(
      errorOf(await api.solo.guess({ sessionId, guess: '   ' })).code,
    ).toBe('invalid_input');
  });

  it('rate limits a burst of guesses with a real retry delay', async () => {
    await api.auth.continueAsGuest();
    const { sessionId } = await startRun();

    let limited: ApiResult<unknown> | null = null;
    for (let i = 0; i < 20; i += 1) {
      const result = await api.solo.guess({ sessionId, guess: `nobody ${i}` });
      if (!result.success) {
        limited = result;
        break;
      }
    }

    expect(limited).not.toBeNull();
    if (limited && !limited.success) {
      expect(limited.error.code).toBe('rate_limited');
      expect(limited.error.retryAfterMs).toBeGreaterThan(0);
    }
  });

  it('keeps history and stats when a guest upgrades', async () => {
    await api.auth.continueAsGuest();
    const { sessionId } = await startRun();
    await api.solo.quit(sessionId);

    const before = unwrap(await api.profile.getProfile());
    const historyBefore = unwrap(
      await api.profile.getHistory({ cursor: null, limit: 20 }),
    );
    expect(before.user.isGuest).toBe(true);
    expect(historyBefore.entries).toHaveLength(1);

    const upgraded = unwrap(
      await api.auth.upgradeGuest({
        email: 'player@example.com',
        password: 'a-good-password',
        handle: 'keeper',
      }),
    );

    expect(upgraded.user.isGuest).toBe(false);
    expect(upgraded.user.handle).toBe('keeper');
    expect(upgraded.user.id).toBe(before.user.id);

    const after = unwrap(
      await api.profile.getHistory({ cursor: null, limit: 20 }),
    );
    expect(after.entries).toEqual(historyBefore.entries);

    const stats = unwrap(await api.profile.getProfile()).stats;
    expect(stats.played).toBe(1);
    expect(stats.favouriteClub?.id).toBe('club-northgate');
  });

  it('pages history with a cursor', async () => {
    await api.auth.continueAsGuest();

    for (let i = 0; i < 3; i += 1) {
      const { sessionId } = await startRun();
      await api.solo.quit(sessionId);
    }

    const first = unwrap(
      await api.profile.getHistory({ cursor: null, limit: 2 }),
    );
    expect(first.entries).toHaveLength(2);
    expect(first.nextCursor).not.toBeNull();

    const second = unwrap(
      await api.profile.getHistory({ cursor: first.nextCursor, limit: 2 }),
    );
    expect(second.entries).toHaveLength(1);
    expect(second.nextCursor).toBeNull();
  });

  it('offers filter options drawn from the fixtures', async () => {
    const options = unwrap(await api.catalog.getFilterOptions());

    expect(options.competitions).toHaveLength(6);
    expect(options.clubs).toHaveLength(11);
    expect(options.era).toEqual({ from: 2002, to: 2023 });
    expect(JSON.stringify(options)).not.toContain('memorability');
  });
});
