import type {
  FeedbackState,
  GuessFeedback,
  ToastState,
} from '@/types/feedback';
import type { GuessResult } from '@/types/game';

export const FEEDBACK_MESSAGES = {
  alreadyFound: 'Already named',
  notInXi: 'Not in this XI',
} as const;

export function guessFeedback(result: GuessResult): GuessFeedback {
  switch (result.outcome) {
    case 'correct_new':
      return {
        toast: null,
        clearInput: true,
        shakeInput: false,
        pulsePlayerId: null,
      };
    case 'already_found':
      return {
        toast: FEEDBACK_MESSAGES.alreadyFound,
        clearInput: true,
        shakeInput: false,
        pulsePlayerId: result.playerId,
      };
    case 'not_in_xi':
      return {
        toast: FEEDBACK_MESSAGES.notInXi,
        clearInput: false,
        shakeInput: true,
        pulsePlayerId: null,
      };
    default: {
      const unhandled: never = result;
      return unhandled;
    }
  }
}

export function withToast<S extends ToastState>(state: S, message: string): S {
  return { ...state, toast: { id: (state.toast?.id ?? 0) + 1, message } };
}

// Solo and duel share it; each step builds on the one before
export function applyFeedback<S extends FeedbackState>(
  state: S,
  feedback: GuessFeedback,
): S {
  let next = state;
  if (feedback.toast) next = withToast(next, feedback.toast);
  if (feedback.shakeInput) next = { ...next, shakeKey: next.shakeKey + 1 };
  if (feedback.pulsePlayerId) {
    next = {
      ...next,
      pulse: {
        playerId: feedback.pulsePlayerId,
        key: (next.pulse?.key ?? 0) + 1,
      },
    };
  }
  return next;
}
