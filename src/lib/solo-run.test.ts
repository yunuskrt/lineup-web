import { describe, expect, it } from 'vitest';
import { FEEDBACK_MESSAGES } from '@/lib/feedback';
import {
  INITIAL_SOLO_RUN,
  needsResync,
  SOLO_GATE_COPY,
  soloCanvasView,
  soloGateAction,
  soloRunReducer,
} from '@/lib/solo-run';
import type { ApiError } from '@/types/api';
import type { Lives } from '@/types/game';
import type { RevealedPlayer } from '@/types/player';
import type { SoloMatchOffer, SoloSession, SoloSummary } from '@/types/solo';
import type { SoloRunEvent, SoloRunState } from '@/types/solo-run';

const ROUND = { startedAt: 1_000, endsAt: 16_000 };
const NEXT_ROUND = { startedAt: 16_400, endsAt: 31_400 };

const OFFER: SoloMatchOffer = {
  sessionId: 'session-1',
  home: { id: 'club-a', name: 'Aston', shortName: 'AST', crestUrl: null },
  away: { id: 'club-b', name: 'Borough', shortName: 'BOR', crestUrl: null },
};

function player(slot: number): RevealedPlayer {
  return {
    id: `player-${slot}`,
    name: `Player ${slot}`,
    slot,
    position: 'MF',
    imageUrl: null,
  };
}

function session(overrides: Partial<SoloSession> = {}): SoloSession {
  return {
    sessionId: 'session-1',
    status: 'active',
    match: {
      id: 'match-1',
      side: 'home',
      team: OFFER.home,
      formation: '4-4-2',
    },
    lives: 3,
    found: [],
    round: ROUND,
    ...overrides,
  };
}

function run(...events: SoloRunEvent[]): SoloRunState {
  return events.reduce(soloRunReducer, INITIAL_SOLO_RUN);
}

const PLAYING: SoloRunEvent[] = [
  { type: 'offerReceived', offer: OFFER },
  { type: 'sessionReceived', session: session() },
];

const ALL_FOUND = Array.from({ length: 11 }, (_, slot) => player(slot));

const OVER: SoloRunEvent = {
  type: 'synced',
  session: session({
    status: 'over',
    lives: 0,
    found: ALL_FOUND.slice(0, 4),
    round: null,
  }),
};

function summary(overrides: Partial<SoloSummary> = {}): SoloSummary {
  return {
    match: {
      id: 'match-1',
      competition: { id: 'cup', kind: 'ucl', name: 'Continental Cup' },
      season: '2004-05',
      date: '2005-05-25',
      stage: 'Final',
      home: OFFER.home,
      away: OFFER.away,
      score: { home: 3, away: 3 },
      nickname: null,
    },
    found: ALL_FOUND.slice(0, 4),
    missedCount: 7,
    missed: null,
    livesRemaining: 0,
    endReason: 'lives_out',
    accuracy: 0.5,
    bestStreak: 2,
    roundTimesMs: [4_000, 15_000],
    ...overrides,
  };
}

function received(value: SoloSummary, sessionId = 'session-1'): SoloRunEvent {
  return { type: 'summaryReceived', sessionId, summary: value };
}

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

describe('soloRunReducer phases', () => {
  it('moves from finding to choosing to playing', () => {
    expect(run().phase).toBe('finding');
    expect(run(PLAYING[0]).phase).toBe('choosing');
    expect(run(...PLAYING).phase).toBe('playing');
  });

  it('ends the run when a guess response is over', () => {
    const over = session({ status: 'over', round: null });
    const state = run(
      ...PLAYING,
      { type: 'guessSubmitted' },
      {
        type: 'guessResolved',
        response: { result: { outcome: 'not_in_xi' }, session: over },
      },
    );
    expect(state.phase).toBe('over');
    expect(state.isGuessing).toBe(false);
  });

  it('ends the run when a sync is over', () => {
    const over = session({ status: 'over', lives: 0, round: null });
    expect(run(...PLAYING, { type: 'synced', session: over }).phase).toBe(
      'over',
    );
  });

  it('returns to the step a failure interrupted', () => {
    const error: ApiError = { ...RATE_LIMITED, code: 'server_error' };
    const choose = run(PLAYING[0], { type: 'failed', step: 'choose', error });
    expect(choose.phase).toBe('failed');
    expect(soloRunReducer(choose, { type: 'retried' }).phase).toBe('choosing');

    const sync = run(...PLAYING, { type: 'failed', step: 'sync', error });
    expect(soloRunReducer(sync, { type: 'retried' }).phase).toBe('playing');
  });

  it('goes back to finding when the find step failed', () => {
    const error: ApiError = { ...RATE_LIMITED, code: 'network' };
    const failed = run({ type: 'failed', step: 'find', error });
    expect(soloRunReducer(failed, { type: 'retried' }).phase).toBe('finding');
  });

  it('drops a guess in flight when a step fails', () => {
    const error: ApiError = { ...RATE_LIMITED, code: 'network' };
    const state = run(
      ...PLAYING,
      { type: 'guessSubmitted' },
      {
        type: 'failed',
        step: 'quit',
        error,
      },
    );
    expect(state.isGuessing).toBe(false);
    expect(state.failure).toEqual({ step: 'quit', error });
  });

  it('resumes play when a sync lands after a failure', () => {
    const error: ApiError = { ...RATE_LIMITED, code: 'network' };
    const state = run(
      ...PLAYING,
      { type: 'failed', step: 'sync', error },
      {
        type: 'synced',
        session: session({ round: NEXT_ROUND }),
      },
    );
    expect(state.phase).toBe('playing');
    expect(state.failure).toBeNull();
  });

  it('starts over when finding again', () => {
    expect(run(...PLAYING, { type: 'finding' })).toEqual(INITIAL_SOLO_RUN);
  });
});

