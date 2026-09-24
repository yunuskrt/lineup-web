import { beforeEach, describe, expect, it } from 'vitest';
import type { ApiClient } from '@/lib/api/client';
import { createMockApiClient } from '@/lib/api/mock/api-client';
import { GRACE_WINDOW_MS, ROUND_DURATION_MS } from '@/lib/api/mock/clock';
import { SEED_SQUAD } from '@/lib/api/mock/data/seed';
import type { ApiResult } from '@/types/api';
import type { Filters } from '@/types/filters';

const T0 = 1_700_000_000_000;

const ALL_FILTERS: Filters = {
  competitionIds: [],
  clubIds: [],
  era: { from: 2000, to: 2025 },
};

function unwrap<T>(result: ApiResult<T>): T {
  if (!result.success) {
    throw new Error(`Expected success, got ${result.error.code}`);
  }
  return result.data;
}

function expectError<T>(result: ApiResult<T>): string {
  if (result.success) throw new Error('Expected a failure');
  return result.error.code;
}

describe('mock api client', () => {
  let clock: number;
  let api: ApiClient;

  beforeEach(() => {
    clock = T0;
    api = createMockApiClient({ now: () => clock });
  });

  async function startRun() {
    await api.auth.continueAsGuest();
    const offer = unwrap(await api.solo.findMatch(ALL_FILTERS));
    const session = unwrap(await api.solo.chooseSide(offer.sessionId, 'home'));
    return { sessionId: offer.sessionId, session };
  }

  it('drives a full solo run through the interface', async () => {
    const session = unwrap(await api.auth.continueAsGuest());
    expect(session.user.isGuest).toBe(true);

    const offer = unwrap(await api.solo.findMatch(ALL_FILTERS));
    expect(offer.home.id).not.toBe(offer.away.id);

    const started = unwrap(await api.solo.chooseSide(offer.sessionId, 'home'));
    expect(started.lives).toBe(3);
    expect(started.found).toHaveLength(0);
    expect(started.round).not.toBeNull();

    const correct = unwrap(
      await api.solo.guess({ sessionId: offer.sessionId, guess: 'Ferreira' }),
    );
    expect(correct.result.outcome).toBe('correct_new');
    expect(correct.session.found).toHaveLength(1);
    expect(correct.session.lives).toBe(3);

    clock += 100;
    const repeat = unwrap(
      await api.solo.guess({ sessionId: offer.sessionId, guess: 'Ferreira' }),
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

  it('never returns a player who has not been revealed', async () => {
    const { sessionId } = await startRun();

    const started = unwrap(await api.solo.syncSession(sessionId));
    expect(started.found).toHaveLength(0);
    expect(JSON.stringify(started)).not.toContain('Petrov');

    const guessed = unwrap(
      await api.solo.guess({ sessionId, guess: 'Petrov' }),
    );
    const body = JSON.stringify(guessed);

    expect(guessed.session.found).toHaveLength(1);
    expect(body).toContain('Petrov');

    for (const entry of SEED_SQUAD) {
      if (entry.playerId === 'pl-10') continue;
      expect(body).not.toContain(entry.name);
    }
  });

  it('ends the run when the third life goes, then serves a summary', async () => {
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
    expect(summary.match.id).toBe('match-0001');
  });

  it('records a perfect clear when all eleven are named', async () => {
    const { sessionId } = await startRun();

    for (const entry of SEED_SQUAD) {
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

  it('rejects a guess once the run is over', async () => {
    const { sessionId } = await startRun();
    await api.solo.quit(sessionId);

    const result = await api.solo.guess({ sessionId, guess: 'Petrov' });
    expect(expectError(result)).toBe('session_over');
  });

  it('surfaces each failure branch the screens render', async () => {
    expect(expectError(await api.solo.findMatch(ALL_FILTERS))).toBe(
      'unauthorized',
    );

    await api.auth.continueAsGuest();

    expect(
      expectError(
        await api.solo.findMatch({
          ...ALL_FILTERS,
          competitionIds: ['comp-nowhere'],
        }),
      ),
    ).toBe('empty_pool');

    expect(
      expectError(
        await api.solo.findMatch({
          ...ALL_FILTERS,
          era: { from: 2019, to: 2020 },
        }),
      ),
    ).toBe('empty_pool');

    expect(expectError(await api.solo.syncSession('session-nope'))).toBe(
      'not_found',
    );

    const { sessionId } = await startRun();
    expect(expectError(await api.solo.guess({ sessionId, guess: '   ' }))).toBe(
      'invalid_input',
    );
  });

  it('rate limits a burst of guesses with a real retry delay', async () => {
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
    expect(unwrap(await api.profile.getProfile()).stats.played).toBe(1);
  });

  it('pages history with a cursor', async () => {
    await api.auth.continueAsGuest();

    for (let i = 0; i < 3; i += 1) {
      const offer = unwrap(await api.solo.findMatch(ALL_FILTERS));
      await api.solo.chooseSide(offer.sessionId, 'home');
      await api.solo.quit(offer.sessionId);
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

  it('offers filter options drawn from the seed', async () => {
    const options = unwrap(await api.catalog.getFilterOptions());

    expect(options.competitions).toHaveLength(1);
    expect(options.clubs).toHaveLength(2);
    expect(options.era.from).toBe(2004);
    expect(JSON.stringify(options)).not.toContain('memorability');
  });
});
