import type { GuessInputStatus } from '@/components/game/GuessInput';
import { MAX_LIVES } from '@/lib/api/schemas/game';
import { authErrorMessage } from '@/lib/auth';
import { guessFeedback } from '@/lib/feedback';
import { filterSummary, lobbyGate } from '@/lib/lobby';
import type { CanvasGateView, DuelCanvasView } from '@/types/canvas';
import type { DuelPlayer, DuelSession } from '@/types/duel';
import type { DuelLobbyView, FilterSummary } from '@/types/duel-lobby';
import type {
  DuelFailureStep,
  DuelGateAction,
  DuelSessionEvent,
  DuelSessionPhase,
  DuelSessionState,
} from '@/types/duel-session';
import type { Filters } from '@/types/filters';
import type { GuessResult } from '@/types/game';
import type { User } from '@/types/user';

// Both handles hold before the filter step
export const PAIRED_BEAT_MS = 1_200;

export const DUEL_GATE_COPY = {
  noMatch: 'No match found',
  changeFilters: 'Change filters',
  tryAgain: 'Try again',
} as const;

const FAILED_TITLES: Record<DuelFailureStep, string> = {
  connect: "Couldn't start the duel",
  queue: "Couldn't join the queue",
  lock: "Couldn't lock in your filters",
  match: "Couldn't set up the match",
  forfeit: "Couldn't forfeit the duel",
};

const NO_SUBMISSIONS = { yours: 'pending', theirs: 'pending' } as const;

export const INITIAL_DUEL_SESSION: DuelSessionState = {
  phase: 'connecting',
  filters: null,
  options: null,
  opponent: null,
  submission: NO_SUBMISSIONS,
  coinFlip: null,
  session: null,
  result: null,
  opponentConnection: null,
  isLocking: false,
  isGuessing: false,
  isForfeiting: false,
  failure: null,
  toast: null,
  shakeKey: 0,
  lifeLostKey: 0,
  clearKey: 0,
};

// A server error names the step it interrupted
function stepOf(phase: DuelSessionPhase): DuelFailureStep {
  switch (phase) {
    case 'connecting':
    case 'searching':
    case 'noOpponent':
      return 'queue';
    default:
      return 'match';
  }
}

// A match is on until the server sends the result
function isLive(state: DuelSessionState): boolean {
  return state.session !== null && state.result === null;
}

function withToast(state: DuelSessionState, message: string): DuelSessionState {
  return { ...state, toast: { id: (state.toast?.id ?? 0) + 1, message } };
}

function applySession(
  state: DuelSessionState,
  session: DuelSession,
): DuelSessionState {
  if (!isLive(state)) return state;
  return {
    ...state,
    session,
    // A handover ends any guess still in flight
    isGuessing: session.turn === 'you' ? state.isGuessing : false,
  };
}

function resolveGuess(
  state: DuelSessionState,
  result: GuessResult,
): DuelSessionState {
  if (!isLive(state)) return state;

  const feedback = guessFeedback(result);
  let next: DuelSessionState = {
    ...state,
    isGuessing: false,
    clearKey: state.clearKey + (feedback.clearInput ? 1 : 0),
  };
  if (feedback.toast) next = withToast(next, feedback.toast);
  if (feedback.shakeInput) next = { ...next, shakeKey: next.shakeKey + 1 };
  if (feedback.pulsePlayerId) {
    next = {
      ...next,
      pulse: {
        playerId: feedback.pulsePlayerId,
        key: (state.pulse?.key ?? 0) + 1,
      },
    };
  }
  return next;
}

type LobbyEvent = Extract<
  DuelSessionEvent,
  {
    type:
      | 'started'
      | 'prepared'
      | 'queued'
      | 'queueTimedOut'
      | 'paired'
      | 'filtersOpened'
      | 'filtersUpdated'
      | 'locking'
      | 'coinFlip'
      | 'matchReady';
  }
>;