describe('soloRunReducer guess feedback', () => {
  function resolved(result: SoloRunEvent & { type: 'guessResolved' }) {
    return run(...PLAYING, { type: 'guessSubmitted' }, result);
  }

  it('reveals a correct name with no toast, shake or pulse', () => {
    const found = [player(3)];
    const state = resolved({
      type: 'guessResolved',
      response: {
        result: { outcome: 'correct_new', player: player(3) },
        session: session({ found, round: NEXT_ROUND }),
      },
    });
    expect(state.session?.found).toEqual(found);
    expect(state.toast).toBeNull();
    expect(state.shakeKey).toBe(0);
    expect(state.pulse).toBeUndefined();
  });

  it('pulses the slot and toasts a repeat', () => {
    const state = resolved({
      type: 'guessResolved',
      response: {
        result: { outcome: 'already_found', playerId: 'player-3' },
        session: session({ found: [player(3)] }),
      },
    });
    expect(state.pulse).toEqual({ playerId: 'player-3', key: 1 });
    expect(state.toast?.message).toBe(FEEDBACK_MESSAGES.alreadyFound);
    expect(state.shakeKey).toBe(0);
  });

  it('shakes and toasts a name outside the XI', () => {
    const state = resolved({
      type: 'guessResolved',
      response: { result: { outcome: 'not_in_xi' }, session: session() },
    });
    expect(state.shakeKey).toBe(1);
    expect(state.toast?.message).toBe(FEEDBACK_MESSAGES.notInXi);
    expect(state.pulse).toBeUndefined();
  });

  it('gives each toast, shake and pulse a fresh key', () => {
    const miss: SoloRunEvent = {
      type: 'guessResolved',
      response: { result: { outcome: 'not_in_xi' }, session: session() },
    };
    const repeat: SoloRunEvent = {
      type: 'guessResolved',
      response: {
        result: { outcome: 'already_found', playerId: 'player-3' },
        session: session({ found: [player(3)] }),
      },
    };
    const state = run(...PLAYING, miss, miss, repeat, repeat);
    expect(state.toast?.id).toBe(4);
    expect(state.shakeKey).toBe(2);
    expect(state.pulse).toEqual({ playerId: 'player-3', key: 2 });
  });

  it('toasts a rejected guess but not one the server says is over', () => {
    const limited = run(
      ...PLAYING,
      { type: 'guessSubmitted' },
      {
        type: 'guessFailed',
        error: RATE_LIMITED,
      },
    );
    expect(limited.isGuessing).toBe(false);
    expect(limited.toast?.message).toBe(
      'Too many attempts. Try again in 2 seconds.',
    );

    const over = run(
      ...PLAYING,
      { type: 'guessSubmitted' },
      {
        type: 'guessFailed',
        error: { ...RATE_LIMITED, code: 'session_over', retryAfterMs: null },
      },
    );
    expect(over.toast).toBeNull();
  });
});

