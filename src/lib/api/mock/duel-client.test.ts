import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DuelClient, DuelEvent } from '@/lib/api/duel-client';
import { GRACE_WINDOW_MS, ROUND_DURATION_MS } from '@/lib/api/mock/clock';
import { squadFor } from '@/lib/api/mock/data/fixtures';
import {
  COIN_FLIP_REVEAL_MS,
  DISCONNECT_AFTER_MS,
  createMockDuelClient,
  OPPONENT_FILTER_MS,
  OPPONENT_FILTERS,
  QUEUE_WAIT_MS,
  RECONNECT_AFTER_MS,
  RECONNECT_WINDOW_MS,
  type MockDuelOptions,
} from '@/lib/api/mock/duel-client';
import { createMockApiClient } from '@/lib/api/mock/api-client';
import { selectFixture } from '@/lib/api/mock/pool';
import {
  createIdentity,
  createStore,
  type MockStore,
} from '@/lib/api/mock/store';
import { EMPTY_POOL_MESSAGES } from '@/lib/api/mock/shared';
import type { MockFixture, MockSquad } from '@/lib/api/mock/types';
import { duelSessionSchema } from '@/lib/api/schemas/duel';
import type { DuelResult, DuelSession } from '@/types/duel';
import type { Filters } from '@/types/filters';

const FILTERS: Filters = {
  competitionIds: [],
  clubIds: [],
  era: { from: 2000, to: 2025 },
};

const CROWN_ONLY: Filters = {
  ...FILTERS,
  competitionIds: ['comp-crown-league'],
};

// Replays the draws: coin flip, fixture, then side
function expectedFixture(draw: number, yours: Filters = FILTERS): MockFixture {
  const applied = draw < 0.5 ? yours : OPPONENT_FILTERS;
  const selection = selectFixture(applied, () => draw);
  if (!('fixture' in selection)) throw new Error('Expected a fixture');
  return selection.fixture;
}

function expectedSquad(draw: number, yours: Filters = FILTERS): MockSquad {
  return squadFor(expectedFixture(draw, yours), draw < 0.5 ? 'home' : 'away');
}

// What `scripted()` plays: their filters, away XI
const SQUAD = expectedSquad(0.99);

const EVENTS: DuelEvent[] = [
  'queued',
  'queueTimedOut',
  'paired',
  'filtersUpdated',
  'coinFlip',
  'matchReady',
  'roundStarted',
  'guessResolved',
  'playerRevealed',
  'lifeLost',
  'turnChanged',
  'opponentConnection',
  'finished',
  'disconnected',
  'error',
];

type Recorded = { event: DuelEvent; payload: unknown };

function record(client: DuelClient): Recorded[] {
  const log: Recorded[] = [];
  for (const event of EVENTS) {
    client.on(event, (payload) => log.push({ event, payload }));
  }
  return log;
}

function names(log: Recorded[]): DuelEvent[] {
  return log.map((item) => item.event);
}

function lastOf<T>(log: Recorded[], event: DuelEvent): T {
  const found = [...log].reverse().find((item) => item.event === event);
  if (!found) throw new Error(`No ${event} was emitted`);
  return found.payload as T;
}

// Exact sequence, so the opponent never surprises
function scripted(overrides: MockDuelOptions = {}): MockDuelOptions {
  return { random: () => 0.99, hitRate: 0, ...overrides };
}

async function reachMatch(
  client: DuelClient,
  filters: Filters = FILTERS,
): Promise<void> {
  await client.enterQueue();
  await vi.advanceTimersByTimeAsync(QUEUE_WAIT_MS);
  await client.submitFilters(filters);
  await vi.advanceTimersByTimeAsync(OPPONENT_FILTER_MS + COIN_FLIP_REVEAL_MS);
}

