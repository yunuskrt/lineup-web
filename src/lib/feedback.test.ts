import { describe, expect, it } from 'vitest';
import {
  applyFeedback,
  FEEDBACK_MESSAGES,
  guessFeedback,
  withToast,
} from '@/lib/feedback';
import type { FeedbackState, GuessFeedback } from '@/types/feedback';
import type { GuessResult } from '@/types/game';

const CORRECT_NEW: GuessResult = {
  outcome: 'correct_new',
  player: {
    id: 'p-harlow',
    name: 'Rhys Harlow',
    slot: 4,
    position: 'DF',
    imageUrl: null,
    directoryKey: 'p-harlow'.padEnd(22, 'x'),
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

const NONE: GuessFeedback = {
  toast: null,
  clearInput: false,
  shakeInput: false,
  pulsePlayerId: null,
};

const STATE = {
  toast: { id: 4, message: 'Earlier' },
  pulse: { playerId: 'p1', key: 2 },
  shakeKey: 7,
  other: 'kept',
};

describe('withToast', () => {
  it('counts the toast on from the last one', () => {
    expect(withToast(STATE, 'Hi').toast).toEqual({ id: 5, message: 'Hi' });
    expect(withToast({ toast: null }, 'Hi').toast).toEqual({
      id: 1,
      message: 'Hi',
    });
  });
});

describe('applyFeedback', () => {
  it('changes nothing for a verdict with no feedback', () => {
    expect(applyFeedback(STATE, NONE)).toBe(STATE);
  });

  it('only toasts', () => {
    const next = applyFeedback(STATE, { ...NONE, toast: 'Already named' });
    expect(next).toEqual({
      ...STATE,
      toast: { id: 5, message: 'Already named' },
    });
  });

  it('only shakes the input', () => {
    const next = applyFeedback(STATE, { ...NONE, shakeInput: true });
    expect(next).toEqual({ ...STATE, shakeKey: 8 });
  });

  it('keeps the toast when it also shakes, as a name outside the XI does', () => {
    const next = applyFeedback(STATE, guessFeedback(NOT_IN_XI));
    expect(next).toEqual({
      ...STATE,
      toast: { id: 5, message: FEEDBACK_MESSAGES.notInXi },
      shakeKey: 8,
    });
  });

  it('keeps the toast when it also pulses, as a repeat name does', () => {
    const next = applyFeedback(STATE, guessFeedback(ALREADY_FOUND));
    expect(next).toEqual({
      ...STATE,
      toast: { id: 5, message: FEEDBACK_MESSAGES.alreadyFound },
      pulse: { playerId: 'p-tolland', key: 3 },
    });
  });

  it('only pulses the named player, starting a first pulse at 1', () => {
    const next = applyFeedback(STATE, { ...NONE, pulsePlayerId: 'p9' });
    expect(next).toEqual({ ...STATE, pulse: { playerId: 'p9', key: 3 } });
    const empty: FeedbackState = {
      toast: null,
      shakeKey: 0,
    };
    const first = applyFeedback(empty, { ...NONE, pulsePlayerId: 'p9' });
    expect(first.pulse).toEqual({ playerId: 'p9', key: 1 });
  });
});