describe('soloRunReducer lives', () => {
  function synced(lives: Lives): SoloRunEvent {
    return { type: 'synced', session: session({ lives, round: NEXT_ROUND }) };
  }

  it('flashes only when the server reports fewer lives', () => {
    expect(run(...PLAYING, synced(3)).lifeLostKey).toBe(0);
    expect(run(...PLAYING, synced(2)).lifeLostKey).toBe(1);
    expect(run(...PLAYING, synced(2), synced(2)).lifeLostKey).toBe(1);
    expect(run(...PLAYING, synced(2), synced(1)).lifeLostKey).toBe(2);
  });

  it('flashes when a guess response shows the server took a life', () => {
    const state = run(
      ...PLAYING,
      { type: 'guessSubmitted' },
      {
        type: 'guessResolved',
        response: {
          result: { outcome: 'not_in_xi' },
          session: session({ lives: 2, round: NEXT_ROUND }),
        },
      },
    );
    expect(state.lifeLostKey).toBe(1);
  });

  it('never flashes for the first session', () => {
    const state = run(PLAYING[0], {
      type: 'sessionReceived',
      session: session({ lives: 1 }),
    });
    expect(state.lifeLostKey).toBe(0);
  });
});

describe('needsResync', () => {
  it('asks again while the server still shows the same round', () => {
    expect(needsResync(ROUND, session())).toBe(true);
  });

  it('stops once a new round starts or the run is over', () => {
    expect(needsResync(ROUND, session({ round: NEXT_ROUND }))).toBe(false);
    expect(needsResync(ROUND, session({ status: 'over', round: null }))).toBe(
      false,
    );
  });
});

describe('soloCanvasView', () => {
  it('locks the input outside play and marks a guess in flight', () => {
    expect(soloCanvasView(run()).input).toBe('locked');
    expect(soloCanvasView(run(PLAYING[0])).input).toBe('locked');
    expect(soloCanvasView(run(...PLAYING)).input).toBe('live');
    expect(
      soloCanvasView(run(...PLAYING, { type: 'guessSubmitted' })).input,
    ).toBe('pending');
    expect(
      soloCanvasView(
        run(...PLAYING, {
          type: 'synced',
          session: session({ status: 'over', lives: 0, round: null }),
        }),
      ).input,
    ).toBe('locked');
  });

  it('shows the loading canvas until a side is chosen', () => {
    const view = soloCanvasView(run(PLAYING[0]));
    expect(view.match).toBeNull();
    expect(view.clock.round).toBeNull();
    expect(view.lives).toBe(3);
  });

  it('passes the server round straight through', () => {
    expect(soloCanvasView(run(...PLAYING)).clock).toEqual({
      round: ROUND,
      isFrozen: false,
    });
  });

  it('gates the side pick with one choice per club, home first', () => {
    const state = run(PLAYING[0]);
    expect(soloCanvasView(state).gate).toEqual({
      ...SOLO_GATE_COPY.choose,
      choices: [
        { id: 'home', label: 'Aston' },
        { id: 'away', label: 'Borough' },
      ],
    });
    expect(soloGateAction(state)).toBe('choose');
  });

  it('opens no gate while finding or playing', () => {
    expect(soloCanvasView(run()).gate).toBeNull();
    expect(soloCanvasView(run(...PLAYING)).gate).toBeNull();
    expect(soloGateAction(run(...PLAYING))).toBeNull();
  });

  it('sends an empty pool back to the filters', () => {
    const state = run({
      type: 'failed',
      step: 'find',
      error: {
        code: 'empty_pool',
        message: 'No club matches.',
        retryAfterMs: null,
      },
    });
    expect(soloCanvasView(state).gate).toEqual({
      title: SOLO_GATE_COPY.noMatch,
      detail: 'No club matches.',
      actionLabel: SOLO_GATE_COPY.changeFilters,
    });
    expect(soloGateAction(state)).toBe('leave');
  });

  it('offers a retry for failures a retry can fix', () => {
    const state = run(...PLAYING, {
      type: 'failed',
      step: 'sync',
      error: { code: 'network', message: 'offline', retryAfterMs: null },
    });
    const gate = soloCanvasView(state).gate;
    expect(gate?.actionLabel).toBe(SOLO_GATE_COPY.tryAgain);
    expect(gate?.detail).toMatch(/Check your connection/);
    expect(soloGateAction(state)).toBe('retry');
  });

  it('names the step that failed in the gate title', () => {
    const state = run(PLAYING[0], {
      type: 'failed',
      step: 'choose',
      error: { code: 'server_error', message: 'boom', retryAfterMs: null },
    });
    const gate = soloCanvasView(state).gate;
    expect(gate?.title).toBe("Couldn't start the run");
    expect(gate?.detail).not.toBe('boom');
    expect(soloGateAction(state)).toBe('retry');
  });

  it('sends a lost run back to the filters', () => {
    const state = run(...PLAYING, {
      type: 'failed',
      step: 'sync',
      error: {
        code: 'not_found',
        message: 'That run no longer exists.',
        retryAfterMs: null,
      },
    });
    expect(soloCanvasView(state).gate?.actionLabel).toBe(
      SOLO_GATE_COPY.backToFilters,
    );
    expect(soloGateAction(state)).toBe('leave');
  });
});