function lobbyReducer(
  state: DuelSessionState,
  event: LobbyEvent,
): DuelSessionState {
  switch (event.type) {
    case 'started':
      return {
        ...INITIAL_DUEL_SESSION,
        filters: state.filters,
        options: state.options,
      };
    case 'prepared':
      return { ...state, filters: event.filters, options: event.options };
    case 'queued':
      return {
        ...INITIAL_DUEL_SESSION,
        phase: 'searching',
        filters: state.filters,
        options: state.options,
      };
    case 'queueTimedOut':
      return { ...state, phase: 'noOpponent' };
    case 'paired':
      return { ...state, phase: 'paired', opponent: event.opponent };
    case 'filtersOpened':
      return state.phase === 'paired' ? { ...state, phase: 'filters' } : state;
    case 'filtersUpdated': {
      const isOpen = state.phase === 'paired' || state.phase === 'filters';
      return {
        ...state,
        phase: isOpen ? 'filters' : state.phase,
        submission: event.submission,
        isLocking:
          event.submission.yours === 'submitted' ? false : state.isLocking,
      };
    }
    case 'locking':
      // Also the retry after a failed lock
      return { ...state, phase: 'filters', isLocking: true, failure: null };
    case 'coinFlip':
      return {
        ...state,
        phase: 'coinFlip',
        coinFlip: event.result,
        isLocking: false,
      };
    case 'matchReady':
      return { ...state, phase: 'playing', session: event.session };
    default: {
      const unhandled: never = event;
      return unhandled;
    }
  }
}

export function duelSessionReducer(
  state: DuelSessionState,
  event: DuelSessionEvent,
): DuelSessionState {
  switch (event.type) {
    case 'roundStarted':
    case 'turnChanged':
      return applySession(state, event.session);
    case 'guessSubmitted':
      return isLive(state) ? { ...state, isGuessing: true } : state;
    case 'guessResolved':
      return resolveGuess(state, event.result);
    case 'guessFailed':
      if (!isLive(state)) return state;
      return withToast(
        { ...state, isGuessing: false },
        authErrorMessage(event.error),
      );
    case 'lifeLost':
      if (!isLive(state) || event.cue.who !== 'you') return state;
      return { ...state, lifeLostKey: state.lifeLostKey + 1 };
    case 'opponentConnection':
      if (!isLive(state)) return state;
      return {
        ...state,
        opponentConnection:
          event.connection.status === 'reconnecting' ? event.connection : null,
      };
    case 'forfeiting':
      // A retry after a failed forfeit resumes play
      return {
        ...state,
        phase: isLive(state) ? 'playing' : state.phase,
        isForfeiting: true,
        failure: null,
      };
    case 'finished':
      if (state.result) return state;
      return {
        ...state,
        phase: 'finished',
        result: event.result,
        isGuessing: false,
        isForfeiting: false,
        opponentConnection: null,
        failure: null,
      };
    case 'error':
      // Mid-match a server rejection is a toast, not a gate
      if (isLive(state)) {
        return withToast(
          { ...state, isGuessing: false },
          authErrorMessage(event.error),
        );
      }
      if (state.result) return state;
      return duelSessionReducer(state, {
        type: 'failed',
        step: stepOf(state.phase),
        error: event.error,
      });
    case 'failed':
      return {
        ...state,
        phase: 'failed',
        isLocking: false,
        isGuessing: false,
        isForfeiting: false,
        failure: { step: event.step, error: event.error },
      };
    case 'started':
    case 'prepared':
    case 'queued':
    case 'queueTimedOut':
    case 'paired':
    case 'filtersOpened':
    case 'filtersUpdated':
    case 'locking':
    case 'coinFlip':
    case 'matchReady':
      return lobbyReducer(state, event);
    default: {
      const unhandled: never = event;
      return unhandled;
    }
  }
}

