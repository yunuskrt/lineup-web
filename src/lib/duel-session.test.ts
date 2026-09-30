import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DuelClient } from '@/lib/api/duel-client';
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
import { selectFixture } from '@/lib/api/mock/pool';
import { MAX_LIVES } from '@/lib/api/schemas/game';
import {
  SAMPLE_FILTER_OPTIONS,
  SAMPLE_FILTERS,
  SAMPLE_MATCH,
  SAMPLE_OPEN_FILTERS,
  SAMPLE_OPPONENT,
  SAMPLE_YOU,
  samplePlayer,
} from '@/lib/dev/samples';
import {
  canConfirmForfeit,
  canForfeit,
  canGuess,
  canLockFilters,
  DUEL_GATE_COPY,
  duelCanvasView,
  duelGateAction,
  duelSessionReducer,
  INITIAL_DUEL_SESSION,
  youFrom,
} from '@/lib/duel-session';
import { FEEDBACK_MESSAGES } from '@/lib/feedback';
import { widenFilters } from '@/lib/filters';
import { filterSummary, lobbyGate } from '@/lib/lobby';
import type { ApiError } from '@/types/api';
import type { DuelResult, DuelSession, FilterSubmission } from '@/types/duel';
import type { DuelSessionEvent, DuelSessionState } from '@/types/duel-session';

const OPPONENT = { ...SAMPLE_OPPONENT, lives: MAX_LIVES };
const YOU = { ...SAMPLE_YOU, lives: MAX_LIVES };

const AT = 1_700_000_000_000;

const NETWORK: ApiError = {
  code: 'network',
  message: 'offline',
  retryAfterMs: null,
};

const RATE_LIMITED: ApiError = {
  code: 'rate_limited',
  message: 'Too many guesses at once. Wait a moment.',
  retryAfterMs: 2_000,
};

const EMPTY_POOL: ApiError = {
  code: 'empty_pool',
  message: 'No match fits the winning filters.',
  retryAfterMs: null,
};

const YOUR_TURN: DuelSession = {
  sessionId: 'duel-1',
  match: SAMPLE_MATCH,
  you: YOU,
  opponent: OPPONENT,
  turn: 'you',
  round: { startedAt: 1_000, endsAt: 16_000 },
  found: [],
};

const THEIR_TURN: DuelSession = {
  ...YOUR_TURN,
  turn: 'opponent',
  round: { startedAt: 16_400, endsAt: 31_400 },
  found: [{ ...samplePlayer(SAMPLE_MATCH.formation, 2), foundBy: 'you' }],
};

const RESULT: DuelResult = {
  outcome: 'win',
  match: {
    id: SAMPLE_MATCH.id,
    competition: { id: 'c', kind: 'ucl', name: 'Continental Cup' },
    season: '2004-05',
    date: '2005-05-25',
    stage: 'Final',
    home: SAMPLE_MATCH.team,
    away: SAMPLE_MATCH.team,
    score: { home: 1, away: 0 },
    nickname: null,
  },
  found: THEIR_TURN.found,
  you: YOU,
  opponent: { ...OPPONENT, lives: 0 },
  isForfeit: false,
};

function submission(
  yours: FilterSubmission['yours'],
  theirs: FilterSubmission['theirs'],
): FilterSubmission {
  return { yours, theirs };
}

function play(...events: DuelSessionEvent[]): DuelSessionState {
  return events.reduce(duelSessionReducer, INITIAL_DUEL_SESSION);
}

const PREPARED: DuelSessionEvent = {
  type: 'prepared',
  filters: SAMPLE_FILTERS,
  options: SAMPLE_FILTER_OPTIONS,
};

const TO_SEARCHING: DuelSessionEvent[] = [
  { type: 'started' },
  PREPARED,
  { type: 'queued' },
];

const TO_PAIRED: DuelSessionEvent[] = [
  ...TO_SEARCHING,
  { type: 'paired', opponent: OPPONENT },
];

const TO_FILTERS: DuelSessionEvent[] = [
  ...TO_PAIRED,
  { type: 'filtersOpened' },
];

const YOU_WIN: DuelSessionEvent = {
  type: 'coinFlip',
  result: { winner: 'you', filters: SAMPLE_FILTERS },
};

const THEY_WIN: DuelSessionEvent = {
  type: 'coinFlip',
  result: { winner: 'opponent', filters: SAMPLE_OPEN_FILTERS },
};

const TO_PLAYING: DuelSessionEvent[] = [
  ...TO_FILTERS,
  { type: 'locking' },
  { type: 'filtersUpdated', submission: submission('submitted', 'pending') },
  { type: 'filtersUpdated', submission: submission('submitted', 'submitted') },
  YOU_WIN,
  { type: 'matchReady', session: YOUR_TURN },
];