describe('the run summary', () => {
  it('shows the skeleton once the server ends the run', () => {
    const view = soloCanvasView(run(...PLAYING, OVER));
    expect(view.end).toEqual({ status: 'loading' });
    expect(view.gate).toBeNull();
    expect(view.input).toBe('locked');
  });

  it('opens no gate when the run is over', () => {
    const over = run(...PLAYING, OVER);
    expect(soloGateAction(over)).toBeNull();
    expect(soloGateAction(run(...PLAYING, OVER, received(summary())))).toBe(
      null,
    );
  });

  it('shows the summary once it arrives, trusting its numbers', () => {
    const value = summary({ livesRemaining: 1, found: ALL_FOUND.slice(0, 5) });
    const view = soloCanvasView(run(...PLAYING, OVER, received(value)));
    expect(view.end).toEqual({ status: 'ready', summary: value });
    expect(view.found).toBe(value.found);
    expect(view.lives).toBe(1);
    expect(view.gate).toBeNull();
  });

  it('ends a quit on the summary quit returned', () => {
    const quit = summary({ endReason: 'quit', livesRemaining: 2 });
    const state = run(...PLAYING, { type: 'quitting' }, received(quit));
    expect(state.phase).toBe('over');
    expect(state.isQuitting).toBe(false);
    expect(soloCanvasView(state).end).toEqual({
      status: 'ready',
      summary: quit,
    });
  });

  it('locks the input while a quit is in flight', () => {
    const state = run(...PLAYING, { type: 'quitting' });
    expect(state.isQuitting).toBe(true);
    expect(soloCanvasView(state).input).toBe('locked');
  });

  it('drops a failed quit back to a retry gate', () => {
    const state = run(
      ...PLAYING,
      { type: 'quitting' },
      {
        type: 'failed',
        step: 'quit',
        error: NETWORK,
      },
    );
    expect(state.isQuitting).toBe(false);
    expect(soloCanvasView(state).gate?.title).toBe("Couldn't end the run");
    expect(soloGateAction(state)).toBe('retry');
  });

  it('ignores a summary for a run it no longer holds', () => {
    const state = run(...PLAYING, OVER);
    expect(soloRunReducer(state, received(summary(), 'session-old'))).toBe(
      state,
    );
    const failed = soloRunReducer(state, {
      type: 'summaryFailed',
      sessionId: 'session-old',
      error: NETWORK,
    });
    expect(failed).toBe(state);
  });

  it('gates a failed summary over its skeleton, then retries', () => {
    const failed = run(...PLAYING, OVER, {
      type: 'summaryFailed',
      sessionId: 'session-1',
      error: NETWORK,
    });
    const view = soloCanvasView(failed);
    expect(view.gate?.title).toBe("Couldn't load the summary");
    expect(view.gate?.actionLabel).toBe(SOLO_GATE_COPY.tryAgain);
    expect(view.end).toEqual({ status: 'loading' });
    expect(soloGateAction(failed)).toBe('retry');

    const retried = soloRunReducer(failed, { type: 'retried' });
    expect(retried.phase).toBe('over');
    expect(soloCanvasView(retried).gate).toBeNull();
    expect(soloCanvasView(retried).end).toEqual({ status: 'loading' });
  });

  it('sends a lost run back to the filters from the summary', () => {
    const lost = run(...PLAYING, OVER, {
      type: 'summaryFailed',
      sessionId: 'session-1',
      error: {
        code: 'not_found',
        message: 'That run no longer exists.',
        retryAfterMs: null,
      },
    });
    expect(soloGateAction(lost)).toBe('leave');
    expect(soloCanvasView(lost).gate?.actionLabel).toBe(
      SOLO_GATE_COPY.backToFilters,
    );
  });

  it('settles a quit that races the clock on one summary', () => {
    const raced = run(...PLAYING, { type: 'quitting' }, OVER);
    expect(raced.phase).toBe('over');
    expect(soloCanvasView(raced).input).toBe('locked');
    expect(soloCanvasView(raced).end).toEqual({ status: 'loading' });

    const settled = soloRunReducer(raced, received(summary()));
    expect(settled.isQuitting).toBe(false);
    expect(soloCanvasView(settled).end?.status).toBe('ready');
  });

  it('starts over from finding on play again', () => {
    const over = run(...PLAYING, OVER, received(summary()));
    const again = soloRunReducer(over, { type: 'finding' });
    expect(again).toEqual(INITIAL_SOLO_RUN);
    expect(soloCanvasView(again).end).toBeNull();
  });
});
