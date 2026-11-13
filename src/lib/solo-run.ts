import type { GuessInputStatus } from '@/components/game/GuessInput';
import type { QuitDialogCopy } from '@/components/game/QuitDialog';
import { MAX_LIVES } from '@/lib/api/schemas/game';
import { authErrorMessage } from '@/lib/auth';
import { guessFeedback } from '@/lib/feedback';
import { PRACTICE_QUIT_COPY } from '@/lib/practice';
import { isDailyCap } from '@/lib/solo-allowance';
import {
  cooldownUntil,
  emptyPoolGate,
  widenReasonOf,
} from '@/lib/system-states';
import type { ApiError } from '@/types/api';
import type {
  CanvasGateView,
  SoloCanvasView,
  SoloEndView,
} from '@/types/canvas';
import type { RoundTiming } from '@/types/game';
import type { SoloGuessResponse, SoloSession } from '@/types/solo';
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
  backToFilters: 'Back to filters',
  tryAgain: 'Try again',
  dailyCap: 'No solo runs left today',
  playDuel: 'Play a duel',
  backToPlay: 'Back to play',
  matchGone: "That match isn't in the game any more",
  pickAnother: 'Pick another one from the archive.',
  backToArchive: 'Back to the archive',
  pickingLocked: 'Picking a match is part of Pro',
  randomStillFree: 'A random match from your filters is still free.',
  practiceLocked: 'Practice is part of Pro',
  timedStillFree: 'A timed run from your filters is still free.',
  practiceClosed: 'This practice run has closed',
  practiceIdle: 'Practice runs close after 30 minutes without a guess.',
} as const;

const FAILED_TITLES: Record<SoloRunStep, string> = {
  find: "Couldn't find a match",
  choose: "Couldn't start the run",
  guess: "Couldn't send your guess",
  sync: "Couldn't update the run",
  quit: "Couldn't end the run",
  summary: "Couldn't load the summary",
};

// Errors a retry can't fix send the player back
const LEAVING_ERRORS: ReadonlySet<ApiError['code']> = new Set([
  'empty_pool',
  'not_found',
  'unauthorized',
]);

// The run is gone; another guess can't land
const RUN_GONE_ERRORS: ReadonlySet<ApiError['code']> = new Set([
  'not_found',
  'unauthorized',
]);

export const INITIAL_SOLO_RUN: SoloRunState = {
  phase: 'finding',
  offer: null,
  session: null,
  summary: null,
  isGuessing: false,
  isChoosing: false,
  isMissedRevealed: false,
  isQuitting: false,
  cooldownUntil: null,
  failure: null,
  pickedMatchId: null,
  isPracticeAsked: false,
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
    isChoosing: false,
    failure: null,
    lifeLostKey: state.lifeLostKey + (hasLostLife ? 1 : 0),
  };
}