const TO_FINISHED: DuelSessionEvent[] = [
  ...TO_PLAYING,
  { type: 'finished', result: RESULT },
];

function viewOf(state: DuelSessionState) {
  return duelCanvasView(state, YOU);
}

describe('the lobby', () => {
  it('starts connecting, with no gate over the skeleton', () => {
    const view = viewOf(INITIAL_DUEL_SESSION);
    expect(INITIAL_DUEL_SESSION.phase).toBe('connecting');
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
    const state = play(...TO_PLAYING, { type: 'filtersOpened' });
    expect(state.phase).toBe('playing');
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

    const locked = duelSessionReducer(locking, {
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

  it('keeps the flip on screen if a late submission lands', () => {
    const state = play(...TO_FILTERS, YOU_WIN, {
      type: 'filtersUpdated',
      submission: submission('submitted', 'submitted'),
    });
    expect(state.phase).toBe('coinFlip');
  });

  it('offers solo when the queue times out, then searches again', () => {
    const timedOut = play(...TO_SEARCHING, { type: 'queueTimedOut' });
    expect(viewOf(timedOut).lobby).toEqual({ step: 'noOpponent' });

    const again = [{ type: 'started' }, { type: 'queued' }] as const;
    const searching = again.reduce(duelSessionReducer, timedOut);
    expect(searching.phase).toBe('searching');
    expect(searching.filters).toEqual(SAMPLE_FILTERS);
  });

  it('keeps the filters it read across a restart', () => {
    const state = play(...TO_FINISHED, { type: 'started' });
    expect(state.phase).toBe('connecting');
    expect(state.filters).toEqual(SAMPLE_FILTERS);
    expect(state.options).toEqual(SAMPLE_FILTER_OPTIONS);
    expect(state.opponent).toBeNull();
    expect(state.result).toBeNull();
    expect(state.session).toBeNull();
  });

  it('clears the last duel when queued again', () => {
    const state = play(...TO_FINISHED, { type: 'queued' });
    expect(state.opponent).toBeNull();
    expect(state.coinFlip).toBeNull();
    expect(state.session).toBeNull();
    expect(state.result).toBeNull();
    expect(state.submission).toEqual(submission('pending', 'pending'));
  });

  it('locks the input in every lobby phase', () => {
    for (const state of [
      INITIAL_DUEL_SESSION,
      play(...TO_PAIRED),
      play(...TO_FILTERS),
      play(...TO_FILTERS, YOU_WIN),
    ]) {
      expect(viewOf(state).input, state.phase).toBe('locked');
    }
  });
});

describe('the match', () => {
  it('starts on the session the server sent, with no gate', () => {
    const view = viewOf(play(...TO_PLAYING));
    expect(view.lobby).toBeNull();
    expect(view.gate).toBeNull();
    expect(view.match).toEqual(SAMPLE_MATCH);
    expect(view.clock.round).toEqual(YOUR_TURN.round);
    expect(view.turn).toBe('you');
    expect(view.input).toBe('live');
  });

  it('takes the turn and clock from each new session', () => {
    const view = viewOf(
      play(...TO_PLAYING, { type: 'turnChanged', session: THEIR_TURN }),
    );
    expect(view.turn).toBe('opponent');
    expect(view.clock.round).toEqual(THEIR_TURN.round);
    expect(view.found).toEqual(THEIR_TURN.found);
    expect(view.input).toBe('locked');
  });

  it('holds the input pending until the verdict', () => {
    const pending = play(...TO_PLAYING, { type: 'guessSubmitted' });
    expect(viewOf(pending).input).toBe('pending');
    expect(canGuess(pending)).toBe(false);

    const resolved = duelSessionReducer(pending, {
      type: 'guessResolved',
      result: { outcome: 'not_in_xi' },
    });
    expect(viewOf(resolved).input).toBe('live');
  });

  it('ends a guess in flight when the turn hands over', () => {
    const state = play(
      ...TO_PLAYING,
      { type: 'guessSubmitted' },
      { type: 'turnChanged', session: THEIR_TURN },
    );
    expect(state.isGuessing).toBe(false);
  });

  it('shakes the input for a name outside the XI, text kept', () => {
    const before = play(...TO_PLAYING, { type: 'guessSubmitted' });
    const after = duelSessionReducer(before, {
      type: 'guessResolved',
      result: { outcome: 'not_in_xi' },
    });
    expect(after.shakeKey).toBe(before.shakeKey + 1);
    expect(after.clearKey).toBe(before.clearKey);
    expect(after.toast?.message).toBe(FEEDBACK_MESSAGES.notInXi);
    expect(after.pulse).toBeUndefined();
  });

  it('pulses the named slot for a repeat, and clears the input', () => {
    const before = play(...TO_PLAYING, { type: 'guessSubmitted' });
    const after = duelSessionReducer(before, {
      type: 'guessResolved',
      result: { outcome: 'already_found', playerId: 'sample-2' },
    });
    expect(after.pulse).toEqual({ playerId: 'sample-2', key: 1 });
    expect(after.clearKey).toBe(before.clearKey + 1);
    expect(after.toast?.message).toBe(FEEDBACK_MESSAGES.alreadyFound);
    expect(after.shakeKey).toBe(before.shakeKey);
  });

  it('clears the input on a new find, with no toast', () => {
    const before = play(...TO_PLAYING, { type: 'guessSubmitted' });
    const after = duelSessionReducer(before, {
      type: 'guessResolved',
      result: {
        outcome: 'correct_new',
        player: samplePlayer(SAMPLE_MATCH.formation, 2),
      },
    });
    expect(after.clearKey).toBe(before.clearKey + 1);
    expect(after.toast).toBeNull();
  });

  it('flashes only for your own lost life', () => {
    const playing = play(...TO_PLAYING);
    const yours = duelSessionReducer(playing, {
      type: 'lifeLost',
      cue: { who: 'you', lives: 2 },
    });
    const theirs = duelSessionReducer(playing, {
      type: 'lifeLost',
      cue: { who: 'opponent', lives: 2 },
    });
    expect(yours.lifeLostKey).toBe(playing.lifeLostKey + 1);
    expect(theirs.lifeLostKey).toBe(playing.lifeLostKey);
  });

  it('toasts a rejected guess and unlocks the input', () => {
    const state = play(
      ...TO_PLAYING,
      { type: 'guessSubmitted' },
      { type: 'guessFailed', error: NETWORK, at: AT },
    );
    expect(state.isGuessing).toBe(false);
    expect(state.toast).not.toBeNull();
    expect(state.phase).toBe('playing');
    expect(viewOf(state).input).toBe('live');
  });

  it('toasts a server error mid-match instead of gating', () => {
    const state = play(
      ...TO_PLAYING,
      { type: 'guessSubmitted' },
      { type: 'error', error: NETWORK, at: AT },
    );
    expect(state.phase).toBe('playing');
    expect(state.failure).toBeNull();
    expect(state.isGuessing).toBe(false);
    expect(viewOf(state).gate).toBeNull();
    expect(state.toast).not.toBeNull();
  });

  it('locks the input on a rate limit, with no toast', () => {
    const state = play(
      ...TO_PLAYING,
      { type: 'guessSubmitted' },
      { type: 'guessFailed', error: RATE_LIMITED, at: AT },
    );
    const view = viewOf(state);
    expect(state.toast).toBeNull();
    expect(view.input).toBe('cooldown');
    expect(view.cooldownUntil).toBe(AT + 2_000);
    expect(view.clock.round).toEqual(YOUR_TURN.round);
    expect(canGuess(state)).toBe(false);
  });

  it('counts one lockout reported by event and ack', () => {
    const state = play(
      ...TO_PLAYING,
      { type: 'guessSubmitted' },
      { type: 'error', error: RATE_LIMITED, at: AT },
      { type: 'guessFailed', error: RATE_LIMITED, at: AT + 5 },
    );
    expect(state.cooldownUntil).toBe(AT + 2_000);
    expect(state.toast).toBeNull();
  });

  it('drops the lockout when the result arrives', () => {
    const limited = play(...TO_PLAYING, {
      type: 'guessFailed',
      error: RATE_LIMITED,
      at: AT,
    });
    const state = duelSessionReducer(limited, {
      type: 'finished',
      result: RESULT,
    });
    expect(state.cooldownUntil).toBeNull();
    expect(viewOf(state).input).toBe('locked');
  });

  it('goes live again once the lockout ends', () => {
    const state = play(
      ...TO_PLAYING,
      { type: 'guessFailed', error: RATE_LIMITED, at: AT },
      { type: 'cooldownEnded' },
    );
    expect(viewOf(state).input).toBe('live');
    expect(canGuess(state)).toBe(true);
  });

  it('shows the reconnect until the server clears it', () => {
    const reconnecting = play(...TO_PLAYING, {
      type: 'opponentConnection',
      connection: { status: 'reconnecting', reconnectDeadline: 20_000 },
    });
    expect(viewOf(reconnecting).opponentConnection?.status).toBe(
      'reconnecting',
    );

    const back = duelSessionReducer(reconnecting, {
      type: 'opponentConnection',
      connection: { status: 'connected', reconnectDeadline: null },
    });
    expect(viewOf(back).opponentConnection).toBeNull();
  });

  it('clears the badge when the server marks them forfeited', () => {
    const state = play(
      ...TO_PLAYING,
      {
        type: 'opponentConnection',
        connection: { status: 'reconnecting', reconnectDeadline: 20_000 },
      },
      {
        type: 'opponentConnection',
        connection: { status: 'forfeited', reconnectDeadline: null },
      },
    );
    expect(viewOf(state).opponentConnection).toBeNull();
  });

  it('holds guesses while one is pending or a forfeit is', () => {
    expect(canGuess(play(...TO_PLAYING, { type: 'guessSubmitted' }))).toBe(
      false,
    );
    expect(canGuess(play(...TO_PLAYING, { type: 'forfeiting' }))).toBe(false);
  });

  it('never lets you guess on their turn', () => {
    const state = play(...TO_PLAYING, {
      type: 'turnChanged',
      session: THEIR_TURN,
    });
    expect(canGuess(state)).toBe(false);
    expect(canGuess(play(...TO_PLAYING))).toBe(true);
  });
});

describe('the result', () => {
  it('swaps the rail for the result, with no clock or turn', () => {
    const view = viewOf(play(...TO_FINISHED));
    expect(view.end).toEqual(RESULT);
    expect(view.turn).toBeNull();
    expect(view.clock.round).toBeNull();
    expect(view.input).toBe('locked');
    expect(view.opponent).toEqual(RESULT.opponent);
    expect(view.gate).toBeNull();
  });

  it('ignores events that land after the result', () => {
    const finished = play(...TO_FINISHED);
    const late = [
      { type: 'roundStarted', session: THEIR_TURN },
      { type: 'guessResolved', result: { outcome: 'not_in_xi' } },
      { type: 'lifeLost', cue: { who: 'you', lives: 1 } },
      { type: 'error', error: NETWORK, at: AT },
      { type: 'finished', result: { ...RESULT, outcome: 'loss' } },
    ] as const satisfies DuelSessionEvent[];
    const state = late.reduce(duelSessionReducer, finished);
    expect(state).toEqual(finished);
  });

  it('drops a reconnect badge once the duel ends', () => {
    const state = play(
      ...TO_PLAYING,
      {
        type: 'opponentConnection',
        connection: { status: 'reconnecting', reconnectDeadline: 20_000 },
      },
      { type: 'finished', result: { ...RESULT, outcome: 'forfeit_win' } },
    );
    expect(viewOf(state).opponentConnection).toBeNull();
  });
});

describe('forfeit', () => {
  it('can forfeit only a live match', () => {
    expect(canForfeit(play(...TO_FILTERS))).toBe(false);
    expect(canForfeit(play(...TO_PLAYING))).toBe(true);
    expect(canForfeit(play(...TO_FINISHED))).toBe(false);
  });

  it('leaves the lobby phase alone if a forfeit starts early', () => {
    const state = play(...TO_FILTERS, { type: 'forfeiting' });
    expect(state.phase).toBe('filters');
  });

  it('locks the input while forfeiting', () => {
    const state = play(...TO_PLAYING, { type: 'forfeiting' });
    expect(viewOf(state).input).toBe('locked');
    expect(canForfeit(state)).toBe(false);
  });

  it('keeps the confirm open while the forfeit is pending', () => {
    const pending = play(...TO_PLAYING, { type: 'forfeiting' });
    expect(canConfirmForfeit(pending)).toBe(true);
    expect(canConfirmForfeit(play(...TO_FILTERS))).toBe(false);
    expect(canConfirmForfeit(play(...TO_FINISHED))).toBe(false);
    const failed = duelSessionReducer(pending, {
      type: 'failed',
      step: 'forfeit',
      error: NETWORK,
    });
    expect(canConfirmForfeit(failed)).toBe(false);
  });

  it('resumes play when a failed forfeit is retried', () => {
    const state = play(
      ...TO_PLAYING,
      { type: 'forfeiting' },
      { type: 'failed', step: 'forfeit', error: NETWORK },
      { type: 'forfeiting' },
    );
    expect(state.phase).toBe('playing');
    expect(state.failure).toBeNull();
    expect(state.isForfeiting).toBe(true);
    expect(viewOf(state).gate).toBeNull();
    expect(canConfirmForfeit(state)).toBe(true);
  });

  it('gates a failed forfeit with a retry, the match still held', () => {
    const state = play(
      ...TO_PLAYING,
      { type: 'forfeiting' },
      {
        type: 'failed',
        step: 'forfeit',
        error: NETWORK,
      },
    );
    expect(viewOf(state).gate?.title).toBe("Couldn't forfeit the duel");
    expect(duelGateAction(state)).toBe('retry');
    expect(canForfeit(state)).toBe(true);
    expect(viewOf(state).match).toEqual(SAMPLE_MATCH);
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
    ['forfeit', "Couldn't forfeit the duel"],
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
      at: AT,
    });
    const gate = viewOf(state).gate;
    expect(gate?.title).toBe('No match for these filters together');
    expect(gate?.detail).toBe(EMPTY_POOL.message);
    expect(gate?.actionLabel).toBe('Change filters');
    expect(gate?.secondaryActionLabel).toBeUndefined();
    expect(duelGateAction(state)).toBe('leave');
  });

  it('never offers a widen for a pool emptied after the flip', () => {
    const state = play(...TO_FILTERS, YOU_WIN, {
      type: 'error',
      error: { ...EMPTY_POOL, emptyBecause: 'club' },
      at: AT,
    });
    const gate = viewOf(state).gate;
    expect(state.failure?.step).toBe('match');
    expect(gate?.actionLabel).toBe('Change filters');
    expect(gate?.secondaryActionLabel).toBeUndefined();
    expect(duelGateAction(state)).toBe('leave');
  });

  it('offers to widen a refused lock, then holds the wider set', () => {
    const refused = play(
      ...TO_FILTERS,
      { type: 'locking' },
      {
        type: 'failed',
        step: 'lock',
        error: { ...EMPTY_POOL, emptyBecause: 'competition' },
      },
    );
    const gate = viewOf(refused).gate;
    expect(gate?.title).toBe('No match in those competitions');
    expect(gate?.actionLabel).toBe('Include every competition');
    expect(gate?.secondaryActionLabel).toBe('Change filters');
    expect(duelGateAction(refused)).toBe('widen');

    const widened = { ...SAMPLE_FILTERS, competitionIds: [] };
    const state = duelSessionReducer(refused, {
      type: 'filtersWidened',
      filters: widened,
    });
    expect(state.filters).toEqual(widened);
    expect(canLockFilters(state)).toBe(true);
  });

  it('names the step a server error interrupted', () => {
    const queued = play(
      { type: 'queued' },
      { type: 'error', error: NETWORK, at: AT },
    );
    expect(queued.failure?.step).toBe('queue');

    const flipped = play(...TO_FILTERS, YOU_WIN, {
      type: 'error',
      error: NETWORK,
      at: AT,
    });
    expect(flipped.failure?.step).toBe('match');
  });

  it('has no gate action outside a failure', () => {
    expect(duelGateAction(play(...TO_PLAYING))).toBeNull();
    expect(duelGateAction(play(...TO_FINISHED))).toBeNull();
    expect(duelGateAction(INITIAL_DUEL_SESSION)).toBeNull();
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

describe('your connection', () => {
  const RECONNECTING = {
    type: 'disconnected',
    connection: { status: 'reconnecting', reconnectDeadline: AT + 20_000 },
  } as const satisfies DuelSessionEvent;
  const FORFEITED = {
    type: 'disconnected',
    connection: { status: 'forfeited', reconnectDeadline: null },
  } as const satisfies DuelSessionEvent;
  const YOUR_FORFEIT: DuelSessionEvent = {
    type: 'finished',
    result: { ...RESULT, outcome: 'loss', isForfeit: true },
  };

  it('gates the canvas while you reconnect, clock still running', () => {
    const state = play(...TO_PLAYING, RECONNECTING);
    const view = viewOf(state);
    expect(view.gate?.title).toBe('Reconnecting');
    expect(view.gate?.countdown?.deadline).toBe(AT + 20_000);
    expect(view.gate?.actionLabel).toBeUndefined();
    expect(view.clock.round).toEqual(YOUR_TURN.round);
    expect(view.input).toBe('locked');
    expect(canGuess(state)).toBe(false);
  });

  it('clears the gate when the server says you are back', () => {
    const state = play(...TO_PLAYING, RECONNECTING, {
      type: 'disconnected',
      connection: { status: 'connected', reconnectDeadline: null },
    });
    expect(viewOf(state).gate).toBeNull();
    expect(canGuess(state)).toBe(true);
  });

  it('ends as disconnected when the window closes', () => {
    const state = play(...TO_PLAYING, RECONNECTING, FORFEITED, YOUR_FORFEIT);
    const view = viewOf(state);
    expect(view.endReason).toBe('connectionLost');
    expect(view.yourConnection).toBeNull();
    expect(view.gate).toBeNull();
  });

  it('stays gated and locked between the forfeit and the result', () => {
    const state = play(...TO_PLAYING, RECONNECTING, FORFEITED);
    const view = viewOf(state);
    expect(view.gate?.title).toBe('Reconnecting');
    expect(view.input).toBe('locked');
    expect(canGuess(state)).toBe(false);
    expect(state.phase).toBe('playing');
  });

  it('reads a forfeit mid-reconnect as a lost connection too', () => {
    const state = play(...TO_PLAYING, RECONNECTING, YOUR_FORFEIT);
    expect(viewOf(state).endReason).toBe('connectionLost');
  });

  it('keeps your own forfeit as leaving', () => {
    const state = play(
      ...TO_PLAYING,
      RECONNECTING,
      { type: 'forfeiting' },
      YOUR_FORFEIT,
    );
    expect(viewOf(state).endReason).toBeUndefined();
  });

  it('never marks a result you did not forfeit', () => {
    const state = play(...TO_PLAYING, RECONNECTING, {
      type: 'finished',
      result: RESULT,
    });
    expect(viewOf(state).endReason).toBeUndefined();
  });

  it('keeps the gate across a handover while the clock runs on', () => {
    const state = play(
      ...TO_PLAYING,
      RECONNECTING,
      { type: 'lifeLost', cue: { who: 'you', lives: 2 } },
      { type: 'turnChanged', session: THEIR_TURN },
      { type: 'roundStarted', session: THEIR_TURN },
    );
    const view = viewOf(state);
    expect(view.gate?.title).toBe('Reconnecting');
    expect(view.turn).toBe('opponent');
    expect(view.clock.round).toEqual(THEIR_TURN.round);
  });

  it('starts the next duel without the lost connection', () => {
    const lost = play(...TO_PLAYING, RECONNECTING, FORFEITED, YOUR_FORFEIT);
    const next = duelSessionReducer(lost, { type: 'started' });
    expect(next.isConnectionLost).toBe(false);
    expect(next.yourConnection).toBeNull();

    const replayed = play(...TO_PLAYING, YOUR_FORFEIT);
    expect(viewOf(replayed).endReason).toBeUndefined();
  });

  it('ignores your connection outside a live match', () => {
    expect(play(...TO_FILTERS, RECONNECTING).yourConnection).toBeNull();
    const finished = play(...TO_FINISHED);
    expect(duelSessionReducer(finished, RECONNECTING)).toBe(finished);
  });

  it('turns a refused handshake into its own phase', () => {
    const state = play(
      { type: 'started' },
      {
        type: 'failed',
        step: 'connect',
        error: {
          code: 'protocol_refused',
          message: 'Out of date.',
          retryAfterMs: null,
        },
      },
    );
    expect(state.phase).toBe('refused');
    expect(duelGateAction(state)).toBeNull();
  });

  it('keeps other connect failures on the retry gate', () => {
    const state = play(
      { type: 'started' },
      {
        type: 'failed',
        step: 'connect',
        error: NETWORK,
      },
    );
    expect(state.phase).toBe('failed');
    expect(duelGateAction(state)).toBe('retry');
  });
});

describe('against the mock adapter', () => {
  const OPEN = SAMPLE_OPEN_FILTERS;
  const NOTHING_FITS = { ...OPEN, era: { from: 2000, to: 2001 } };
  // Past the deadline and its grace window
  const ROUND_OUT = ROUND_DURATION_MS + GRACE_WINDOW_MS + 1;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // Their filters and the away XI, as 0.99 draws
  function scripted(overrides: MockDuelOptions = {}): MockDuelOptions {
    return { random: () => 0.99, hitRate: 0, ...overrides };
  }

  function scriptedSquad() {
    const selection = selectFixture(OPPONENT_FILTERS, () => 0.99);
    if (!('fixture' in selection)) throw new Error('Expected a fixture');
    return squadFor(selection.fixture, 'away');
  }

  // Wires events the way useDuel does
  function drive(client: DuelClient) {
    let state = play(
      { type: 'started' },
      { type: 'prepared', filters: OPEN, options: SAMPLE_FILTER_OPTIONS },
    );
    const phases = [state.phase];
    const apply = (event: DuelSessionEvent) => {
      state = duelSessionReducer(state, event);
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
    client.on('roundStarted', (duel) =>
      apply({ type: 'roundStarted', session: duel }),
    );
    client.on('turnChanged', (duel) =>
      apply({ type: 'turnChanged', session: duel }),
    );
    client.on('guessResolved', (result) =>
      apply({ type: 'guessResolved', result }),
    );
    client.on('lifeLost', (cue) => apply({ type: 'lifeLost', cue }));
    client.on('opponentConnection', (connection) =>
      apply({ type: 'opponentConnection', connection }),
    );
    client.on('disconnected', (connection) =>
      apply({ type: 'disconnected', connection }),
    );
    client.on('finished', (result) => apply({ type: 'finished', result }));
    client.on('error', (error) =>
      apply({ type: 'error', error, at: Date.now() }),
    );
    return { apply, phases, current: () => state };
  }

  async function reachMatch(client: DuelClient, duel = drive(client)) {
    await client.enterQueue();
    await vi.advanceTimersByTimeAsync(QUEUE_WAIT_MS);
    duel.apply({ type: 'filtersOpened' });
    duel.apply({ type: 'locking' });
    await client.submitFilters(OPEN);
    await vi.advanceTimersByTimeAsync(OPPONENT_FILTER_MS + COIN_FLIP_REVEAL_MS);
    return duel;
  }

  async function guess(
    client: DuelClient,
    duel: ReturnType<typeof drive>,
    name: string,
  ) {
    duel.apply({ type: 'guessSubmitted' });
    const ack = await client.guess({ sessionId: 'duel-1', guess: name });
    if (!ack.success) {
      duel.apply({ type: 'guessFailed', error: ack.error, at: Date.now() });
    }
  }

  it('walks the lobby phases into the match', async () => {
    const client = createMockDuelClient({ random: () => 0.1, hitRate: 0 });
    const duel = await reachMatch(client);

    expect(duel.phases).toEqual([
      'connecting',
      'searching',
      'paired',
      'filters',
      'coinFlip',
      'playing',
    ]);
    const view = viewOf(duel.current());
    expect(view.gate).toBeNull();
    expect(view.turn).toBe('you');
    expect(view.input).toBe('live');
    expect(view.found).toEqual([]);
    client.disconnect();
  });

  it('wins when their clock runs out three times', async () => {
    const client = createMockDuelClient(scripted());
    const duel = await reachMatch(client);
    const squad = scriptedSquad();

    for (const entry of squad.slice(0, 3)) {
      await guess(client, duel, entry.name);
      expect(duel.current().session?.turn).toBe('opponent');
      await vi.advanceTimersByTimeAsync(ROUND_OUT);
    }

    const state = duel.current();
    expect(state.phase).toBe('finished');
    expect(state.result?.outcome).toBe('win');
    expect(state.result?.opponent.lives).toBe(0);
    // Their lost lives never flash your screen
    expect(state.lifeLostKey).toBe(0);
    expect(viewOf(state).end?.found).toHaveLength(3);
  });

  it('loses when your clock runs out three times', async () => {
    const client = createMockDuelClient(scripted());
    const duel = await reachMatch(client);

    await vi.advanceTimersByTimeAsync(ROUND_OUT * 6);

    const state = duel.current();
    expect(state.result?.outcome).toBe('loss');
    expect(state.result?.you.lives).toBe(0);
    expect(state.lifeLostKey).toBe(MAX_LIVES);
  });

  it('shakes, pulses and hands over as the server says', async () => {
    const client = createMockDuelClient(scripted());
    const duel = await reachMatch(client);
    const [first] = scriptedSquad();

    await guess(client, duel, 'Nobody Anybody');
    expect(duel.current().shakeKey).toBe(1);
    expect(duel.current().session?.turn).toBe('you');

    await guess(client, duel, first.name);
    expect(duel.current().session?.turn).toBe('opponent');
    expect(duel.current().clearKey).toBe(1);
    expect(viewOf(duel.current()).found).toHaveLength(1);
    client.disconnect();
  });

  it('toasts a guess made on their turn', async () => {
    const client = createMockDuelClient(scripted());
    const duel = await reachMatch(client);
    const [first] = scriptedSquad();
    await guess(client, duel, first.name);
    expect(duel.current().session?.turn).toBe('opponent');

    await guess(client, duel, 'Anyone');
    const state = duel.current();
    expect(state.toast?.message).toBe('Wait for your turn.');
    expect(state.isGuessing).toBe(false);
    expect(state.phase).toBe('playing');
    client.disconnect();
  });

  it('locks once on the rate limiter and keeps the match going', async () => {
    const client = createMockDuelClient(scripted({ scenario: 'rateLimited' }));
    const duel = await reachMatch(client);

    await guess(client, duel, 'Anyone');
    const state = duel.current();
    expect(state.phase).toBe('playing');
    expect(state.failure).toBeNull();
    expect(state.isGuessing).toBe(false);
    expect(state.toast).toBeNull();
    expect(state.cooldownUntil).toBe(Date.now() + 2_000);
    expect(viewOf(state).input).toBe('cooldown');
    client.disconnect();
  });

  it('draws on all eleven, with lives untouched', async () => {
    const client = createMockDuelClient(scripted({ scenario: 'drawOnEleven' }));
    const duel = await reachMatch(client);
    // The scenario names all eleven on the next tick
    await vi.advanceTimersByTimeAsync(1);

    const { result } = duel.current();
    expect(result?.outcome).toBe('draw');
    expect(result?.found).toHaveLength(11);
    expect(result?.you.lives).toBe(MAX_LIVES);
    expect(result?.opponent.lives).toBe(MAX_LIVES);
  });

  it('ends on your forfeit as a loss', async () => {
    const client = createMockDuelClient(scripted());
    const duel = await reachMatch(client);

    duel.apply({ type: 'forfeiting' });
    await client.forfeit();

    const { result, phase } = duel.current();
    expect(phase).toBe('finished');
    expect(result?.outcome).toBe('loss');
    expect(result?.isForfeit).toBe(true);
  });

  it('shows their reconnect, then wins when the window closes', async () => {
    const client = createMockDuelClient(
      scripted({ scenario: 'opponentDisconnects' }),
    );
    const duel = await reachMatch(client);

    await vi.advanceTimersByTimeAsync(1_000);
    expect(viewOf(duel.current()).opponentConnection?.status).toBe(
      'reconnecting',
    );

    await vi.advanceTimersByTimeAsync(RECONNECT_WINDOW_MS);
    const state = duel.current();
    expect(state.result?.outcome).toBe('forfeit_win');
    expect(state.result?.isForfeit).toBe(true);
    expect(viewOf(state).opponentConnection).toBeNull();
  });

  it('offers solo on a timeout, then times out again', async () => {
    const client = createMockDuelClient({ scenario: 'queueTimeout' });
    const duel = drive(client);

    await client.enterQueue();
    await vi.advanceTimersByTimeAsync(QUEUE_WAIT_MS);
    expect(duel.current().phase).toBe('noOpponent');

    duel.apply({ type: 'started' });
    await client.enterQueue();
    expect(duel.current().phase).toBe('searching');
    await vi.advanceTimersByTimeAsync(QUEUE_WAIT_MS);
    expect(duel.current().phase).toBe('noOpponent');
  });

  it('resumes play once you reconnect', async () => {
    const client = createMockDuelClient(scripted({ scenario: 'youReconnect' }));
    const duel = await reachMatch(client);

    await vi.advanceTimersByTimeAsync(DISCONNECT_AFTER_MS);
    expect(viewOf(duel.current()).gate?.title).toBe('Reconnecting');
    expect(canGuess(duel.current())).toBe(false);

    await vi.advanceTimersByTimeAsync(RECONNECT_AFTER_MS);
    expect(viewOf(duel.current()).gate).toBeNull();
    expect(duel.current().phase).toBe('playing');
    client.disconnect();
  });

  it('ends as disconnected when you never come back', async () => {
    const client = createMockDuelClient(
      scripted({ scenario: 'youDisconnect' }),
    );
    const duel = await reachMatch(client);

    await vi.advanceTimersByTimeAsync(
      DISCONNECT_AFTER_MS + RECONNECT_WINDOW_MS,
    );
    const state = duel.current();
    expect(state.result?.outcome).toBe('loss');
    expect(state.result?.isForfeit).toBe(true);
    expect(viewOf(state).endReason).toBe('connectionLost');
  });

  it('refuses a guess locally while you reconnect', async () => {
    const client = createMockDuelClient(
      scripted({ scenario: 'youDisconnect' }),
    );
    const duel = await reachMatch(client);
    await vi.advanceTimersByTimeAsync(DISCONNECT_AFTER_MS);

    // What useDuel checks before sending
    expect(canGuess(duel.current())).toBe(false);
    expect(viewOf(duel.current()).input).toBe('locked');
    client.disconnect();
  });

  it('turns away an out-of-date build on connect', async () => {
    const client = createMockDuelClient(
      scripted({ scenario: 'protocolRefused' }),
    );
    const duel = drive(client);
    const result = await client.connect();
    if (result.success) throw new Error('Expected a refusal');
    duel.apply({ type: 'failed', step: 'connect', error: result.error });
    expect(duel.current().phase).toBe('refused');
  });

  it('widens filters that match nothing, then plays', async () => {
    const client = createMockDuelClient({ hitRate: 0 });
    const duel = drive(client);

    await client.enterQueue();
    await vi.advanceTimersByTimeAsync(QUEUE_WAIT_MS);
    duel.apply({ type: 'filtersOpened' });
    duel.apply({ type: 'locking' });
    const result = await client.submitFilters(NOTHING_FITS);
    if (result.success) throw new Error('Expected a refusal');
    duel.apply({ type: 'failed', step: 'lock', error: result.error });

    expect(result.error.emptyBecause).toBe('era');
    expect(viewOf(duel.current()).gate?.actionLabel).toBe(
      'Include every season',
    );
    expect(duelGateAction(duel.current())).toBe('widen');

    const widened = widenFilters(NOTHING_FITS, 'era', SAMPLE_FILTER_OPTIONS);
    if (!widened) throw new Error('Expected a wider set');
    duel.apply({ type: 'filtersWidened', filters: widened });
    duel.apply({ type: 'locking' });
    expect((await client.submitFilters(widened)).success).toBe(true);
    await vi.advanceTimersByTimeAsync(OPPONENT_FILTER_MS);
    expect(duel.current().phase).toBe('coinFlip');
    client.disconnect();
  });
});
