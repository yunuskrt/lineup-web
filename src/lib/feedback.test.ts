import { describe, expect, it } from 'vitest';
import { FEEDBACK_MESSAGES, guessFeedback } from '@/lib/feedback';
import type { GuessResult } from '@/types/game';

const CORRECT_NEW: GuessResult = {
  outcome: 'correct_new',
  player: {
    id: 'p-harlow',
    name: 'Rhys Harlow',
    slot: 4,
    position: 'DF',
    imageUrl: null,
  },
};

const ALREADY_FOUND: GuessResult = {
  outcome: 'already_found',
  playerId: 'p-tolland',
};

const NOT_IN_XI: GuessResult = { outcome: 'not_in_xi' };

describe('guessFeedback', () => {
  it('lets the reveal speak for a correct new answer', () => {
    expect(guessFeedback(CORRECT_NEW)).toEqual({
      toast: null,
      clearInput: true,
      shakeInput: false,
      pulsePlayerId: null,
    });
  });

  it('pulses the named slot for an already-found answer', () => {
    expect(guessFeedback(ALREADY_FOUND)).toEqual({
      toast: FEEDBACK_MESSAGES.alreadyFound,
      clearInput: true,
      shakeInput: false,
      pulsePlayerId: 'p-tolland',
    });
  });

  it('shakes the input and keeps the text when not in the XI', () => {
    expect(guessFeedback(NOT_IN_XI)).toEqual({
      toast: FEEDBACK_MESSAGES.notInXi,
      clearInput: false,
      shakeInput: true,
      pulsePlayerId: null,
    });
  });

  it('uses the copy from the theme spec', () => {
    expect(FEEDBACK_MESSAGES).toEqual({
      alreadyFound: 'Already named',
      notInXi: 'Not in this XI',
    });
  });

  it.each([ALREADY_FOUND, NOT_IN_XI])(
    'gives $outcome exactly one channel beside the toast',
    (result) => {
      const feedback = guessFeedback(result);
      expect(feedback.toast).not.toBeNull();
      expect(feedback.shakeInput).toBe(feedback.pulsePlayerId === null);
    },
  );
});