export function canLockFilters(state: DuelSessionState): boolean {
  if (state.isLocking || state.filters === null) return false;
  if (state.failure?.step === 'lock') return true;
  return state.phase === 'filters' && state.submission.yours === 'pending';
}

export function canGuess(state: DuelSessionState): boolean {
  return (
    state.phase === 'playing' &&
    state.session?.turn === 'you' &&
    !state.isGuessing &&
    !state.isForfeiting
  );
}

// Open through a pending forfeit; the result shuts it
export function canConfirmForfeit(state: DuelSessionState): boolean {
  return state.phase === 'playing' && isLive(state);
}

// A failed forfeit can be tried again
export function canForfeit(state: DuelSessionState): boolean {
  if (!isLive(state) || state.isForfeiting) return false;
  return state.phase === 'playing' || state.failure?.step === 'forfeit';
}

// Before the session loads, the label still says who
export function youFrom(user: User | null): DuelPlayer {
  return {
    id: user?.id ?? 'you',
    handle: user?.handle ?? 'You',
    lives: MAX_LIVES,
  };
}

function summaryOf(state: DuelSessionState, filters: Filters): FilterSummary {
  return state.options ? filterSummary(filters, state.options) : [];
}

function lobbyOf(state: DuelSessionState): DuelLobbyView | null {
  const { opponent, coinFlip } = state;

  switch (state.phase) {
    case 'searching':
      return { step: 'searching' };
    case 'paired':
      return opponent ? { step: 'paired', opponent } : null;
    case 'filters':
      return {
        step: 'filters',
        yours: state.filters ? summaryOf(state, state.filters) : [],
        submission: state.submission,
        isLocking: state.isLocking,
      };
    case 'coinFlip':
      if (!opponent || !coinFlip) return null;
      return {
        step: 'coinFlip',
        winner: coinFlip.winner,
        applied: summaryOf(state, coinFlip.filters),
        opponent,
      };
    case 'noOpponent':
      return { step: 'noOpponent' };
    default:
      return null;
  }
}

export function duelGateAction(state: DuelSessionState): DuelGateAction | null {
  if (state.phase !== 'failed') return null;
  return state.failure?.error.code === 'empty_pool' ? 'leave' : 'retry';
}

function failedGate(state: DuelSessionState): CanvasGateView | null {
  const { failure } = state;
  if (!failure) return null;

  if (failure.error.code === 'empty_pool') {
    return {
      title: DUEL_GATE_COPY.noMatch,
      detail: failure.error.message,
      actionLabel: DUEL_GATE_COPY.changeFilters,
    };
  }

  return {
    title: FAILED_TITLES[failure.step],
    detail: authErrorMessage(failure.error),
    actionLabel: DUEL_GATE_COPY.tryAgain,
  };
}

function inputOf(state: DuelSessionState): GuessInputStatus {
  if (state.phase !== 'playing' || state.session?.turn !== 'you') {
    return 'locked';
  }
  if (state.isForfeiting) return 'locked';
  return state.isGuessing ? 'pending' : 'live';
}

export function duelCanvasView(
  state: DuelSessionState,
  you: DuelPlayer,
): DuelCanvasView {
  const { session, result } = state;
  const lobby = lobbyOf(state);
  const round = result ? null : (session?.round ?? null);

  return {
    mode: 'duel',
    match: session?.match ?? null,
    found: result?.found ?? session?.found ?? [],
    clock: { round, isFrozen: false },
    input: inputOf(state),
    toast: state.toast,
    pulse: state.pulse,
    shakeKey: state.shakeKey,
    lifeLostKey: state.lifeLostKey,
    gate: lobby ? lobbyGate(lobby) : failedGate(state),
    you: result?.you ?? session?.you ?? you,
    opponent: result?.opponent ?? session?.opponent ?? state.opponent,
    turn: result ? null : (session?.turn ?? null),
    lobby,
    opponentConnection: result ? null : state.opponentConnection,
    end: result,
  };
}
