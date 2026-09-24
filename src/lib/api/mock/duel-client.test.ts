import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DuelClient, DuelEvent } from '@/lib/api/duel-client';
import { GRACE_WINDOW_MS, ROUND_DURATION_MS } from '@/lib/api/mock/clock';
import { SEED_SQUAD } from '@/lib/api/mock/data/seed';
import {
  createMockDuelClient,
  OPPONENT_FILTER_MS,
  QUEUE_WAIT_MS,
  RECONNECT_WINDOW_MS,
  type MockDuelOptions,
} from '@/lib/api/mock/duel-client';
import type { DuelResult, DuelSession } from '@/types/duel';
import type { Filters } from '@/types/filters';

const FILTERS: Filters = {
  competitionIds: [],
  clubIds: [],
  era: { from: 2000, to: 2025 },
};

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

// Passes an exact sequence through, so the opponent never surprises a test
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
  await vi.advanceTimersByTimeAsync(OPPONENT_FILTER_MS);
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
    await vi.advanceTimersByTimeAsync(OPPONENT_FILTER_MS);

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
  });

  it('names the coin-flip winner and applies one filter set whole', async () => {
    const client = createMockDuelClient(scripted({ random: () => 0.1 }));
    const log = record(client);

    await reachMatch(client);

    const flip = lastOf<{ winner: string; filters: Filters }>(log, 'coinFlip');
    expect(flip.winner).toBe('you');
    expect(flip.filters).toEqual(FILTERS);
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

    const ack = await client.guess({ sessionId: 'duel-1', guess: 'Ferreira' });
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
    expect(revealed.name).toBe('Diego Ferreira');
    expect(revealed.foundBy).toBe('you');

    const session = lastOf<DuelSession>(log, 'roundStarted');
    expect(session.turn).toBe('opponent');
    expect(session.found).toHaveLength(1);
  });

  it('leaves the turn alone for already-found and not-in-XI', async () => {
    const client = createMockDuelClient(scripted());
    await reachMatch(client);
    await client.guess({ sessionId: 'duel-1', guess: 'Ferreira' });

    const log = record(client);
    const outOfTurn = await client.guess({
      sessionId: 'duel-1',
      guess: 'Petrov',
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
    const answers = SEED_SQUAD.map((entry) => entry.name);
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

  it('refuses an out-of-date protocol on connect', async () => {
    const client = createMockDuelClient(
      scripted({ scenario: 'protocolRefused' }),
    );

    const result = await client.connect();
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('forbidden');
  });

  it('surfaces a rate limit as an event and a failed ack', async () => {
    const client = createMockDuelClient(scripted({ scenario: 'rateLimited' }));
    const log = record(client);
    await reachMatch(client);

    const result = await client.guess({
      sessionId: 'duel-1',
      guess: 'Ferreira',
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

    await client.guess({ sessionId: 'duel-1', guess: 'Petrov' });

    const body = JSON.stringify(log);
    expect(body).toContain('Nikolai Petrov');

    for (const entry of SEED_SQUAD) {
      if (entry.playerId === 'pl-10') continue;
      expect(body).not.toContain(entry.name);
    }
  });

  it('charges the life when a guess lands after the deadline', async () => {
    const client = createMockDuelClient(scripted());
    const log = record(client);
    await reachMatch(client);
    log.length = 0;

    // Past the deadline, but before the expiry timer callback runs
    vi.setSystemTime(
      new Date(Date.now() + ROUND_DURATION_MS + GRACE_WINDOW_MS + 100),
    );

    const result = await client.guess({
      sessionId: 'duel-1',
      guess: 'Ferreira',
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