function isForHeldRun(state: SoloRunState, sessionId: string): boolean {
  return state.session?.sessionId === sessionId;
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
      return {
        ...INITIAL_SOLO_RUN,
        pickedMatchId: event.matchId,
        isPracticeAsked: event.practice,
      };
    case 'offerReceived':
      return { ...state, phase: 'choosing', offer: event.offer, failure: null };
    case 'sideChosen':
      return { ...state, isChoosing: true };
    case 'sessionReceived':
    case 'synced':
      return applySession(state, event.session);
    case 'guessSubmitted':
      return { ...state, isGuessing: true };
    case 'quitting':
      return { ...state, isQuitting: true };
    case 'summaryReceived':
      if (!isForHeldRun(state, event.sessionId)) return state;
      return {
        ...state,
        phase: 'over',
        summary: event.summary,
        isGuessing: false,
        isQuitting: false,
        failure: null,
      };
    case 'summaryFailed':
      if (!isForHeldRun(state, event.sessionId)) return state;
      return soloRunReducer(state, {
        type: 'failed',
        step: 'summary',
        error: event.error,
      });
    case 'missedRevealed':
      // Only a finished run whose summary has the list
      if (state.phase !== 'over' || !state.summary?.missed) return state;
      return { ...state, isMissedRevealed: true };
    case 'guessResolved':
      return resolveGuess(state, event);
    case 'guessFailed': {
      if (RUN_GONE_ERRORS.has(event.error.code)) {
        return soloRunReducer(state, {
          type: 'failed',
          step: 'guess',
          error: event.error,
        });
      }
      const next = { ...state, isGuessing: false };
      // The hook syncs instead of toasting this one
      if (event.error.code === 'session_over') return next;
      // The input says why; no toast on top
      if (event.error.code === 'rate_limited') {
        return { ...next, cooldownUntil: cooldownUntil(event.error, event.at) };
      }
      return withToast(next, authErrorMessage(event.error));
    }
    case 'cooldownEnded':
      return { ...state, cooldownUntil: null };
    case 'failed':
      return {
        ...state,
        phase: 'failed',
        isGuessing: false,
        isChoosing: false,
        isQuitting: false,
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

// Practice warns before ending a timed run
export function openRunUpdate(state: SoloRunState): 'mark' | 'clear' | null {
  if (state.phase === 'playing' && state.session?.practice === false) {
    return 'mark';
  }
  const isGone =
    state.phase === 'over' || state.failure?.error.code === 'not_found';
  return isGone ? 'clear' : null;
}

// Only a correct new name starts a round on receipt
export function receiptRoundOf(
  response: SoloGuessResponse,
): RoundTiming | null {
  return response.result.outcome === 'correct_new'
    ? response.session.round
    : null;
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
  if (state.phase !== 'playing' || state.isQuitting) return 'locked';
  if (state.isGuessing) return 'pending';
  return state.cooldownUntil === null ? 'live' : 'cooldown';
}

export function canGuessSolo(state: SoloRunState): boolean {
  return inputStatus(state) === 'live';
}

export function soloGateAction(state: SoloRunState): SoloGateAction | null {
  switch (state.phase) {
    case 'choosing':
      return 'choose';
    case 'failed': {
      const error = state.failure?.error;
      if (!error) return 'retry';
      if (isDailyCap(error)) return 'playDuel';
      if (isPickRefused(state)) return 'leave';
      if (isPickedMatchGone(state)) return 'backToArchive';
      if (widenReasonOf(error)) return 'widen';
      return LEAVING_ERRORS.has(error.code) ? 'leave' : 'retry';
    }
    default:
      return null;
  }
}

// The picked match left the pool, or a bad link
function isPickedMatchGone({ failure, pickedMatchId }: SoloRunState): boolean {
  return (
    pickedMatchId !== null &&
    failure?.step === 'find' &&
    failure.error.code === 'not_found'
  );
}

// Free tried to pick (R13); random runs work
function isPickRefused({ failure }: SoloRunState): boolean {
  return (
    failure?.step === 'find' &&
    failure.error.code === 'forbidden' &&
    failure.error.reason === 'pro_required'
  );
}

// The idle drop (R14): every call is not_found
function isPracticeClosed({ failure, session }: SoloRunState): boolean {
  return session?.practice === true && failure?.error.code === 'not_found';
}

// Never a dead end: a duel, the filters, or Pro
export function dailyCapGate(
  error: ApiError,
  capLine: string | null,
): CanvasGateView {
  return {
    title: SOLO_GATE_COPY.dailyCap,
    detail: capLine ?? error.message,
    actionLabel: SOLO_GATE_COPY.playDuel,
    secondaryActionLabel: SOLO_GATE_COPY.backToPlay,
    seePro: true,
  };
}

function failedGate(
  state: SoloRunState,
  capLine: string | null,
): CanvasGateView | null {
  const { failure } = state;
  if (!failure) return null;

  if (isDailyCap(failure.error)) return dailyCapGate(failure.error, capLine);
  if (isPickRefused(state)) {
    // R14's message wins when both were asked for
    return state.isPracticeAsked
      ? {
          title: SOLO_GATE_COPY.practiceLocked,
          // At the cap nothing is still free today
          detail: capLine ?? SOLO_GATE_COPY.timedStillFree,
          actionLabel: SOLO_GATE_COPY.backToPlay,
          seePro: true,
        }
      : {
          title: SOLO_GATE_COPY.pickingLocked,
          detail: capLine ?? SOLO_GATE_COPY.randomStillFree,
          actionLabel: SOLO_GATE_COPY.backToPlay,
          seePro: true,
        };
  }
  if (isPracticeClosed(state)) {
    return {
      title: SOLO_GATE_COPY.practiceClosed,
      detail: SOLO_GATE_COPY.practiceIdle,
      actionLabel: SOLO_GATE_COPY.backToPlay,
    };
  }
  if (isPickedMatchGone(state)) {
    return {
      title: SOLO_GATE_COPY.matchGone,
      detail: SOLO_GATE_COPY.pickAnother,
      actionLabel: SOLO_GATE_COPY.backToArchive,
    };
  }
  if (failure.error.code === 'empty_pool') return emptyPoolGate(failure.error);

  return {
    title: FAILED_TITLES[failure.step],
    detail: authErrorMessage(failure.error),
    actionLabel:
      soloGateAction(state) === 'leave'
        ? SOLO_GATE_COPY.backToFilters
        : SOLO_GATE_COPY.tryAgain,
  };
}

function gateOf(
  state: SoloRunState,
  capLine: string | null,
): CanvasGateView | null {
  switch (state.phase) {
    case 'choosing':
      if (!state.offer) return null;
      return {
        ...SOLO_GATE_COPY.choose,
        sidePick: { match: state.offer.match, isChoosing: state.isChoosing },
      };
    case 'failed':
      return failedGate(state, capLine);
    default:
      return null;
  }
}

// The ask stands in until the session answers
function isPracticeShown(state: SoloRunState): boolean {
  const { session, summary } = state;
  if (summary) return summary.practice;
  if (session) return session.practice;
  return state.isPracticeAsked && !isPickRefused(state);
}

// The server's flag decides the dialog's words
export function soloQuitCopy({
  session,
}: SoloRunState): QuitDialogCopy | undefined {
  return session?.practice ? PRACTICE_QUIT_COPY : undefined;
}

// A failed fetch keeps the skeleton under its gate
function endOf(state: SoloRunState): SoloEndView | null {
  const isEnding = state.phase === 'over' || state.failure?.step === 'summary';
  if (!isEnding) return null;
  return state.summary
    ? {
        status: 'ready',
        summary: state.summary,
        isMissedRevealed: state.isMissedRevealed,
      }
    : { status: 'loading' };
}

// `capLine` is the server's allowance, at 0 left
export function soloCanvasView(
  state: SoloRunState,
  capLine: string | null = null,
): SoloCanvasView {
  const { session, summary } = state;
  return {
    mode: 'solo',
    match: session?.match ?? null,
    found: summary?.found ?? session?.found ?? [],
    lives: summary?.livesRemaining ?? session?.lives ?? MAX_LIVES,
    clock: { round: session?.round ?? null, isFrozen: false },
    input: inputStatus(state),
    cooldownUntil: state.cooldownUntil ?? undefined,
    toast: state.toast,
    pulse: state.pulse,
    shakeKey: state.shakeKey,
    lifeLostKey: state.lifeLostKey,
    gate: gateOf(state, capLine),
    end: endOf(state),
    capLine: capLine ?? undefined,
    isPicked: state.pickedMatchId !== null,
    isPractice: isPracticeShown(state),
  };
}
