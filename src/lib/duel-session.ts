import type { GuessInputStatus } from '@/components/game/GuessInput';
import { SQUAD_SIZE } from '@/lib/api/schemas/common';
import { MAX_LIVES } from '@/lib/api/schemas/game';
import { authErrorMessage } from '@/lib/auth';
import { isYourForfeit } from '@/lib/duel-result';
import { guessFeedback } from '@/lib/feedback';
import { filterSummary, lobbyGate } from '@/lib/lobby';
import {
  COOLDOWN_OVER_DETAIL,
  cooldownGateDetail,
  emptyPoolGate,
  heldCooldown,
  RECONNECTING_TITLE,
  reconnectingGate,
  widenReasonOf,
} from '@/lib/system-states';
import type { ApiError } from '@/types/api';
import type { CanvasGateView, DuelCanvasView } from '@/types/canvas';
import type {
  ConnectionState,
  DuelPlayer,
  DuelResult,
  DuelSession,
} from '@/types/duel';
import type { DuelLobbyView, FilterSummary } from '@/types/duel-lobby';
import type {
  AwayResult,
  DuelFailureStep,
  DuelGateAction,
  DuelSessionEvent,
  DuelSessionPhase,
  DuelSessionState,
} from '@/types/duel-session';
import type { Filters } from '@/types/filters';
import type { DuelOutcome, GuessResult } from '@/types/game';
import type { HistoryEntry } from '@/types/profile';
import type { User } from '@/types/user';

// Both handles hold before the filter step
export const PAIRED_BEAT_MS = 1_200;
// The server's window; display only
export const RECONNECT_WINDOW_MS = 20_000;
// `matchReady` follows the handshake at once
export const RESUME_WAIT_MS = 2_000;
// A duel is saved just after `finished`
export const AWAY_HISTORY_RETRY_MS = 1_000;
export const AWAY_HISTORY_LIMIT = 10;

export const DUEL_GATE_COPY = {
  tryAgain: 'Try again',
  searchAgain: 'Search again',
  calledOff: 'The match was called off',
  away: 'The duel ended while you were away',
  awayChecking: 'Checking the result…',
  // True too for a duel the server never finished
  awayUnknown: "We couldn't find its result in your history.",
  playAgain: 'Play again',
  viewProfile: 'View profile',
} as const;

const AWAY_OUTCOMES: Record<DuelOutcome, string> = {
  win: 'You won.',
  forfeit_win: 'You won: your opponent left.',
  loss: 'You lost.',
  draw: "It's a draw.",
};

// The room ends; only the opponent is told
const DROPPED_ROOM_ERROR: ApiError = {
  code: 'session_over',
  message: 'Your connection dropped before the match started.',
  retryAfterMs: null,
};

