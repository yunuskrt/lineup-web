import { describe, expect, it } from 'vitest';
import { FEEDBACK_MESSAGES } from '@/lib/feedback';
import { PRACTICE_QUIT_COPY } from '@/lib/practice';
import {
  canGuessSolo,
  INITIAL_SOLO_RUN,
  needsResync,
  openRunUpdate,
  receiptRoundOf,
  SOLO_GATE_COPY,
  soloCanvasView,
  soloGateAction,
  soloQuitCopy,
  soloRunReducer,
} from '@/lib/solo-run';
import type { ApiError, EmptyPoolReason } from '@/types/api';
import type { Lives } from '@/types/game';
import type { RevealedPlayer } from '@/types/player';
import type { SoloMatchOffer, SoloSession, SoloSummary } from '@/types/solo';
import type { SoloRunEvent, SoloRunState } from '@/types/solo-run';

const ROUND = { startedAt: 1_000, endsAt: 16_000 };
const NEXT_ROUND = { startedAt: 16_400, endsAt: 31_400 };

const HOME = { id: 'club-a', name: 'Aston', shortName: 'AST', crestUrl: null };
const AWAY = {
  id: 'club-b',
  name: 'Borough',
  shortName: 'BOR',
  crestUrl: null,
};

const OFFER: SoloMatchOffer = {
  sessionId: 'session-1',
  match: {
    id: 'match-1',
    competition: {
      id: 'comp-1',
      kind: 'league',
      name: 'Premier Division',
      logoUrl: null,
    },
    season: '2004-05',
    date: '2005-05-01',
    stage: null,
    home: HOME,
    away: AWAY,
    score: { home: 1, away: 0 },
    nickname: null,
  },
  home: HOME,
  away: AWAY,
};

function player(slot: number): RevealedPlayer {
  return {
    id: `player-${slot}`,
    name: `Player ${slot}`,
    slot,
    position: 'MF',
    imageUrl: null,
    directoryKey: `player-${slot}`.padEnd(22, 'x'),
  };
}

