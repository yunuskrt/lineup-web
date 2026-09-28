import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DuelClient } from '@/lib/api/duel-client';
import {
  COIN_FLIP_REVEAL_MS,
  createMockDuelClient,
  OPPONENT_FILTER_MS,
  QUEUE_WAIT_MS,
} from '@/lib/api/mock/duel-client';
import { MAX_LIVES } from '@/lib/api/schemas/game';
import {
  SAMPLE_FILTER_OPTIONS,
  SAMPLE_FILTERS,
  SAMPLE_MATCH,
  SAMPLE_OPEN_FILTERS,
  SAMPLE_OPPONENT,
  SAMPLE_YOU,
} from '@/lib/dev/samples';
import {
  canLockFilters,
  DUEL_GATE_COPY,
  duelCanvasView,
  duelGateAction,
  duelLobbyReducer,
  INITIAL_DUEL_LOBBY,
  youFrom,
} from '@/lib/duel-lobby';
import { filterSummary, lobbyGate } from '@/lib/lobby';
import type { ApiError } from '@/types/api';
import type { DuelSession, FilterSubmission } from '@/types/duel';
import type { DuelLobbyEvent, DuelLobbyState } from '@/types/duel-lobby';

const OPPONENT = { ...SAMPLE_OPPONENT, lives: MAX_LIVES };
const YOU = { ...SAMPLE_YOU, lives: MAX_LIVES };

const NETWORK: ApiError = {
  code: 'network',
  message: 'offline',
  retryAfterMs: null,
};

const EMPTY_POOL: ApiError = {
  code: 'empty_pool',
  message: 'No match fits the winning filters.',
  retryAfterMs: null,
};

const SESSION: DuelSession = {
  sessionId: 'duel-1',
  match: SAMPLE_MATCH,
  you: YOU,
  opponent: OPPONENT,
  turn: 'opponent',
  round: { startedAt: 1_000, endsAt: 16_000 },
  found: [],
};

function submission(
  yours: FilterSubmission['yours'],
  theirs: FilterSubmission['theirs'],
): FilterSubmission {
  return { yours, theirs };
}

function play(...events: DuelLobbyEvent[]): DuelLobbyState {
  return events.reduce(duelLobbyReducer, INITIAL_DUEL_LOBBY);
}

const PREPARED: DuelLobbyEvent = {
  type: 'prepared',
  filters: SAMPLE_FILTERS,
  options: SAMPLE_FILTER_OPTIONS,
};

const TO_SEARCHING: DuelLobbyEvent[] = [
  { type: 'started' },
  PREPARED,
  { type: 'queued' },
];

const TO_PAIRED: DuelLobbyEvent[] = [
  ...TO_SEARCHING,
  { type: 'paired', opponent: OPPONENT },
];

const TO_FILTERS: DuelLobbyEvent[] = [...TO_PAIRED, { type: 'filtersOpened' }];

const YOU_WIN: DuelLobbyEvent = {
  type: 'coinFlip',
  result: { winner: 'you', filters: SAMPLE_FILTERS },
};

const THEY_WIN: DuelLobbyEvent = {
  type: 'coinFlip',
  result: { winner: 'opponent', filters: SAMPLE_OPEN_FILTERS },
};

const TO_READY: DuelLobbyEvent[] = [
  ...TO_FILTERS,
  { type: 'locking' },
  { type: 'filtersUpdated', submission: submission('submitted', 'pending') },
  { type: 'filtersUpdated', submission: submission('submitted', 'submitted') },
  YOU_WIN,
  { type: 'matchReady', session: SESSION },
];

function viewOf(state: DuelLobbyState) {
  return duelCanvasView(state, YOU);
}