describe('mock duel client', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('walks the lobby from queue to a live match', async () => {
    const client = createMockDuelClient(scripted());
    const log = record(client);

    expect((await client.connect()).success).toBe(true);
    await client.enterQueue();
    expect(names(log)).toEqual(['queued']);

    await vi.advanceTimersByTimeAsync(QUEUE_WAIT_MS);
    expect(names(log)).toEqual(['queued', 'paired']);

    await client.submitFilters(FILTERS);
    await vi.advanceTimersByTimeAsync(OPPONENT_FILTER_MS + COIN_FLIP_REVEAL_MS);

    expect(names(log)).toEqual([
      'queued',
      'paired',
      'filtersUpdated',
      'filtersUpdated',
      'coinFlip',
      'matchReady',
    ]);

    const session = lastOf<DuelSession>(log, 'matchReady');
    expect(session.you.lives).toBe(3);
    expect(session.opponent.lives).toBe(3);
    expect(session.turn).toBe('you');
    expect(session.found).toHaveLength(0);
    expect(duelSessionSchema.safeParse(session).success).toBe(true);
  });

  it('names the coin-flip winner and applies one filter set whole', async () => {
    const client = createMockDuelClient(scripted({ random: () => 0.1 }));
    const log = record(client);

    await reachMatch(client);

    const flip = lastOf<{ winner: string; filters: Filters }>(log, 'coinFlip');
    expect(flip.winner).toBe('you');
    expect(flip.filters).toEqual(FILTERS);
  });

  it('applies the opponent set whole when the opponent wins', async () => {
    const client = createMockDuelClient(scripted());
    const log = record(client);

    await reachMatch(client, CROWN_ONLY);

    const flip = lastOf<{ winner: string; filters: Filters }>(log, 'coinFlip');
    expect(flip.winner).toBe('opponent');
    expect(flip.filters).toEqual(OPPONENT_FILTERS);

    const session = lastOf<DuelSession>(log, 'matchReady');
    const fixture = expectedFixture(0.99, CROWN_ONLY);
    expect(session.match.id).toBe(fixture.identity.id);
    expect(fixture.identity.competition.id).not.toBe('comp-crown-league');
  });

  it('plays a fixture from your set when you win the flip', async () => {
    const client = createMockDuelClient(scripted({ random: () => 0.1 }));
    const log = record(client);

    await reachMatch(client, CROWN_ONLY);
    await client.forfeit();

    const session = lastOf<DuelSession>(log, 'matchReady');
    expect(session.match.side).toBe('home');
    expect(session.match.id).toBe(expectedFixture(0.1, CROWN_ONLY).identity.id);

    const result = lastOf<DuelResult>(log, 'finished');
    expect(result.match.competition.id).toBe('comp-crown-league');
  });

  it('rejects malformed filters without submitting them', async () => {
    const client = createMockDuelClient(scripted());
    const log = record(client);
    await client.enterQueue();
    await vi.advanceTimersByTimeAsync(QUEUE_WAIT_MS);
    log.length = 0;

    const refused = await client.submitFilters({
      ...FILTERS,
      era: { from: 2020, to: 2010 },
    });

    expect(refused.success).toBe(false);
    if (!refused.success) expect(refused.error.code).toBe('invalid_input');
    expect(names(log)).toEqual([]);
  });

  it('refuses filters that match nothing before submitting them', async () => {
    const client = createMockDuelClient(scripted());
    const log = record(client);
    await client.enterQueue();
    await vi.advanceTimersByTimeAsync(QUEUE_WAIT_MS);
    log.length = 0;

    const refused = await client.submitFilters({
      ...FILTERS,
      era: { from: 2000, to: 2001 },
    });

    expect(refused.success).toBe(false);
    if (!refused.success) {
      expect(refused.error.code).toBe('empty_pool');
      expect(refused.error.message).toBe(EMPTY_POOL_MESSAGES.era);
    }
    expect(names(log)).toEqual([]);

    await client.submitFilters(FILTERS);
    await vi.advanceTimersByTimeAsync(OPPONENT_FILTER_MS + COIN_FLIP_REVEAL_MS);
    expect(names(log)).toContain('matchReady');
  });

  it('holds the coin flip before any round starts', async () => {
    const client = createMockDuelClient(scripted());
    const log = record(client);
    await client.enterQueue();
    await vi.advanceTimersByTimeAsync(QUEUE_WAIT_MS);
    await client.submitFilters(FILTERS);
    await vi.advanceTimersByTimeAsync(OPPONENT_FILTER_MS);

    expect(names(log).at(-1)).toBe('coinFlip');
    await vi.advanceTimersByTimeAsync(COIN_FLIP_REVEAL_MS - 1);
    expect(names(log)).not.toContain('matchReady');
    expect(names(log)).not.toContain('roundStarted');

    await vi.advanceTimersByTimeAsync(1);
    const session = lastOf<DuelSession>(log, 'matchReady');
    // The first round's clock starts only now
    expect(session.round.startedAt).toBe(Date.now());
  });

  it('drops the pending match when you disconnect mid-flip', async () => {
    const client = createMockDuelClient(scripted());
    const log = record(client);
    await client.enterQueue();
    await vi.advanceTimersByTimeAsync(QUEUE_WAIT_MS);
    await client.submitFilters(FILTERS);
    await vi.advanceTimersByTimeAsync(OPPONENT_FILTER_MS);

    client.disconnect();
    const after = record(client);
    await vi.advanceTimersByTimeAsync(COIN_FLIP_REVEAL_MS);
    expect(names(after)).toEqual([]);
    expect(names(log).at(-1)).toBe('coinFlip');
  });

  it('emits queueTimedOut instead of pairing on the timeout path', async () => {
    const client = createMockDuelClient(scripted({ scenario: 'queueTimeout' }));
    const log = record(client);

    await client.enterQueue();
    await vi.advanceTimersByTimeAsync(QUEUE_WAIT_MS);

    expect(names(log)).toEqual(['queued', 'queueTimedOut']);
    const timeout = lastOf<{ waitedMs: number }>(log, 'queueTimedOut');
    expect(timeout.waitedMs).toBe(QUEUE_WAIT_MS);
  });

  it('resolves a correct guess, reveals, then starts the next round', async () => {
    const client = createMockDuelClient(scripted());
    const log = record(client);
    await reachMatch(client);
    log.length = 0;

    const ack = await client.guess({
      sessionId: 'duel-1',
      guess: SQUAD[3].name,
    });
    expect(ack.success).toBe(true);

    expect(names(log)).toEqual([
      'guessResolved',
      'playerRevealed',
      'turnChanged',
      'roundStarted',
    ]);

    const revealed = lastOf<{ name: string; foundBy: string }>(
      log,
      'playerRevealed',
    );
    expect(revealed.name).toBe(SQUAD[3].name);
    expect(revealed.foundBy).toBe('you');

    const session = lastOf<DuelSession>(log, 'roundStarted');
    expect(session.turn).toBe('opponent');
    expect(session.found).toHaveLength(1);
  });

  it('leaves the turn alone for already-found and not-in-XI', async () => {
    const client = createMockDuelClient(scripted());
    await reachMatch(client);
    await client.guess({ sessionId: 'duel-1', guess: SQUAD[3].name });

    const log = record(client);
    const outOfTurn = await client.guess({
      sessionId: 'duel-1',
      guess: SQUAD[9].name,
    });

    expect(outOfTurn.success).toBe(false);
    if (!outOfTurn.success) expect(outOfTurn.error.code).toBe('forbidden');
    expect(names(log)).toEqual([]);
  });

  it('costs a life only when the clock runs out', async () => {
    const client = createMockDuelClient(scripted());
    const log = record(client);
    await reachMatch(client);

    await client.guess({ sessionId: 'duel-1', guess: 'Not A Player' });
    expect(names(log)).toContain('guessResolved');
    expect(names(log)).not.toContain('lifeLost');

    log.length = 0;
    await vi.advanceTimersByTimeAsync(ROUND_DURATION_MS + 1_000);

    const lost = lastOf<{ who: string; lives: number }>(log, 'lifeLost');
    expect(lost.who).toBe('you');
    expect(lost.lives).toBe(2);
    expect(names(log)).toContain('roundStarted');
  });

  it('ends as a loss when the third life goes', async () => {
    const client = createMockDuelClient(scripted());
    const log = record(client);
    await reachMatch(client);

    for (let i = 0; i < 3; i += 1) {
      await vi.advanceTimersByTimeAsync(ROUND_DURATION_MS + 1_000);
      await vi.advanceTimersByTimeAsync(ROUND_DURATION_MS + 1_000);
    }

    const result = lastOf<DuelResult>(log, 'finished');
    expect(result.outcome).toBe('loss');
    expect(result.isForfeit).toBe(false);
    expect(result.you.lives).toBe(0);
  });

  it('ends as a win when the opponent runs out of lives', async () => {
    const client = createMockDuelClient(scripted());
    const log = record(client);
    await reachMatch(client);

    // You always answer; the opponent never does
    const answers = SQUAD.map((entry) => entry.name);
    for (let i = 0; i < 3; i += 1) {
      await client.guess({ sessionId: 'duel-1', guess: answers[i] });
      await vi.advanceTimersByTimeAsync(ROUND_DURATION_MS + 1_000);
    }

    const result = lastOf<DuelResult>(log, 'finished');
    expect(result.outcome).toBe('win');
    expect(result.opponent.lives).toBe(0);
    expect(result.you.lives).toBe(3);
  });

  it('draws when all eleven are named, with lives untouched', async () => {
    const client = createMockDuelClient(scripted({ scenario: 'drawOnEleven' }));
    const log = record(client);
    await reachMatch(client);
    await vi.advanceTimersByTimeAsync(1);

    const result = lastOf<DuelResult>(log, 'finished');
    expect(result.outcome).toBe('draw');
    expect(result.found).toHaveLength(11);
    expect(result.you.lives).toBe(3);
    expect(result.opponent.lives).toBe(3);
    expect(result.isForfeit).toBe(false);
  });

  it('reports your own forfeit as a loss', async () => {
    const client = createMockDuelClient(scripted());
    const log = record(client);
    await reachMatch(client);

    await client.forfeit();

    const result = lastOf<DuelResult>(log, 'finished');
    expect(result.outcome).toBe('loss');
    expect(result.isForfeit).toBe(true);
  });

  it('runs the opponent reconnect window, then forfeits them', async () => {
    const client = createMockDuelClient(
      scripted({ scenario: 'opponentDisconnects' }),
    );
    const log = record(client);
    await reachMatch(client);

    await vi.advanceTimersByTimeAsync(1_000);
    const reconnecting = lastOf<{
      status: string;
      reconnectDeadline: number | null;
    }>(log, 'opponentConnection');
    expect(reconnecting.status).toBe('reconnecting');
    expect(reconnecting.reconnectDeadline).toBeGreaterThan(Date.now());

    await vi.advanceTimersByTimeAsync(RECONNECT_WINDOW_MS);
    const result = lastOf<DuelResult>(log, 'finished');
    expect(result.outcome).toBe('forfeit_win');
    expect(result.isForfeit).toBe(true);
  });

  it('tells you your own socket dropped, with a deadline', async () => {
    const client = createMockDuelClient(
      scripted({ scenario: 'youDisconnect' }),
    );
    const log = record(client);
    await reachMatch(client);

    await vi.advanceTimersByTimeAsync(1_000);
    const dropped = lastOf<{
      status: string;
      reconnectDeadline: number | null;
    }>(log, 'disconnected');

    expect(dropped.status).toBe('reconnecting');
    expect(dropped.reconnectDeadline).toBeGreaterThan(Date.now());
  });

  it('forfeits you as a loss once the window closes', async () => {
    const client = createMockDuelClient(
      scripted({ scenario: 'youDisconnect' }),
    );
    const log = record(client);
    await reachMatch(client);

    await vi.advanceTimersByTimeAsync(
      DISCONNECT_AFTER_MS + RECONNECT_WINDOW_MS - 1,
    );
    expect(log.some((entry) => entry.event === 'finished')).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    const closed = lastOf<{ status: string }>(log, 'disconnected');
    expect(closed.status).toBe('forfeited');
    const result = lastOf<DuelResult>(log, 'finished');
    expect(result.outcome).toBe('loss');
    expect(result.isForfeit).toBe(true);
  });

  it('brings you back inside the window under youReconnect', async () => {
    const client = createMockDuelClient(scripted({ scenario: 'youReconnect' }));
    const log = record(client);
    await reachMatch(client);

    await vi.advanceTimersByTimeAsync(DISCONNECT_AFTER_MS + RECONNECT_AFTER_MS);
    const back = lastOf<{
      status: string;
      reconnectDeadline: number | null;
    }>(log, 'disconnected');
    expect(back).toEqual({ status: 'connected', reconnectDeadline: null });

    await vi.advanceTimersByTimeAsync(RECONNECT_WINDOW_MS);
    expect(log.some((entry) => entry.event === 'finished')).toBe(false);
    client.disconnect();
  });

  it('refuses an out-of-date protocol on connect', async () => {
    const client = createMockDuelClient(
      scripted({ scenario: 'protocolRefused' }),
    );

    const result = await client.connect();
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('protocol_refused');
  });

  it('surfaces a rate limit as an event and a failed ack', async () => {
    const client = createMockDuelClient(scripted({ scenario: 'rateLimited' }));
    const log = record(client);
    await reachMatch(client);

    const result = await client.guess({
      sessionId: 'duel-1',
      guess: SQUAD[3].name,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe('rate_limited');
      expect(result.error.retryAfterMs).toBeGreaterThan(0);
    }

    const emitted = lastOf<{ code: string }>(log, 'error');
    expect(emitted.code).toBe('rate_limited');
  });

  it('never emits a player who has not been revealed', async () => {
    const client = createMockDuelClient(scripted());
    const log = record(client);
    await reachMatch(client);

    const [named, ...hidden] = SQUAD;
    await client.guess({ sessionId: 'duel-1', guess: named.name });

    const body = JSON.stringify(log);
    expect(body).toContain(named.name);
    for (const entry of hidden) {
      expect(body).not.toContain(entry.name);
    }
  });

  it('charges the life when a guess lands after the deadline', async () => {
    const client = createMockDuelClient(scripted());
    const log = record(client);
    await reachMatch(client);
    log.length = 0;

    // Past the deadline, before the expiry timer runs
    vi.setSystemTime(
      new Date(Date.now() + ROUND_DURATION_MS + GRACE_WINDOW_MS + 100),
    );

    const result = await client.guess({
      sessionId: 'duel-1',
      guess: SQUAD[3].name,
    });

    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('forbidden');

    const lost = lastOf<{ who: string; lives: number }>(log, 'lifeLost');
    expect(lost.who).toBe('you');
    expect(lost.lives).toBe(2);
    expect(names(log)).not.toContain('guessResolved');
  });

  it('stops emitting after disconnect', async () => {
    const client = createMockDuelClient(scripted());
    const log = record(client);
    await reachMatch(client);

    client.disconnect();
    await vi.advanceTimersByTimeAsync(ROUND_DURATION_MS * 4);

    expect(names(log)).not.toContain('lifeLost');
  });
});