const FAILED_TITLES: Record<DuelFailureStep, string> = {
  connect: "Couldn't start the duel",
  queue: "Couldn't join the queue",
  lock: "Couldn't lock in your filters",
  match: "Couldn't set up the match",
  forfeit: "Couldn't forfeit the duel",
  connection: 'Duel connection closed',
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
  yourConnection: null,
  isConnectionLost: false,
  resume: null,
  isRequeueing: false,
  away: null,
  isLocking: false,
  isGuessing: false,
  isForfeiting: false,
  cooldownUntil: null,
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

// An old build is refused on any connect
function isRefusal(step: DuelFailureStep, error: ApiError): boolean {
  if (error.code !== 'protocol_refused') return false;
  return step === 'connect' || step === 'connection';
}

// A match is on until the server sends the result
function isLive(state: DuelSessionState): boolean {
  return (
    state.session !== null &&
    state.result === null &&
    state.phase !== 'endedAway'
  );
}

// Try again rejoins a duel, never the queue
export function canResume(state: DuelSessionState): boolean {
  // The seat was the lost session's; start fresh
  if (state.failure?.error.code === 'unauthorized') return false;
  return isLive(state);
}

function withToast(state: DuelSessionState, message: string): DuelSessionState {
  return { ...state, toast: { id: (state.toast?.id ?? 0) + 1, message } };
}

// A lockout speaks through the input, not a toast
function rejectGuess(
  state: DuelSessionState,
  error: ApiError,
  at: number,
): DuelSessionState {
  const next = { ...state, isGuessing: false };
  if (error.code !== 'rate_limited') {
    return withToast(next, authErrorMessage(error));
  }
  return {
    ...next,
    cooldownUntil: heldCooldown(state.cooldownUntil, error, at),
  };
}

function applyYourConnection(
  state: DuelSessionState,
  connection: ConnectionState,
): DuelSessionState {
  if (!isLive(state)) return state;
  switch (connection.status) {
    case 'reconnecting':
      return { ...state, yourConnection: connection, isGuessing: false };
    case 'connected':
      return { ...state, yourConnection: null };
    case 'forfeited':
      // Stays locked until the result arrives
      return { ...state, isConnectionLost: true };
  }
}

// Inferred until the result names why (B40)
function wasConnectionLost(
  state: DuelSessionState,
  result: DuelResult,
): boolean {
  if (!isYourForfeit(result) || state.isForfeiting) return false;
  return state.isConnectionLost || state.yourConnection !== null;
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

// Authoritative from any phase, a resume included
function applyMatchReady(
  state: DuelSessionState,
  session: DuelSession,
): DuelSessionState {
  if (state.result) return state;
  return {
    ...state,
    phase: 'playing',
    session,
    // A reloaded page never saw `paired`
    opponent: session.opponent,
    yourConnection: null,
    resume: null,
    isLocking: false,
    isGuessing: false,
    // A gate's wait never locks the input
    cooldownUntil: state.failure ? null : state.cooldownUntil,
    failure: null,
  };
}

// Only a return the page was waiting on
function applyRestored(state: DuelSessionState): DuelSessionState {
  if (isLive(state)) {
    if (state.resume === null && state.yourConnection === null) return state;
    return { ...state, resume: 'waiting' };
  }
  switch (state.phase) {
    case 'searching':
      return { ...state, isRequeueing: true };
    case 'paired':
    case 'filters':
    case 'coinFlip':
      return {
        ...state,
        phase: 'failed',
        isLocking: false,
        failure: { step: 'match', error: DROPPED_ROOM_ERROR },
      };
    default:
      return state;
  }
}

// No snapshot after the return: the duel is over
function applyResumeMissed(state: DuelSessionState): DuelSessionState {
  if (state.resume !== 'waiting' || !isLive(state)) return state;
  return {
    ...state,
    phase: 'endedAway',
    resume: null,
    yourConnection: null,
    opponentConnection: null,
    isGuessing: false,
    away: { status: 'checking' },
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
      | 'coinFlip';
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
    case 'matchReady':
      return applyMatchReady(state, event.session);
    case 'roundStarted':
    case 'turnChanged':
      return applySession(state, event.session);
    case 'guessSubmitted':
      return isLive(state) ? { ...state, isGuessing: true } : state;
    case 'guessResolved':
      return resolveGuess(state, event.result);
    case 'guessFailed':
      if (!isLive(state)) return state;
      return rejectGuess(state, event.error, event.at);
    case 'cooldownEnded':
      return { ...state, cooldownUntil: null };
    case 'filtersWidened':
      return { ...state, filters: event.filters };
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
    case 'disconnected':
      return applyYourConnection(state, event.connection);
    case 'connectionDropped':
      return applyYourConnection(state, {
        status: 'reconnecting',
        reconnectDeadline: event.deadline,
      });
    case 'connectionRestored':
      return applyRestored(state);
    case 'resuming':
      if (!isLive(state)) return state;
      return {
        ...state,
        phase: 'playing',
        failure: null,
        resume: 'connecting',
      };
    case 'resumeMissed':
      return applyResumeMissed(state);
    case 'awayResultRead':
      if (state.phase !== 'endedAway') return state;
      return { ...state, away: event.result };
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
        yourConnection: null,
        isConnectionLost: wasConnectionLost(state, event.result),
        cooldownUntil: null,
        failure: null,
      };
    case 'error':
      // Mid-match a server rejection is not a gate
      if (isLive(state)) return rejectGuess(state, event.error, event.at);
      if (state.result) return state;
      return duelSessionReducer(state, {
        type: 'failed',
        step: stepOf(state.phase),
        error: event.error,
        at: event.at,
      });
    case 'closed':
      // A finished duel keeps its result card
      if (state.result) return state;
      return duelSessionReducer(state, {
        type: 'failed',
        step: 'connection',
        error: event.error,
        at: event.at,
      });
    case 'failed':
      // A resumed duel answers before the queue does
      if (event.step === 'queue' && isLive(state)) return state;
      return {
        ...state,
        cooldownUntil:
          event.error.code === 'rate_limited'
            ? heldCooldown(state.cooldownUntil, event.error, event.at)
            : state.cooldownUntil,
        // The gate says why; nothing else waits
        yourConnection: null,
        resume: null,
        isRequeueing: false,
        phase: isRefusal(event.step, event.error) ? 'refused' : 'failed',
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
    !state.isForfeiting &&
    state.cooldownUntil === null &&
    state.yourConnection === null
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

// Held until a rate limit's wait is over
function isWaiting(state: DuelSessionState): boolean {
  return (
    state.failure?.error.code === 'rate_limited' && state.cooldownUntil !== null
  );
}

// The room ended before the match; search again
function isCalledOff(state: DuelSessionState): boolean {
  const { failure } = state;
  return (
    failure?.step === 'match' &&
    failure.error.code === 'session_over' &&
    state.session === null
  );
}

export function duelGateAction(state: DuelSessionState): DuelGateAction | null {
  if (state.phase === 'endedAway') {
    return state.away?.status === 'checking' ? null : 'playAgain';
  }
  if (state.phase !== 'failed' || !state.failure || isWaiting(state)) {
    return null;
  }
  const { error } = state.failure;
  if (canWidenLock(state) && widenReasonOf(error)) return 'widen';
  return error.code === 'empty_pool' ? 'leave' : 'retry';
}

// Only your own refused lock can be widened
function canWidenLock(state: DuelSessionState): boolean {
  return state.failure?.step === 'lock';
}

// Try again only once the server's wait is over
function rateLimitedGate(title: string, until: number | null): CanvasGateView {
  if (until === null) {
    return {
      title,
      detail: COOLDOWN_OVER_DETAIL,
      actionLabel: DUEL_GATE_COPY.tryAgain,
    };
  }
  return {
    title,
    countdown: { deadline: until, label: cooldownGateDetail, clock: 'local' },
  };
}

function failedGate(state: DuelSessionState): CanvasGateView | null {
  const { failure } = state;
  if (!failure) return null;

  if (failure.error.code === 'empty_pool') {
    return emptyPoolGate(failure.error, canWidenLock(state));
  }
  if (isCalledOff(state)) {
    return {
      title: DUEL_GATE_COPY.calledOff,
      detail: failure.error.message,
      actionLabel: DUEL_GATE_COPY.searchAgain,
    };
  }
  if (failure.error.code === 'rate_limited') {
    return rateLimitedGate(FAILED_TITLES[failure.step], state.cooldownUntil);
  }

  return {
    title: FAILED_TITLES[failure.step],
    detail: authErrorMessage(failure.error),
    actionLabel: DUEL_GATE_COPY.tryAgain,
  };
}

// Only what history says; never inferred
function awayGate(away: AwayResult | null): CanvasGateView {
  if (!away || away.status === 'checking') {
    return { title: DUEL_GATE_COPY.away, detail: DUEL_GATE_COPY.awayChecking };
  }
  const detail =
    away.status === 'found'
      ? `${AWAY_OUTCOMES[away.outcome]} ${away.foundCount} of ${SQUAD_SIZE} named.`
      : DUEL_GATE_COPY.awayUnknown;
  return {
    title: DUEL_GATE_COPY.away,
    detail,
    actionLabel: DUEL_GATE_COPY.playAgain,
    secondaryActionLabel: DUEL_GATE_COPY.viewProfile,
  };
}

// This duel's own entry: its id is the session's
export function awayResultOf(
  entries: HistoryEntry[],
  sessionId: string,
): AwayResult | null {
  const entry = entries.find((item) => item.id === sessionId);
  if (entry?.mode !== 'duel') return null;
  return {
    status: 'found',
    outcome: entry.outcome,
    foundCount: entry.foundCount,
  };
}

function gateOf(
  state: DuelSessionState,
  lobby: DuelLobbyView | null,
): CanvasGateView | null {
  if (lobby) return lobbyGate(lobby);
  if (state.phase === 'endedAway') return awayGate(state.away);
  if (state.resume !== null && !state.yourConnection) {
    return { title: RECONNECTING_TITLE };
  }
  return reconnectingGate(state.yourConnection) ?? failedGate(state);
}

function inputOf(state: DuelSessionState): GuessInputStatus {
  if (state.phase !== 'playing' || state.session?.turn !== 'you') {
    return 'locked';
  }
  if (state.isForfeiting || state.yourConnection) return 'locked';
  if (state.isGuessing) return 'pending';
  return state.cooldownUntil === null ? 'live' : 'cooldown';
}

export function duelCanvasView(
  state: DuelSessionState,
  you: DuelPlayer,
): DuelCanvasView {
  const { session, result } = state;
  const lobby = lobbyOf(state);
  // Ended away: no clock and no turn to show
  const isOver = result !== null || state.phase === 'endedAway';
  const round = isOver ? null : (session?.round ?? null);

  return {
    mode: 'duel',
    match: session?.match ?? null,
    found: result?.found ?? session?.found ?? [],
    clock: { round, isFrozen: false },
    input: inputOf(state),
    cooldownUntil: state.cooldownUntil ?? undefined,
    toast: state.toast,
    pulse: state.pulse,
    shakeKey: state.shakeKey,
    lifeLostKey: state.lifeLostKey,
    gate: gateOf(state, lobby),
    you: result?.you ?? session?.you ?? you,
    opponent: result?.opponent ?? session?.opponent ?? state.opponent,
    turn: isOver ? null : (session?.turn ?? null),
    lobby,
    opponentConnection: isOver ? null : state.opponentConnection,
    yourConnection: result ? null : state.yourConnection,
    end: result,
    endReason: result && state.isConnectionLost ? 'connectionLost' : undefined,
  };
}