describe('duelLobbyReducer', () => {
  it('starts connecting, with no gate over the skeleton', () => {
    const view = viewOf(INITIAL_DUEL_LOBBY);
    expect(INITIAL_DUEL_LOBBY.phase).toBe('connecting');
    expect(view.gate).toBeNull();
    expect(view.lobby).toBeNull();
    expect(view.match).toBeNull();
  });

  it('searches once the server queues you', () => {
    const state = play(...TO_SEARCHING);
    expect(state.phase).toBe('searching');
    expect(viewOf(state).lobby).toEqual({ step: 'searching' });
    expect(viewOf(state).opponent).toBeNull();
  });

  it('shows the opponent the server paired', () => {
    const state = play(...TO_PAIRED);
    expect(state.phase).toBe('paired');
    expect(viewOf(state).opponent).toEqual(OPPONENT);
    expect(viewOf(state).lobby).toEqual({ step: 'paired', opponent: OPPONENT });
  });

  it('opens the filter step when the beat ends', () => {
    const state = play(...TO_FILTERS);
    expect(state.phase).toBe('filters');
    expect(viewOf(state).lobby).toEqual({
      step: 'filters',
      yours: filterSummary(SAMPLE_FILTERS, SAMPLE_FILTER_OPTIONS),
      submission: submission('pending', 'pending'),
      isLocking: false,
    });
  });

  it('ignores a late beat once past pairing', () => {
    const state = play(...TO_READY, { type: 'filtersOpened' });
    expect(state.phase).toBe('ready');
  });

  it('opens filters early when a submission lands in the beat', () => {
    const state = play(...TO_PAIRED, {
      type: 'filtersUpdated',
      submission: submission('pending', 'submitted'),
    });
    expect(state.phase).toBe('filters');
    expect(state.submission.theirs).toBe('submitted');
  });

  it('locks until the server confirms your submission', () => {
    const locking = play(...TO_FILTERS, { type: 'locking' });
    expect(locking.isLocking).toBe(true);
    expect(canLockFilters(locking)).toBe(false);

    const locked = duelLobbyReducer(locking, {
      type: 'filtersUpdated',
      submission: submission('submitted', 'pending'),
    });
    expect(locked.isLocking).toBe(false);
    expect(canLockFilters(locked)).toBe(false);
  });

  it('keeps locking through their submission alone', () => {
    const state = play(
      ...TO_FILTERS,
      { type: 'locking' },
      {
        type: 'filtersUpdated',
        submission: submission('pending', 'submitted'),
      },
    );
    expect(state.isLocking).toBe(true);
  });

  it('stores the winner and the set the server applied', () => {
    const state = play(...TO_FILTERS, THEY_WIN);
    const view = viewOf(state);
    expect(state.phase).toBe('coinFlip');
    expect(view.lobby).toEqual({
      step: 'coinFlip',
      winner: 'opponent',
      applied: filterSummary(SAMPLE_OPEN_FILTERS, SAMPLE_FILTER_OPTIONS),
      opponent: OPPONENT,
    });
    expect(view.gate?.title).toBe(`${OPPONENT.handle}'s filters won`);
  });

  it('clears the lobby when the match is ready', () => {
    const view = viewOf(play(...TO_READY));
    expect(view.lobby).toBeNull();
    expect(view.match).toEqual(SAMPLE_MATCH);
    expect(view.you).toEqual(SESSION.you);
    expect(view.opponent).toEqual(SESSION.opponent);
  });

  it('holds the clock and turn back until the loop', () => {
    const view = viewOf(play(...TO_READY));
    expect(view.clock.round).toBeNull();
    expect(view.turn).toBeNull();
    expect(view.input).toBe('locked');
  });

  it('names whose filters picked the match at the handoff', () => {
    const won = viewOf(play(...TO_READY));
    expect(won.gate?.title).toBe(DUEL_GATE_COPY.matchFound);
    expect(won.gate?.detail).toBe('Your filters picked this match.');
    expect(won.gate?.actionLabel).toBe(DUEL_GATE_COPY.backToFilters);

    const lost = viewOf(
      play(...TO_FILTERS, THEY_WIN, { type: 'matchReady', session: SESSION }),
    );
    expect(lost.gate?.detail).toBe(
      `${OPPONENT.handle}'s filters picked this match.`,
    );
  });

  it('offers solo when the queue times out, then searches again', () => {
    const timedOut = play(...TO_SEARCHING, { type: 'queueTimedOut' });
    expect(viewOf(timedOut).lobby).toEqual({ step: 'noOpponent' });

    const again = [{ type: 'started' }, { type: 'queued' }] as const;
    const searching = again.reduce(duelLobbyReducer, timedOut);
    expect(searching.phase).toBe('searching');
    expect(searching.filters).toEqual(SAMPLE_FILTERS);
  });

  it('keeps the flip on screen if a late submission lands', () => {
    const state = play(...TO_FILTERS, YOU_WIN, {
      type: 'filtersUpdated',
      submission: submission('submitted', 'submitted'),
    });
    expect(state.phase).toBe('coinFlip');
  });

  it('keeps the filters it read across a restart', () => {
    const state = play(...TO_FILTERS, { type: 'started' });
    expect(state.phase).toBe('connecting');
    expect(state.filters).toEqual(SAMPLE_FILTERS);
    expect(state.options).toEqual(SAMPLE_FILTER_OPTIONS);
    expect(state.opponent).toBeNull();
  });

  it('clears a stale pairing when queued again', () => {
    const state = play(...TO_READY, { type: 'queued' });
    expect(state.opponent).toBeNull();
    expect(state.coinFlip).toBeNull();
    expect(state.session).toBeNull();
    expect(state.submission).toEqual(submission('pending', 'pending'));
  });

  it('locks the input in every lobby phase', () => {
    const states = [
      INITIAL_DUEL_LOBBY,
      play(...TO_PAIRED),
      play(...TO_FILTERS),
      play(...TO_FILTERS, YOU_WIN),
      play(...TO_READY),
    ];
    for (const state of states) {
      expect(viewOf(state).input, state.phase).toBe('locked');
    }
  });
});