describe('mock duel client recording', () => {
  let store: MockStore;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
    store = createStore();
    store.identity = createIdentity({
      id: 'guest-1',
      handle: 'Guest 1',
      isGuest: true,
      tier: 'free',
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function identity() {
    if (!store.identity) throw new Error('Expected an identity');
    return store.identity;
  }

  async function win(client: DuelClient): Promise<void> {
    for (let i = 0; i < 3; i += 1) {
      await client.guess({ sessionId: 'duel-1', guess: SQUAD[i].name });
      await vi.advanceTimersByTimeAsync(ROUND_DURATION_MS + 1_000);
    }
  }

  it('records a won duel as a history entry and a win', async () => {
    const client = createMockDuelClient(scripted({ store }));
    await reachMatch(client);
    await win(client);

    const [entry] = identity().history;
    expect(entry).toMatchObject({
      mode: 'duel',
      outcome: 'win',
      foundCount: 3,
      livesRemaining: 3,
      match: expectedFixture(0.99).identity,
    });

    const { stats } = identity();
    expect(stats.played).toBe(1);
    expect(stats.wins).toBe(1);
    // `scripted()` plays the away XI
    expect(stats.favouriteClub).toEqual(expectedFixture(0.99).identity.away);
  });

  it.each([
    ['your forfeit', undefined, 'losses'],
    ['their forfeit', 'opponentForfeits', 'wins'],
    ['a draw', 'drawOnEleven', 'draws'],
  ] as const)('counts %s under %s', async (_, scenario, counter) => {
    const client = createMockDuelClient(scripted({ store, scenario }));
    await reachMatch(client);

    if (scenario) await vi.advanceTimersByTimeAsync(1_000);
    else await client.forfeit();

    const { wins, losses, draws, played } = identity().stats;
    expect({ wins, losses, draws, played }).toEqual({
      wins: 0,
      losses: 0,
      draws: 0,
      played: 1,
      [counter]: 1,
    });
  });

  it('counts only your guesses toward accuracy', async () => {
    const client = createMockDuelClient(scripted({ store }));
    await reachMatch(client);

    await client.guess({ sessionId: 'duel-1', guess: 'Not A Player' });
    await client.guess({ sessionId: 'duel-1', guess: SQUAD[0].name });
    await client.forfeit();

    expect(identity().guessCount).toBe(2);
    expect(identity().hitCount).toBe(1);
    expect(identity().stats.accuracy).toBe(0.5);
  });

  it('starts each duel with a fresh guess tally', async () => {
    const client = createMockDuelClient(scripted({ store }));
    await reachMatch(client);
    await client.guess({ sessionId: 'duel-1', guess: 'Not A Player' });
    await client.forfeit();

    // Play again: the hook disconnects, then queues anew
    client.disconnect();
    await reachMatch(client);
    await client.guess({ sessionId: 'duel-1', guess: SQUAD[0].name });
    await client.forfeit();

    expect(identity().history).toHaveLength(2);
    expect(identity().guessCount).toBe(2);
    expect(identity().hitCount).toBe(1);
  });

  it('keeps a duel in history when the guest upgrades (HC 12)', async () => {
    const api = createMockApiClient({ store });
    const client = createMockDuelClient(scripted({ store }));
    await reachMatch(client);
    await win(client);

    const upgraded = await api.auth.upgradeGuest({
      email: 'player@example.com',
      password: 'a-good-password',
      handle: 'keeper',
    });
    expect(upgraded.success).toBe(true);

    const profile = await api.profile.getProfile();
    if (!profile.success) throw new Error('Expected a profile');
    expect(profile.data.user.isGuest).toBe(false);
    expect(profile.data.stats.wins).toBe(1);
    expect(identity().history.map((entry) => entry.outcome)).toEqual(['win']);
  });

  it('records each duel once, even if finished twice', async () => {
    const client = createMockDuelClient(scripted({ store }));
    await reachMatch(client);
    await client.forfeit();
    await client.forfeit();

    expect(identity().history).toHaveLength(1);
  });

  it('records nothing without a signed-in identity', async () => {
    store.identity = null;
    const client = createMockDuelClient(scripted({ store }));
    const log = record(client);
    await reachMatch(client);
    await client.forfeit();

    expect(names(log)).toContain('finished');
    expect(store.identity).toBeNull();
  });

  it('shares one history with the REST mock, newest first', async () => {
    const api = createMockApiClient({ store, random: () => 0 });
    const offer = await api.solo.findMatch(FILTERS);
    if (!offer.success) throw new Error('Expected a match offer');
    await api.solo.chooseSide(offer.data.sessionId, 'home');
    await api.solo.quit(offer.data.sessionId);

    const client = createMockDuelClient(scripted({ store }));
    await reachMatch(client);
    await client.forfeit();

    const page = await api.profile.getHistory({ cursor: null, limit: 20 });
    if (!page.success) throw new Error('Expected history');
    expect(page.data.entries.map((entry) => entry.mode)).toEqual([
      'duel',
      'solo',
    ]);

    const profile = await api.profile.getProfile();
    if (!profile.success) throw new Error('Expected a profile');
    expect(profile.data.stats.played).toBe(2);
    expect(profile.data.stats.losses).toBe(1);
  });
});