function session(overrides: Partial<SoloSession> = {}): SoloSession {
  return {
    sessionId: 'session-1',
    status: 'active',
    practice: false,
    match: {
      id: 'match-1',
      competition: {
        id: 'comp-1',
        kind: 'league',
        name: 'Premier Division',
        logoUrl: null,
      },
      season: '2004-05',
      date: '2005-05-01',
      stage: null,
      home: OFFER.home,
      away: OFFER.away,
      score: { home: 1, away: 0 },
      nickname: null,
      side: 'home',
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

// End-of-game lists carry the naming order and time
function named<T extends object>(players: T[]) {
  return players.map((player, index) => ({
    ...player,
    order: index + 1,
    elapsedMs: 1_000 * (index + 1),
  }));
}

function summary(overrides: Partial<SoloSummary> = {}): SoloSummary {
  return {
    practice: false,
    match: {
      id: 'match-1',
      competition: {
        id: 'cup',
        kind: 'ucl',
        name: 'Continental Cup',
        logoUrl: null,
      },
      season: '2004-05',
      date: '2005-05-25',
      stage: 'Final',
      home: OFFER.home,
      away: OFFER.away,
      score: { home: 3, away: 3 },
      nickname: null,
    },
    found: named(ALL_FOUND.slice(0, 4)),
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

const AT = 1_700_000_000_000;

const CHOSEN: SoloRunEvent = { type: 'sideChosen' };

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
    expect(
      run(...PLAYING, { type: 'finding', matchId: null, practice: false }),
    ).toEqual(INITIAL_SOLO_RUN);
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
    const offline = run(
      ...PLAYING,
      { type: 'guessSubmitted' },
      { type: 'guessFailed', error: NETWORK, at: AT },
    );
    expect(offline.isGuessing).toBe(false);
    expect(offline.toast).not.toBeNull();

    const over = run(
      ...PLAYING,
      { type: 'guessSubmitted' },
      {
        type: 'guessFailed',
        error: { ...RATE_LIMITED, code: 'session_over', retryAfterMs: null },
        at: AT,
      },
    );
    expect(over.toast).toBeNull();
  });

  it.each([
    ['not_found', 'That run no longer exists.'],
    ['unauthorized', 'Sign in or continue as a guest first.'],
  ] as const)('ends the run screen when a guess finds %s', (code, message) => {
    const gone = run(
      ...PLAYING,
      { type: 'guessSubmitted' },
      {
        type: 'guessFailed',
        error: { code, message, retryAfterMs: null },
        at: AT,
      },
    );

    expect(gone.phase).toBe('failed');
    expect(gone.failure?.step).toBe('guess');
    expect(gone.isGuessing).toBe(false);
    expect(gone.toast).toBeNull();
    expect(canGuessSolo(gone)).toBe(false);
    expect(soloGateAction(gone)).toBe('leave');
    expect(soloCanvasView(gone).gate).toEqual({
      title: "Couldn't send your guess",
      detail: message,
      actionLabel: SOLO_GATE_COPY.backToFilters,
    });
  });

  it('keeps the run live after a guess the server refused as input', () => {
    const refused = run(
      ...PLAYING,
      { type: 'guessSubmitted' },
      {
        type: 'guessFailed',
        error: {
          code: 'invalid_input',
          message: 'Too long.',
          retryAfterMs: null,
        },
        at: AT,
      },
    );
    expect(refused.phase).toBe('playing');
    expect(refused.toast?.message).toBe('Too long.');
    expect(canGuessSolo(refused)).toBe(true);
  });
});

describe('soloRunReducer rate limit', () => {
  const limited = () =>
    run(
      ...PLAYING,
      { type: 'guessSubmitted' },
      { type: 'guessFailed', error: RATE_LIMITED, at: AT },
    );

  it('locks the input until the server retry time, with no toast', () => {
    const state = limited();
    expect(state.cooldownUntil).toBe(AT + 2_000);
    expect(state.toast).toBeNull();

    const view = soloCanvasView(state);
    expect(view.input).toBe('cooldown');
    expect(view.cooldownUntil).toBe(AT + 2_000);
    expect(canGuessSolo(state)).toBe(false);
  });

  it('keeps the clock running through the lockout', () => {
    expect(soloCanvasView(limited()).clock).toEqual(
      soloCanvasView(run(...PLAYING)).clock,
    );
  });

  it('goes live again once the lockout ends', () => {
    const state = soloRunReducer(limited(), { type: 'cooldownEnded' });
    expect(state.cooldownUntil).toBeNull();
    expect(soloCanvasView(state).input).toBe('live');
    expect(canGuessSolo(state)).toBe(true);
  });

  it('starts a new run without the old lockout', () => {
    const state = soloRunReducer(limited(), {
      type: 'finding',
      matchId: null,
      practice: false,
    });
    expect(state.cooldownUntil).toBeNull();
  });

  it('refuses a guess while one is still pending', () => {
    expect(canGuessSolo(run(...PLAYING, { type: 'guessSubmitted' }))).toBe(
      false,
    );
  });

  it('locks for a second when the server gives no time', () => {
    const state = run(...PLAYING, {
      type: 'guessFailed',
      error: { ...RATE_LIMITED, retryAfterMs: null },
      at: AT,
    });
    expect(state.cooldownUntil).toBe(AT + 1_000);
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

describe('receiptRoundOf', () => {
  it('takes the next round from a correct new name', () => {
    const response = {
      result: { outcome: 'correct_new' as const, player: player(3) },
      session: session({ round: NEXT_ROUND }),
    };
    expect(receiptRoundOf(response)).toEqual(NEXT_ROUND);
  });

  it('has no round once the XI is complete', () => {
    const response = {
      result: { outcome: 'correct_new' as const, player: player(10) },
      session: session({ status: 'over', round: null }),
    };
    expect(receiptRoundOf(response)).toBeNull();
  });

  // Their round started earlier: a sample would skew
  it('ignores the running round on any other outcome', () => {
    const repeat = {
      result: { outcome: 'already_found' as const, playerId: 'player-3' },
      session: session(),
    };
    const miss = {
      result: { outcome: 'not_in_xi' as const },
      session: session(),
    };
    expect(receiptRoundOf(repeat)).toBeNull();
    expect(receiptRoundOf(miss)).toBeNull();
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

  it("gates the side pick with the offer's match", () => {
    const state = run(PLAYING[0]);
    expect(soloCanvasView(state).gate).toEqual({
      ...SOLO_GATE_COPY.choose,
      sidePick: { match: OFFER.match, isChoosing: false },
    });
    expect(soloGateAction(state)).toBe('choose');
  });

  it('reads busy from the pick until the server answers', () => {
    const choosing = run(PLAYING[0], CHOSEN);
    expect(soloCanvasView(choosing).gate?.sidePick?.isChoosing).toBe(true);
    expect(soloGateAction(choosing)).toBe('choose');
    expect(run(PLAYING[0], CHOSEN, PLAYING[1]).isChoosing).toBe(false);
  });

  it('clears the busy pick when it fails, so a retry can pick', () => {
    const failed = run(PLAYING[0], CHOSEN, {
      type: 'failed',
      step: 'choose',
      error: NETWORK,
    });
    expect(failed.isChoosing).toBe(false);
    const retried = soloRunReducer(failed, { type: 'retried' });
    expect(soloCanvasView(retried).gate?.sidePick?.isChoosing).toBe(false);
  });

  it('opens no gate while finding or playing', () => {
    expect(soloCanvasView(run()).gate).toBeNull();
    expect(soloCanvasView(run(...PLAYING)).gate).toBeNull();
    expect(soloGateAction(run(...PLAYING))).toBeNull();
  });

  function emptyPool(emptyBecause?: EmptyPoolReason) {
    return run({
      type: 'failed',
      step: 'find',
      error: {
        code: 'empty_pool',
        message: 'No club matches.',
        retryAfterMs: null,
        emptyBecause,
      },
    });
  }

  it('offers to widen the filter the server blamed', () => {
    const state = emptyPool('club');
    expect(soloCanvasView(state).gate).toEqual({
      title: 'No match for those clubs',
      detail: 'No club matches.',
      actionLabel: 'Include every club',
      secondaryActionLabel: 'Change filters',
    });
    expect(soloGateAction(state)).toBe('widen');
  });

  it.each([undefined, 'combination'] as const)(
    'sends an empty pool back to the filters when blamed on %s',
    (reason) => {
      const state = emptyPool(reason);
      expect(soloCanvasView(state).gate).toEqual({
        title: 'No match for these filters together',
        detail: 'No club matches.',
        actionLabel: 'Change filters',
      });
      expect(soloGateAction(state)).toBe('leave');
    },
  );

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

  describe('the daily cap', () => {
    const CAP: ApiError = {
      code: 'forbidden',
      message: "You've played your 5 solo runs today. Duels are unlimited.",
      retryAfterMs: 3_600_000,
      reason: 'daily_cap',
    };
    const CAP_LINE = "You've played your 5 solo runs today. More at 01:00.";

    it.each(['find', 'choose'] as const)(
      'offers a duel, the filters and Pro when %s is capped',
      (step) => {
        const state = run(...(step === 'choose' ? [PLAYING[0]] : []), {
          type: 'failed',
          step,
          error: CAP,
        });
        expect(soloCanvasView(state, CAP_LINE).gate).toEqual({
          title: 'No solo runs left today',
          detail: CAP_LINE,
          actionLabel: 'Play a duel',
          secondaryActionLabel: 'Back to play',
          seePro: true,
        });
        expect(soloGateAction(state)).toBe('playDuel');
      },
    );

    it("falls back to the server's message before the allowance", () => {
      const state = run({ type: 'failed', step: 'find', error: CAP });
      expect(soloCanvasView(state).gate?.detail).toBe(CAP.message);
    });

    it('keeps other forbidden refusals on the old gate', () => {
      const state = run({
        type: 'failed',
        step: 'find',
        error: { ...CAP, reason: undefined, message: 'No.' },
      });
      expect(soloCanvasView(state).gate?.title).toBe("Couldn't find a match");
      expect(soloGateAction(state)).toBe('retry');
    });

    it('carries the cap line to the summary only when given', () => {
      const over = run(...PLAYING, OVER, received(summary()));
      expect(soloCanvasView(over, CAP_LINE).capLine).toBe(CAP_LINE);
      expect(soloCanvasView(over).capLine).toBeUndefined();
    });
  });

  describe('practice', () => {
    const PRACTISING: SoloRunEvent = {
      type: 'finding',
      matchId: null,
      practice: true,
    };
    const PRACTICE_PLAYING: SoloRunEvent[] = [
      { type: 'offerReceived', offer: OFFER },
      {
        type: 'sessionReceived',
        session: session({ practice: true, round: null }),
      },
    ];

    it('draws the ask until the session answers', () => {
      expect(soloCanvasView(run(PRACTISING)).isPractice).toBe(true);
      const offered = run(PRACTISING, { type: 'offerReceived', offer: OFFER });
      expect(soloCanvasView(offered).isPractice).toBe(true);
      const state = run(PRACTISING, ...PRACTICE_PLAYING);
      expect(soloCanvasView(state).isPractice).toBe(true);
      expect(soloCanvasView(state).input).toBe('live');
      expect(soloCanvasView(run(...PLAYING)).isPractice).toBe(false);
    });

    it('puts the ring back when the session says no', () => {
      const state = run(PRACTISING, ...PLAYING);
      expect(soloCanvasView(state).isPractice).toBe(false);
    });

    it('takes the quit words from the session', () => {
      expect(soloQuitCopy(run(PRACTISING, ...PRACTICE_PLAYING))).toBe(
        PRACTICE_QUIT_COPY,
      );
      expect(soloQuitCopy(run(PRACTISING))).toBeUndefined();
      expect(soloQuitCopy(run(PRACTISING, ...PLAYING))).toBeUndefined();
    });

    it('marks a practice summary as practice', () => {
      const state = run(
        PRACTISING,
        ...PRACTICE_PLAYING,
        received(summary({ practice: true, endReason: 'quit' })),
      );
      expect(soloCanvasView(state).isPractice).toBe(true);
    });

    it('locks practice for Free with its own words', () => {
      const state = run(PRACTISING, {
        type: 'failed',
        step: 'find',
        error: {
          code: 'forbidden',
          message: 'Practice needs Pro.',
          retryAfterMs: null,
          reason: 'pro_required',
        },
      });
      expect(soloCanvasView(state).gate).toEqual({
        title: 'Practice is part of Pro',
        detail: 'A timed run from your filters is still free.',
        actionLabel: 'Back to play',
        seePro: true,
      });
      expect(soloGateAction(state)).toBe('leave');
      expect(soloCanvasView(state).isPractice).toBe(false);
    });

    it('says a practice run closed after the idle drop', () => {
      const state = run(PRACTISING, ...PRACTICE_PLAYING, {
        type: 'failed',
        step: 'guess',
        error: {
          code: 'not_found',
          message: 'That run no longer exists.',
          retryAfterMs: null,
        },
      });
      expect(soloCanvasView(state).gate).toEqual({
        title: 'This practice run has closed',
        detail: 'Practice runs close after 30 minutes without a guess.',
        actionLabel: 'Back to play',
      });
      expect(soloGateAction(state)).toBe('leave');
    });

    it('marks only a timed run in play for the warning', () => {
      expect(openRunUpdate(run(...PLAYING))).toBe('mark');
      expect(openRunUpdate(run(PRACTISING, ...PRACTICE_PLAYING))).toBeNull();
      expect(openRunUpdate(run(...PLAYING, OVER))).toBe('clear');
      expect(openRunUpdate(run(PLAYING[0]))).toBeNull();
    });

    it('clears it when the run is gone, keeps it on a blip', () => {
      const gone = run(...PLAYING, {
        type: 'failed',
        step: 'sync',
        error: { code: 'not_found', message: 'Gone.', retryAfterMs: null },
      });
      expect(openRunUpdate(gone)).toBe('clear');
      const blip = run(...PLAYING, {
        type: 'failed',
        step: 'sync',
        error: { code: 'network', message: 'offline', retryAfterMs: null },
      });
      expect(openRunUpdate(blip)).toBeNull();
    });

    it('never asks to sync: the session has no round', () => {
      const state = run(PRACTISING, ...PRACTICE_PLAYING);
      expect(state.session?.round).toBeNull();
      expect(soloCanvasView(state).clock.round).toBeNull();
    });
  });

  describe('a picked match', () => {
    const PICKED: SoloRunEvent = {
      type: 'finding',
      matchId: 'match-1',
      practice: false,
    };

    it('remembers the pick for the summary', () => {
      const state = run(PICKED, ...PLAYING, OVER);
      expect(state.pickedMatchId).toBe('match-1');
      expect(soloCanvasView(state).isPicked).toBe(true);
      expect(soloCanvasView(run(...PLAYING)).isPicked).toBe(false);
    });

    it('sets the pick afresh on every new run', () => {
      const random: SoloRunEvent = {
        type: 'finding',
        matchId: null,
        practice: false,
      };
      const again = run(PICKED, ...PLAYING, OVER, PICKED);
      expect(again.pickedMatchId).toBe('match-1');
      expect(again.phase).toBe('finding');
      expect(again.session).toBeNull();
      expect(run(PICKED, ...PLAYING, OVER, random).pickedMatchId).toBeNull();
    });

    it('sends a match that left the game back to the archive', () => {
      const state = run(PICKED, {
        type: 'failed',
        step: 'find',
        error: {
          code: 'not_found',
          message: "That match isn't in the game.",
          retryAfterMs: null,
        },
      });
      expect(soloCanvasView(state).gate).toEqual({
        title: "That match isn't in the game any more",
        detail: 'Pick another one from the archive.',
        actionLabel: 'Back to the archive',
      });
      expect(soloGateAction(state)).toBe('backToArchive');
    });

    it('locks a pick for Free with Back to play and See Pro', () => {
      const state = run(PICKED, {
        type: 'failed',
        step: 'find',
        error: {
          code: 'forbidden',
          message: 'Picking a match needs Pro.',
          retryAfterMs: null,
          reason: 'pro_required',
        },
      });
      expect(soloCanvasView(state).gate).toEqual({
        title: 'Picking a match is part of Pro',
        detail: 'A random match from your filters is still free.',
        actionLabel: 'Back to play',
        seePro: true,
      });
      expect(soloGateAction(state)).toBe('leave');
    });

    it("keeps a random run's not_found on the old gate", () => {
      const state = run({
        type: 'failed',
        step: 'find',
        error: { code: 'not_found', message: 'Gone.', retryAfterMs: null },
      });
      expect(soloCanvasView(state).gate?.actionLabel).toBe(
        SOLO_GATE_COPY.backToFilters,
      );
      expect(soloGateAction(state)).toBe('leave');
    });
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
    const value = summary({
      livesRemaining: 1,
      found: named(ALL_FOUND.slice(0, 5)),
    });
    const view = soloCanvasView(run(...PLAYING, OVER, received(value)));
    expect(view.end).toEqual({
      status: 'ready',
      summary: value,
      isMissedRevealed: false,
    });
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
      isMissedRevealed: false,
    });
  });

  describe('revealing the missed XI', () => {
    const REVEAL: SoloRunEvent = { type: 'missedRevealed' };
    const MISSED = ALL_FOUND.slice(4);
    const pro = summary({ missed: MISSED });

    it('reveals once a Pro summary is in', () => {
      const state = run(...PLAYING, OVER, received(pro), REVEAL);
      expect(state.isMissedRevealed).toBe(true);
      const end = soloCanvasView(state).end;
      expect(end?.status === 'ready' && end.isMissedRevealed).toBe(true);
    });

    it('stays hidden until the player asks', () => {
      const end = soloCanvasView(run(...PLAYING, OVER, received(pro))).end;
      expect(end?.status === 'ready' && end.isMissedRevealed).toBe(false);
    });

    // Free gets null: there is nothing to show
    it('ignores a reveal with no missed list', () => {
      const free = run(...PLAYING, OVER, received(summary()), REVEAL);
      expect(free.isMissedRevealed).toBe(false);
    });

    it('ignores a reveal before the run is over', () => {
      expect(run(...PLAYING, REVEAL).isMissedRevealed).toBe(false);
      expect(run(...PLAYING, OVER, REVEAL).isMissedRevealed).toBe(false);
    });

    it('starts the next run hidden', () => {
      const revealed = run(...PLAYING, OVER, received(pro), REVEAL);
      const next = soloRunReducer(revealed, {
        type: 'finding',
        matchId: null,
        practice: false,
      });
      expect(next.isMissedRevealed).toBe(false);
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
    const again = soloRunReducer(over, {
      type: 'finding',
      matchId: null,
      practice: false,
    });
    expect(again).toEqual(INITIAL_SOLO_RUN);
    expect(soloCanvasView(again).end).toBeNull();
  });
});
