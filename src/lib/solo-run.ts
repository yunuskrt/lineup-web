import type { GuessInputStatus } from '@/components/game/GuessInput';
import { SQUAD_SIZE } from '@/lib/api/schemas/common';
import { MAX_LIVES } from '@/lib/api/schemas/game';
import { authErrorMessage } from '@/lib/auth';
import { guessFeedback } from '@/lib/feedback';
import type { ApiError } from '@/types/api';
import type { CanvasGateView, SoloCanvasView } from '@/types/canvas';
import type { RoundTiming } from '@/types/game';
import type { SoloSession } from '@/types/solo';
import type {
  SoloGateAction,
  SoloRunEvent,
  SoloRunPhase,
  SoloRunState,
  SoloRunStep,
} from '@/types/solo-run';

export const SYNC_RETRY_MS = 250;

export const SOLO_GATE_COPY = {
  choose: {
    title: 'Pick your side',
    detail: "You'll name the starting XI of the team you pick.",
  },
  perfectClear: 'Perfect clear',
  runOver: 'Run over',
  backToFilters: 'Back to filters',
  noMatch: 'No match found',
  changeFilters: 'Change filters',
  tryAgain: 'Try again',
} as const;

const FAILED_TITLES: Record<SoloRunStep, string> = {
  find: "Couldn't find a match",
  choose: "Couldn't start the run",
  sync: "Couldn't update the run",
  quit: "Couldn't end the run",
};

// Errors a retry can't fix send the player back
const LEAVING_ERRORS: ReadonlySet<ApiError['code']> = new Set([
  'empty_pool',
  'not_found',
]);

export const INITIAL_SOLO_RUN: SoloRunState = {
  phase: 'finding',
  offer: null,
  session: null,
  isGuessing: false,
  failure: null,
  toast: null,
  shakeKey: 0,
  lifeLostKey: 0,
};

function phaseOf(session: SoloSession): SoloRunPhase {
  return session.status === 'over' ? 'over' : 'playing';
}

function resumedPhase(state: SoloRunState): SoloRunPhase {
  if (state.session) return phaseOf(state.session);
  return state.offer ? 'choosing' : 'finding';
}

function withToast(state: SoloRunState, message: string): SoloRunState {
  return { ...state, toast: { id: (state.toast?.id ?? 0) + 1, message } };
}

// Notices a drop the server reported
function applySession(state: SoloRunState, session: SoloSession): SoloRunState {
  const hasLostLife = !!state.session && session.lives < state.session.lives;
  return {
    ...state,
    phase: phaseOf(session),
    session,
    failure: null,
    lifeLostKey: state.lifeLostKey + (hasLostLife ? 1 : 0),
  };
}

function resolveGuess(
  state: SoloRunState,
  event: Extract<SoloRunEvent, { type: 'guessResolved' }>,
): SoloRunState {
  const feedback = guessFeedback(event.response.result);
  let next = applySession(
    { ...state, isGuessing: false },
    event.response.session,
  );

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

export function soloRunReducer(
  state: SoloRunState,
  event: SoloRunEvent,
): SoloRunState {
  switch (event.type) {
    case 'finding':
      return INITIAL_SOLO_RUN;
    case 'offerReceived':
      return { ...state, phase: 'choosing', offer: event.offer, failure: null };
    case 'sessionReceived':
    case 'synced':
      return applySession(state, event.session);
    case 'guessSubmitted':
      return { ...state, isGuessing: true };
    case 'guessResolved':
      return resolveGuess(state, event);
    case 'guessFailed': {
      const next = { ...state, isGuessing: false };
      // The hook syncs instead of toasting this one
      if (event.error.code === 'session_over') return next;
      return withToast(next, authErrorMessage(event.error));
    }
    case 'failed':
      return {
        ...state,
        phase: 'failed',
        isGuessing: false,
        failure: { step: event.step, error: event.error },
      };
    case 'retried':
      return { ...state, phase: resumedPhase(state), failure: null };
    default: {
      const unhandled: never = event;
      return unhandled;
    }
  }
}

// A sync at 0 can land inside the grace window
export function needsResync(held: RoundTiming, synced: SoloSession): boolean {
  return (
    synced.status === 'active' &&
    synced.round !== null &&
    synced.round.startedAt === held.startedAt
  );
}

function inputStatus(state: SoloRunState): GuessInputStatus {
  if (state.phase !== 'playing') return 'locked';
  return state.isGuessing ? 'pending' : 'live';
}

export function soloGateAction(state: SoloRunState): SoloGateAction | null {
  switch (state.phase) {
    case 'choosing':
      return 'choose';
    case 'over':
      return 'leave';
    case 'failed':
      return state.failure && LEAVING_ERRORS.has(state.failure.error.code)
        ? 'leave'
        : 'retry';
    default:
      return null;
  }
}

function overGate(session: SoloSession | null): CanvasGateView {
  const found = session?.found.length ?? 0;
  return {
    title:
      found >= SQUAD_SIZE
        ? SOLO_GATE_COPY.perfectClear
        : SOLO_GATE_COPY.runOver,
    detail: `You named ${found} of ${SQUAD_SIZE}.`,
    actionLabel: SOLO_GATE_COPY.backToFilters,
  };
}

function failedGate(state: SoloRunState): CanvasGateView | null {
  const { failure } = state;
  if (!failure) return null;

  if (failure.error.code === 'empty_pool') {
    return {
      title: SOLO_GATE_COPY.noMatch,
      detail: failure.error.message,
      actionLabel: SOLO_GATE_COPY.changeFilters,
    };
  }

  return {
    title: FAILED_TITLES[failure.step],
    detail: authErrorMessage(failure.error),
    actionLabel:
      soloGateAction(state) === 'leave'
        ? SOLO_GATE_COPY.backToFilters
        : SOLO_GATE_COPY.tryAgain,
  };
}

function gateOf(state: SoloRunState): CanvasGateView | null {
  switch (state.phase) {
    case 'choosing':
      if (!state.offer) return null;
      return {
        ...SOLO_GATE_COPY.choose,
        choices: [
          { id: 'home', label: state.offer.home.name },
          { id: 'away', label: state.offer.away.name },
        ],
      };
    case 'over':
      return overGate(state.session);
    case 'failed':
      return failedGate(state);
    default:
      return null;
  }
}

export function soloCanvasView(state: SoloRunState): SoloCanvasView {
  const { session } = state;
  return {
    mode: 'solo',
    match: session?.match ?? null,
    found: session?.found ?? [],
    lives: session?.lives ?? MAX_LIVES,
    clock: { round: session?.round ?? null, isFrozen: false },
    input: inputStatus(state),
    toast: state.toast,
    pulse: state.pulse,
    shakeKey: state.shakeKey,
    lifeLostKey: state.lifeLostKey,
    gate: gateOf(state),
    end: null,
  };
}