describe('failures', () => {
  it('releases the lock when submitting fails', () => {
    const state = play(
      ...TO_FILTERS,
      { type: 'locking' },
      {
        type: 'failed',
        step: 'lock',
        error: NETWORK,
      },
    );
    expect(state.isLocking).toBe(false);
    expect(state.phase).toBe('failed');
    expect(canLockFilters(state)).toBe(true);
    expect(viewOf(state).gate?.title).toBe("Couldn't lock in your filters");
  });

  it('returns to the filter step on a lock retry', () => {
    const state = play(
      ...TO_FILTERS,
      { type: 'failed', step: 'lock', error: NETWORK },
      { type: 'locking' },
    );
    expect(state.phase).toBe('filters');
    expect(state.failure).toBeNull();
    expect(state.isLocking).toBe(true);
  });

  it.each([
    ['connect', "Couldn't start the duel"],
    ['queue', "Couldn't join the queue"],
    ['lock', "Couldn't lock in your filters"],
    ['match', "Couldn't set up the match"],
  ] as const)('titles a failed %s step and offers a retry', (step, title) => {
    const state = play({ type: 'failed', step, error: NETWORK });
    const gate = viewOf(state).gate;
    expect(gate?.title).toBe(title);
    expect(gate?.actionLabel).toBe(DUEL_GATE_COPY.tryAgain);
    expect(duelGateAction(state)).toBe('retry');
  });

  it('sends an empty pool back to the filters', () => {
    const state = play(...TO_FILTERS, YOU_WIN, {
      type: 'error',
      error: EMPTY_POOL,
    });
    const gate = viewOf(state).gate;
    expect(gate?.title).toBe(DUEL_GATE_COPY.noMatch);
    expect(gate?.detail).toBe(EMPTY_POOL.message);
    expect(gate?.actionLabel).toBe(DUEL_GATE_COPY.changeFilters);
    expect(duelGateAction(state)).toBe('leave');
  });

  it('names the step a server error interrupted', () => {
    const queued = play({ type: 'queued' }, { type: 'error', error: NETWORK });
    expect(queued.failure?.step).toBe('queue');

    const flipped = play(...TO_FILTERS, YOU_WIN, {
      type: 'error',
      error: NETWORK,
    });
    expect(flipped.failure?.step).toBe('match');
  });

  it('never fails silently: every failure opens a gate', () => {
    for (const step of ['connect', 'queue', 'lock', 'match'] as const) {
      expect(
        viewOf(play({ type: 'failed', step, error: NETWORK })).gate,
      ).not.toBeNull();
    }
  });
});

describe('duelGateAction', () => {
  it('leaves from the handoff and has nothing to do mid-lobby', () => {
    expect(duelGateAction(play(...TO_READY))).toBe('leave');
    expect(duelGateAction(play(...TO_FILTERS))).toBeNull();
    expect(duelGateAction(INITIAL_DUEL_LOBBY)).toBeNull();
  });
});

describe('canLockFilters', () => {
  it('needs the filters read and the step open', () => {
    expect(canLockFilters(play(...TO_PAIRED))).toBe(false);
    expect(canLockFilters(play(...TO_FILTERS))).toBe(true);
    const unread = play(
      { type: 'queued' },
      { type: 'paired', opponent: OPPONENT },
      { type: 'filtersOpened' },
    );
    expect(canLockFilters(unread)).toBe(false);
  });
});

describe('lobby gates', () => {
  it('match the lobby step the view shows', () => {
    for (const state of [
      play(...TO_PAIRED),
      play(...TO_FILTERS),
      play(...TO_FILTERS, YOU_WIN),
    ]) {
      const view = viewOf(state);
      if (!view.lobby) throw new Error(`${state.phase} has no lobby`);
      expect(view.gate).toEqual(lobbyGate(view.lobby));
    }
  });
});

