import type { GuessFeedback } from '@/types/feedback';
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
