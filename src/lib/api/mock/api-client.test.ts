import { beforeEach, describe, expect, it } from 'vitest';
import type { ApiClient } from '@/lib/api/client';
import {
  createMockApiClient,
  MOCK_REJECTED_PASSWORD,
} from '@/lib/api/mock/api-client';
import { GRACE_WINDOW_MS, ROUND_DURATION_MS } from '@/lib/api/mock/clock';
import { requireFixture, squadFor } from '@/lib/api/mock/data/fixtures';
import { PLAYABLE_FIXTURES } from '@/lib/api/mock/pool';
import { EMPTY_POOL_MESSAGES } from '@/lib/api/mock/shared';
import { MOCK_SHOWCASE } from '@/lib/api/mock/showcase';
import { createStore } from '@/lib/api/mock/store';
import { HANDLE_PATTERN } from '@/lib/api/schemas/auth';
import { catalogOverviewSchema } from '@/lib/api/schemas/catalog';
import {
  soloMatchOfferSchema,
  soloSessionSchema,
  soloSummarySchema,
} from '@/lib/api/schemas/solo';
import type { ApiResult } from '@/types/api';
import type { Filters } from '@/types/filters';
import type { Side } from '@/types/match';
import type { HistoryPage } from '@/types/profile';

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
  const index = PLAYABLE_FIXTURES.findIndex((f) => f.identity.id === fixtureId);
  if (index < 0) throw new Error(`Unknown fixture ${fixtureId}`);
  return (index + 0.5) / PLAYABLE_FIXTURES.length;
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
    expect(soloMatchOfferSchema.safeParse(offer).success).toBe(true);
    expect(offer.match).toEqual(requireFixture(CROWN_2003).identity);

    const started = unwrap(await api.solo.chooseSide(offer.sessionId, 'home'));
    // The run plays the very match the card showed
    expect(started.match).toEqual({
      ...offer.match,
      side: 'home',
      formation: started.match.formation,
    });
    expect(started.lives).toBe(3);
    expect(started.found).toHaveLength(0);
    expect(started.round).not.toBeNull();
    expect(started.match.id).toBe(CROWN_2003);
    expect(soloSessionSchema.safeParse(started).success).toBe(true);

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
    for (const fixture of PLAYABLE_FIXTURES) {
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

  it('makes new users the tier it was given, free by default', async () => {
    const free = unwrap(await api.auth.continueAsGuest());
    expect(free.user.tier).toBe('free');

    const pro = createMockApiClient({ now: () => clock, tier: 'pro' });
    expect(unwrap(await pro.auth.continueAsGuest()).user.tier).toBe('pro');
    const signedUp = unwrap(
      await pro.auth.signUp({
        email: 'pro@example.com',
        password: 'long-enough-password',
        handle: 'pro_player',
      }),
    );
    expect(signedUp.user.tier).toBe('pro');
  });

  it('answers the config with the switch, on by default', async () => {
    expect(unwrap(await api.config.getConfig())).toEqual({ proEnabled: true });
    const off = createMockApiClient({ now: () => clock, proEnabled: false });
    expect(unwrap(await off.config.getConfig())).toEqual({
      proEnabled: false,
    });
  });

  it('makes every user Pro while the switch is off', async () => {
    api = createMockApiClient({
      now: () => clock,
      random: () => draw,
      tier: 'free',
      proEnabled: false,
    });
    expect(unwrap(await api.auth.continueAsGuest()).user.tier).toBe('pro');
    const { sessionId } = await startRun();
    const summary = unwrap(await api.solo.quit(sessionId));
    expect(summary.missed).toHaveLength(11);
  });

  it('keeps the stored tier while the switch is on', async () => {
    api = createMockApiClient({ now: () => clock, proEnabled: true });
    expect(unwrap(await api.auth.continueAsGuest()).user.tier).toBe('free');
  });

  it('sends a Pro run its missed players', async () => {
    api = createMockApiClient({
      now: () => clock,
      random: () => draw,
      tier: 'pro',
    });
    await api.auth.continueAsGuest();
    const { sessionId } = await startRun();
    const summary = unwrap(await api.solo.quit(sessionId));
    expect(summary.missed).toHaveLength(11);
    expect(summary.missedCount).toBe(11);
  });

  it('carries headshots to reveals and the Pro summary', async () => {
    const store = createStore();
    api = createMockApiClient({ now: () => clock, random: () => draw, store });
    await api.auth.continueAsGuest();
    if (!store.identity) throw new Error('No identity');
    store.identity.user = { ...store.identity.user, tier: 'pro' };

    const squad = squadFor(requireFixture(CROWN_2003), 'home');
    const withImage = squad.find((entry) => entry.imageUrl !== null);
    const withoutImage = squad.find((entry) => entry.imageUrl === null);
    if (!withImage || !withoutImage) throw new Error('XI lacks a mix');

    const { sessionId } = await startRun();
    for (const entry of [withImage, withoutImage]) {
      clock += 10;
      await api.solo.guess({ sessionId, guess: entry.name });
    }
    for (let i = 0; i < 3; i += 1) {
      clock += ROUND_DURATION_MS + GRACE_WINDOW_MS + 1;
      await api.solo.syncSession(sessionId);
    }

    const summary = unwrap(await api.solo.getSummary(sessionId));
    const imageOf = new Map(squad.map((e) => [e.playerId, e.imageUrl]));
    expect(summary.found).toHaveLength(2);
    expect(soloSummarySchema.safeParse(summary).success).toBe(true);
    // Each name 10ms into its round, on the mock clock
    expect(summary.found.map((player) => player.order)).toEqual([1, 2]);
    expect(summary.found.map((player) => player.elapsedMs)).toEqual([10, 10]);
    expect(summary.missed).toHaveLength(9);
    for (const player of [...summary.found, ...(summary.missed ?? [])]) {
      expect(player.imageUrl, player.name).toBe(imageOf.get(player.id));
    }
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

  it('breaks the streak on a life lost to the clock', async () => {
    await api.auth.continueAsGuest();
    const { sessionId } = await startRun();
    const [first, second, third, fourth] = squadFor(
      requireFixture(CROWN_2003),
      'home',
    );

    for (const entry of [first, second, third]) {
      clock += 10;
      await api.solo.guess({ sessionId, guess: entry.name });
    }
    clock += ROUND_DURATION_MS + GRACE_WINDOW_MS + 1;
    await api.solo.syncSession(sessionId);
    clock += 10;
    await api.solo.guess({ sessionId, guess: fourth.name });

    const summary = unwrap(await api.solo.quit(sessionId));
    expect(summary.found).toHaveLength(4);
    expect(summary.livesRemaining).toBe(2);
    expect(summary.bestStreak).toBe(3);

    const { sessionId: next } = await startRun();
    clock += 10;
    await api.solo.guess({ sessionId: next, guess: first.name });
    clock += ROUND_DURATION_MS + GRACE_WINDOW_MS + 1;
    await api.solo.syncSession(next);
    clock += 10;
    await api.solo.guess({ sessionId: next, guess: second.name });

    expect(unwrap(await api.solo.quit(next)).bestStreak).toBe(1);
  });

  it('breaks the streak when a guess catches up an expiry', async () => {
    await api.auth.continueAsGuest();
    const { sessionId } = await startRun();
    const names = squadFor(requireFixture(CROWN_2003), 'home').map(
      (entry) => entry.name,
    );

    for (const name of names.slice(0, 2)) {
      clock += 10;
      await api.solo.guess({ sessionId, guess: name });
    }
    // No sync: the guess applies the expiry first
    clock += ROUND_DURATION_MS + GRACE_WINDOW_MS + 1;
    for (const name of names.slice(2, 4)) {
      const step = unwrap(await api.solo.guess({ sessionId, guess: name }));
      expect(step.result.outcome).toBe('correct_new');
      clock += 10;
    }

    const summary = unwrap(await api.solo.quit(sessionId));
    expect(summary.livesRemaining).toBe(2);
    expect(summary.bestStreak).toBe(2);
  });

  it('plays the away XI when away is chosen', async () => {
    await api.auth.continueAsGuest();
    const { sessionId, session } = await startRun('away');

    expect(session.match.side).toBe('away');
    expect(session.match.away.id).toBe('club-riverton');

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
      // The reason travels with the message it names
      expect(
        error.emptyBecause && EMPTY_POOL_MESSAGES[error.emptyBecause],
      ).toBe(message);
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

  it('takes a lower rate limit from its options', async () => {
    const strict = createMockApiClient({
      now: () => clock,
      random: () => draw,
      rateLimit: { max: 2, windowMs: 3_000 },
    });
    await strict.auth.continueAsGuest();
    const offer = unwrap(await strict.solo.findMatch(ALL_FILTERS));
    unwrap(await strict.solo.chooseSide(offer.sessionId, 'home'));
    const guess = (text: string) =>
      strict.solo.guess({ sessionId: offer.sessionId, guess: text });

    expect((await guess('nobody 1')).success).toBe(true);
    clock += 1_000;
    expect((await guess('nobody 2')).success).toBe(true);
    const limited = errorOf(await guess('nobody 3'));
    expect(limited.code).toBe('rate_limited');
    expect(limited.retryAfterMs).toBe(2_000);

    clock += 2_000;
    expect((await guess('nobody 4')).success).toBe(true);
  });

  it('issues a fresh gateway token only while signed in', async () => {
    expect(errorOf(await api.auth.getGatewayToken()).code).toBe('unauthorized');

    await api.auth.continueAsGuest();
    const first = unwrap(await api.auth.getGatewayToken());
    const second = unwrap(await api.auth.getGatewayToken());
    expect(first.token).not.toBe(second.token);
    expect(first.expiresAt).toBe(T0 + 5 * 60_000);

    await api.auth.signOut();
    expect(errorOf(await api.auth.getGatewayToken()).code).toBe('unauthorized');
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

  it('rejects the reserved password on sign in', async () => {
    const error = errorOf(
      await api.auth.signIn({
        email: 'player@example.com',
        password: MOCK_REJECTED_PASSWORD,
      }),
    );
    expect(error.code).toBe('unauthorized');
    expect(error.message).toBe('Email or password is incorrect.');
    expect(unwrap(await api.auth.getSession())).toBeNull();
  });

  it('rejects the taken handle on sign up and upgrade', async () => {
    const request = {
      email: 'player@example.com',
      password: 'a-good-password',
      handle: ' Taken ',
    };

    const signUpError = errorOf(await api.auth.signUp(request));
    expect(signUpError.code).toBe('invalid_input');
    expect(signUpError.message).toBe('That handle is taken.');

    const guest = unwrap(await api.auth.continueAsGuest());
    const upgradeError = errorOf(await api.auth.upgradeGuest(request));
    expect(upgradeError.code).toBe('invalid_input');

    const session = unwrap(await api.auth.getSession());
    expect(session?.user).toEqual(guest.user);
  });

  it('gives a guest a handle in the backend shape', async () => {
    draw = 0.99;
    const { user } = unwrap(await api.auth.continueAsGuest());
    expect(user.handle).toMatch(/^guest-[a-z0-9]{8}$/);
    expect(user.handle).toMatch(HANDLE_PATTERN);
    expect(user.handle).toBe('guest-zzzzzzzz');
  });

  it('sets emailVerified as the backend does', async () => {
    const request = {
      email: 'player@example.com',
      password: 'a-good-password',
      handle: 'keeper',
    };

    const guest = unwrap(await api.auth.continueAsGuest());
    expect(guest.user.emailVerified).toBe(false);

    const upgraded = unwrap(await api.auth.upgradeGuest(request));
    expect(upgraded.user.emailVerified).toBe(false);

    const signedUp = unwrap(await api.auth.signUp(request));
    expect(signedUp.user.emailVerified).toBe(false);

    const signedIn = unwrap(await api.auth.signIn(request));
    expect(signedIn.user.emailVerified).toBe(true);
  });

  it('refuses a handle the backend would refuse', async () => {
    const error = errorOf(
      await api.auth.signUp({
        email: 'player@example.com',
        password: 'a-good-password',
        handle: 'two words',
      }),
    );
    expect(error.code).toBe('invalid_input');
    expect(unwrap(await api.auth.getSession())).toBeNull();
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

  it('walks every history entry exactly once, page by page', async () => {
    await api.auth.continueAsGuest();

    for (let i = 0; i < 5; i += 1) {
      const { sessionId } = await startRun();
      await api.solo.quit(sessionId);
    }

    const ids: string[] = [];
    let cursor: string | null = null;
    do {
      const page: HistoryPage = unwrap(
        await api.profile.getHistory({ cursor, limit: 2 }),
      );
      ids.push(...page.entries.map((entry) => entry.id));
      cursor = page.nextCursor;
    } while (cursor !== null);

    const all = unwrap(
      await api.profile.getHistory({ cursor: null, limit: 20 }),
    );
    expect(ids).toEqual(all.entries.map((entry) => entry.id));
    expect(new Set(ids).size).toBe(5);
  });

  it('keeps accuracy over every run, not just the last', async () => {
    await api.auth.continueAsGuest();

    const first = await startRun();
    await api.solo.guess({ sessionId: first.sessionId, guess: 'Moss' });
    await api.solo.quit(first.sessionId);
    expect(unwrap(await api.profile.getProfile()).stats.accuracy).toBe(1);

    const second = await startRun();
    await api.solo.guess({ sessionId: second.sessionId, guess: 'Nobody' });
    await api.solo.quit(second.sessionId);
    expect(unwrap(await api.profile.getProfile()).stats.accuracy).toBe(0.5);
  });

  it('offers filter options drawn from the fixtures', async () => {
    const options = unwrap(await api.catalog.getFilterOptions());

    expect(options.competitions).toHaveLength(6);
    expect(options.clubs).toHaveLength(11);
    expect(options.era).toEqual({ from: 2002, to: 2023 });
    expect(JSON.stringify(options)).not.toContain('memorability');
  });

  // Public, like filter options: no session yet
  it('serves the overview before any session', async () => {
    const overview = unwrap(await api.catalog.getOverview());

    expect(catalogOverviewSchema.safeParse(overview).success).toBe(true);
    expect(overview.counts.matches).toBe(PLAYABLE_FIXTURES.length);
    expect(overview.showcase?.match.id).toBe(MOCK_SHOWCASE.fixtureId);
    expect(JSON.stringify(overview)).not.toContain('memorability');
  });
});

describe('mock solo daily cap', () => {
  const DAY_MS = 86_400_000;
  // 10:00 UTC, so the next midnight is 14h away
  const MORNING = Math.floor(T0 / DAY_MS) * DAY_MS + 10 * 3_600_000;
  const MIDNIGHT = Math.floor(T0 / DAY_MS) * DAY_MS + DAY_MS;
  let clock: number;
  let api: ApiClient;

  function client(options: Parameters<typeof createMockApiClient>[0] = {}) {
    return createMockApiClient({
      now: () => clock,
      random: () => 0,
      ...options,
    });
  }

  beforeEach(async () => {
    clock = MORNING;
    api = client();
    await api.auth.continueAsGuest();
  });

  async function playRuns(count: number) {
    for (let i = 0; i < count; i += 1) {
      const offer = unwrap(await api.solo.findMatch(ALL_FILTERS));
      unwrap(await api.solo.chooseSide(offer.sessionId, 'home'));
      unwrap(await api.solo.quit(offer.sessionId));
    }
  }

  it('refuses the sixth start with the time to UTC midnight', async () => {
    await playRuns(5);
    const error = errorOf(await api.solo.findMatch(ALL_FILTERS));
    expect(error).toEqual({
      code: 'forbidden',
      message: "You've played your 5 solo runs today. Duels are unlimited.",
      retryAfterMs: MIDNIGHT - MORNING,
      reason: 'daily_cap',
    });
  });

  it('counts the allowance from side picks, a run in play too', async () => {
    expect(unwrap(await api.solo.getAllowance())).toEqual({
      limit: 5,
      used: 0,
      resetsAt: MIDNIGHT,
    });
    await playRuns(2);
    const offer = unwrap(await api.solo.findMatch(ALL_FILTERS));
    unwrap(await api.solo.chooseSide(offer.sessionId, 'home'));
    expect(unwrap(await api.solo.getAllowance()).used).toBe(3);
  });

  it('never counts an offer taken and left', async () => {
    for (let i = 0; i < 7; i += 1) {
      unwrap(await api.solo.findMatch(ALL_FILTERS));
    }
    expect(unwrap(await api.solo.getAllowance()).used).toBe(0);
  });

  it('refuses a side pick past the cap, so two tabs share five', async () => {
    await playRuns(4);
    const first = unwrap(await api.solo.findMatch(ALL_FILTERS));
    const second = unwrap(await api.solo.findMatch(ALL_FILTERS));
    unwrap(await api.solo.chooseSide(first.sessionId, 'home'));
    const refused = errorOf(
      await api.solo.chooseSide(second.sessionId, 'away'),
    );
    expect(refused.reason).toBe('daily_cap');
    expect(unwrap(await api.solo.getAllowance()).used).toBe(5);
  });

  it('lets the run in play finish after the cap is reached', async () => {
    await playRuns(4);
    const offer = unwrap(await api.solo.findMatch(ALL_FILTERS));
    unwrap(await api.solo.chooseSide(offer.sessionId, 'home'));
    const guess = await api.solo.guess({
      sessionId: offer.sessionId,
      guess: 'Moss',
    });
    expect(guess.success).toBe(true);
  });

  it('wins over an empty pool', async () => {
    await playRuns(5);
    const error = errorOf(
      await api.solo.findMatch({
        ...ALL_FILTERS,
        era: { from: 2000, to: 2000 },
      }),
    );
    expect(error.reason).toBe('daily_cap');
  });

  it('resets at UTC midnight', async () => {
    await playRuns(5);
    clock = MIDNIGHT;
    expect(unwrap(await api.solo.getAllowance())).toEqual({
      limit: 5,
      used: 0,
      resetsAt: MIDNIGHT + DAY_MS,
    });
    expect((await api.solo.findMatch(ALL_FILTERS)).success).toBe(true);
  });

  it.each([
    ['Pro', { tier: 'pro' as const }],
    ['the switch off', { proEnabled: false }],
  ])('never refuses %s, and reports no limit', async (_, options) => {
    api = client(options);
    await api.auth.continueAsGuest();
    await playRuns(6);
    expect(unwrap(await api.solo.getAllowance())).toEqual({
      limit: null,
      used: 6,
      resetsAt: MIDNIGHT,
    });
  });

  it('needs a session for the allowance', async () => {
    await api.auth.signOut();
    expect(errorOf(await api.solo.getAllowance()).code).toBe('unauthorized');
  });
});

describe('mock archive access', () => {
  const NOW = 1_700_000_000_000;

  it('serves Pro, refuses Free and asks for a session', async () => {
    const free = createMockApiClient({ now: () => NOW });
    expect(errorOf(await free.catalog.getArchive({})).code).toBe(
      'unauthorized',
    );
    await free.auth.continueAsGuest();
    expect(errorOf(await free.catalog.getArchive({}))).toEqual({
      code: 'forbidden',
      message: 'Browsing the match archive needs Pro.',
      retryAfterMs: null,
      reason: 'pro_required',
    });

    const pro = createMockApiClient({ now: () => NOW, tier: 'pro' });
    await pro.auth.continueAsGuest();
    const page = unwrap(await pro.catalog.getArchive({ q: 'north' }));
    expect(page.total).toBe(3);
  });

  it('is public with the switch off, no session needed', async () => {
    const off = createMockApiClient({ now: () => NOW, proEnabled: false });
    const page = unwrap(await off.catalog.getArchive({}));
    expect(page.total).toBe(PLAYABLE_FIXTURES.length);
  });
});

describe('mock picked match', () => {
  const NOW = 1_700_000_000_000;
  const PICK = { ...ALL_FILTERS, matchId: 'match-crown-2015' };

  it('offers exactly the picked match, whatever the filters', async () => {
    const pro = createMockApiClient({ now: () => NOW, tier: 'pro' });
    await pro.auth.continueAsGuest();
    const narrow = { ...PICK, competitionIds: ['comp-nations-cup'] };
    const offer = unwrap(await pro.solo.findMatch(narrow));
    expect(offer.match.id).toBe('match-crown-2015');
    expect(soloMatchOfferSchema.safeParse(offer).success).toBe(true);
    const session = unwrap(await pro.solo.chooseSide(offer.sessionId, 'away'));
    expect(session.match.id).toBe('match-crown-2015');
  });

  it('refuses Free before the daily cap', async () => {
    const free = createMockApiClient({ now: () => NOW });
    await free.auth.continueAsGuest();
    for (let i = 0; i < 5; i += 1) {
      const offer = unwrap(await free.solo.findMatch(ALL_FILTERS));
      unwrap(await free.solo.chooseSide(offer.sessionId, 'home'));
    }
    expect(errorOf(await free.solo.findMatch(PICK))).toEqual({
      code: 'forbidden',
      message: 'Picking a match needs Pro.',
      retryAfterMs: null,
      reason: 'pro_required',
    });
  });

  it('answers not_found for an unknown id and the showcase', async () => {
    const pro = createMockApiClient({ now: () => NOW, tier: 'pro' });
    await pro.auth.continueAsGuest();
    for (const matchId of ['match-nope', MOCK_SHOWCASE.fixtureId]) {
      expect(errorOf(await pro.solo.findMatch({ ...PICK, matchId }))).toEqual({
        code: 'not_found',
        message: "That match isn't in the game.",
        retryAfterMs: null,
      });
    }
  });

  it('lets anyone pick with the switch off', async () => {
    const off = createMockApiClient({ now: () => NOW, proEnabled: false });
    await off.auth.continueAsGuest();
    expect(unwrap(await off.solo.findMatch(PICK)).match.id).toBe(
      'match-crown-2015',
    );
  });
});