describe('youFrom', () => {
  it('uses the signed-in handle', () => {
    const you = youFrom({
      id: 'u-1',
      handle: 'floodlit_fan',
      isGuest: true,
      tier: 'free',
    });
    expect(you).toEqual({
      id: 'u-1',
      handle: 'floodlit_fan',
      lives: MAX_LIVES,
    });
  });

  it('falls back to a plain label before the session loads', () => {
    expect(youFrom(null).handle).toBe('You');
    expect(youFrom(null).lives).toBe(MAX_LIVES);
  });
});

describe('against the mock adapter', () => {
  const OPEN = SAMPLE_OPEN_FILTERS;
  const NOTHING_FITS = { ...OPEN, era: { from: 2000, to: 2001 } };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Wires events the way useDuelLobby does
  function drive(client: DuelClient) {
    let state = play(
      { type: 'started' },
      { type: 'prepared', filters: OPEN, options: SAMPLE_FILTER_OPTIONS },
    );
    const phases = [state.phase];
    const apply = (event: DuelLobbyEvent) => {
      state = duelLobbyReducer(state, event);
      if (phases.at(-1) !== state.phase) phases.push(state.phase);
    };
    client.on('queued', () => apply({ type: 'queued' }));
    client.on('queueTimedOut', () => apply({ type: 'queueTimedOut' }));
    client.on('paired', ({ opponent }) => apply({ type: 'paired', opponent }));
    client.on('filtersUpdated', (next) =>
      apply({ type: 'filtersUpdated', submission: next }),
    );
    client.on('coinFlip', (result) => apply({ type: 'coinFlip', result }));
    client.on('matchReady', (duel) =>
      apply({ type: 'matchReady', session: duel }),
    );
    client.on('error', (error) => apply({ type: 'error', error }));
    return { apply, phases, current: () => state };
  }

  it('walks the lobby phases in the order the adapter emits', async () => {
    const client = createMockDuelClient({ random: () => 0.1, hitRate: 0 });
    const lobby = drive(client);

    await client.enterQueue();
    await vi.advanceTimersByTimeAsync(QUEUE_WAIT_MS);
    lobby.apply({ type: 'filtersOpened' });
    lobby.apply({ type: 'locking' });
    await client.submitFilters(OPEN);
    expect(lobby.current().isLocking).toBe(false);

    await vi.advanceTimersByTimeAsync(OPPONENT_FILTER_MS);
    expect(lobby.current().coinFlip?.winner).toBe('you');
    expect(lobby.current().session).toBeNull();

    await vi.advanceTimersByTimeAsync(COIN_FLIP_REVEAL_MS);
    expect(lobby.phases).toEqual([
      'connecting',
      'searching',
      'paired',
      'filters',
      'coinFlip',
      'ready',
    ]);

    const view = viewOf(lobby.current());
    expect(view.gate?.title).toBe(DUEL_GATE_COPY.matchFound);
    expect(view.match).not.toBeNull();
    expect(view.found).toEqual([]);
    client.disconnect();
  });

  it('offers solo on a timeout, then times out again', async () => {
    const client = createMockDuelClient({ scenario: 'queueTimeout' });
    const lobby = drive(client);

    await client.enterQueue();
    await vi.advanceTimersByTimeAsync(QUEUE_WAIT_MS);
    expect(lobby.current().phase).toBe('noOpponent');

    lobby.apply({ type: 'started' });
    await client.enterQueue();
    expect(lobby.current().phase).toBe('searching');
    await vi.advanceTimersByTimeAsync(QUEUE_WAIT_MS);
    expect(lobby.current().phase).toBe('noOpponent');
  });

  it('sends filters that match nothing back to /play', async () => {
    const client = createMockDuelClient({ hitRate: 0 });
    const lobby = drive(client);

    await client.enterQueue();
    await vi.advanceTimersByTimeAsync(QUEUE_WAIT_MS);
    lobby.apply({ type: 'filtersOpened' });
    lobby.apply({ type: 'locking' });
    const result = await client.submitFilters(NOTHING_FITS);
    if (result.success) throw new Error('Expected a refusal');
    lobby.apply({ type: 'failed', step: 'lock', error: result.error });

    expect(viewOf(lobby.current()).gate?.actionLabel).toBe(
      DUEL_GATE_COPY.changeFilters,
    );
    expect(duelGateAction(lobby.current())).toBe('leave');
    client.disconnect();
  });
});
