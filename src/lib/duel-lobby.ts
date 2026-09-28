import { MAX_LIVES } from '@/lib/api/schemas/game';
import { authErrorMessage } from '@/lib/auth';
import { filterSummary, lobbyGate } from '@/lib/lobby';
import type { CanvasGateView, DuelCanvasView } from '@/types/canvas';
import type { DuelPlayer } from '@/types/duel';
import type {
  DuelGateAction,
  DuelLobbyEvent,
  DuelLobbyFailureStep,
  DuelLobbyPhase,
  DuelLobbyState,
  DuelLobbyView,
  FilterSummary,
} from '@/types/duel-lobby';
import type { Filters } from '@/types/filters';
import type { User } from '@/types/user';

// Both handles hold before the filter step
export const PAIRED_BEAT_MS = 1_200;

export const DUEL_GATE_COPY = {
  matchFound: 'Match found',
  backToFilters: 'Back to filters',
  noMatch: 'No match found',
  changeFilters: 'Change filters',
  tryAgain: 'Try again',
} as const;

const FAILED_TITLES: Record<DuelLobbyFailureStep, string> = {
  connect: "Couldn't start the duel",
  queue: "Couldn't join the queue",
  lock: "Couldn't lock in your filters",
  match: "Couldn't set up the match",
};

const NO_SUBMISSIONS = { yours: 'pending', theirs: 'pending' } as const;

export const INITIAL_DUEL_LOBBY: DuelLobbyState = {
  phase: 'connecting',
  filters: null,
  options: null,
  opponent: null,
  submission: NO_SUBMISSIONS,
  coinFlip: null,
  session: null,
  isLocking: false,
  failure: null,
};

// A server error names the step it interrupted
function stepOf(phase: DuelLobbyPhase): DuelLobbyFailureStep {
  switch (phase) {
    case 'connecting':
    case 'searching':
    case 'noOpponent':
      return 'queue';
    default:
      return 'match';
  }
}

export function duelLobbyReducer(
  state: DuelLobbyState,
  event: DuelLobbyEvent,
): DuelLobbyState {
  switch (event.type) {
    case 'started':
      return {
        ...INITIAL_DUEL_LOBBY,
        filters: state.filters,
        options: state.options,
      };
    case 'prepared':
      return { ...state, filters: event.filters, options: event.options };
    case 'queued':
      return {
        ...state,
        phase: 'searching',
        opponent: null,
        submission: NO_SUBMISSIONS,
        coinFlip: null,
        session: null,
        failure: null,
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
      return { ...state, phase: 'ready', session: event.session };
    case 'error':
      return duelLobbyReducer(state, {
        type: 'failed',
        step: stepOf(state.phase),
        error: event.error,
      });
    case 'failed':
      return {
        ...state,
        phase: 'failed',
        isLocking: false,
        failure: { step: event.step, error: event.error },
      };
    default: {
      const unhandled: never = event;
      return unhandled;
    }
  }
}

export function canLockFilters(state: DuelLobbyState): boolean {
  if (state.isLocking || state.filters === null) return false;
  if (state.failure?.step === 'lock') return true;
  return state.phase === 'filters' && state.submission.yours === 'pending';
}

// Before the session loads, the label still says who
export function youFrom(user: User | null): DuelPlayer {
  return {
    id: user?.id ?? 'you',
    handle: user?.handle ?? 'You',
    lives: MAX_LIVES,
  };
}

function summaryOf(state: DuelLobbyState, filters: Filters): FilterSummary {
  return state.options ? filterSummary(filters, state.options) : [];
}

function lobbyOf(state: DuelLobbyState): DuelLobbyView | null {
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

export function duelGateAction(state: DuelLobbyState): DuelGateAction | null {
  switch (state.phase) {
    case 'ready':
      return 'leave';
    case 'failed':
      return state.failure?.error.code === 'empty_pool' ? 'leave' : 'retry';
    default:
      return null;
  }
}

function handoffDetail(state: DuelLobbyState): string | undefined {
  const { coinFlip, opponent } = state;
  if (!coinFlip) return undefined;
  if (coinFlip.winner === 'you') return 'Your filters picked this match.';
  return opponent
    ? `${opponent.handle}'s filters picked this match.`
    : 'Their filters picked this match.';
}

function failedGate(state: DuelLobbyState): CanvasGateView | null {
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

function gateOf(
  state: DuelLobbyState,
  lobby: DuelLobbyView | null,
): CanvasGateView | null {
  if (lobby) return lobbyGate(lobby);

  switch (state.phase) {
    // Temporary until the duel loop (W23)
    case 'ready':
      return {
        title: DUEL_GATE_COPY.matchFound,
        detail: handoffDetail(state),
        actionLabel: DUEL_GATE_COPY.backToFilters,
      };
    case 'failed':
      return failedGate(state);
    default:
      return null;
  }
}

export function duelCanvasView(
  state: DuelLobbyState,
  you: DuelPlayer,
): DuelCanvasView {
  const { session } = state;
  const lobby = lobbyOf(state);

  return {
    mode: 'duel',
    match: session?.match ?? null,
    found: session?.found ?? [],
    // No clock runs until the loop (W23)
    clock: { round: null, isFrozen: false },
    input: 'locked',
    toast: null,
    shakeKey: 0,
    lifeLostKey: 0,
    gate: gateOf(state, lobby),
    you: session?.you ?? you,
    opponent: session?.opponent ?? state.opponent,
    // A turn chip with no clock would read as live
    turn: null,
    lobby,
    opponentConnection: null,
    end: null,
  };
}
