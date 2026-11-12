import { describe, expect, it } from 'vitest';
import { resultActionsLayout } from '@/lib/result-actions';

describe('resultActionsLayout', () => {
  it('keeps Play again and Change filters after a queue duel', () => {
    expect(resultActionsLayout(false, 'locked')).toEqual({
      primary: 'playAgain',
      secondary: 'changeFilters',
    });
  });

  it('offers New room after a room game when hosting is open', () => {
    expect(resultActionsLayout(true, 'open')).toEqual({
      primary: 'newRoom',
      secondary: 'backToPlay',
    });
    expect(resultActionsLayout(true)).toEqual({
      primary: 'newRoom',
      secondary: 'backToPlay',
    });
  });

  it.each(['locked', 'pending'] as const)(
    'leads with Back to play and locks New room when %s',
    (access) => {
      expect(resultActionsLayout(true, access)).toEqual({
        primary: 'backToPlay',
        secondary: 'lockedNewRoom',
      });
    },
  );
});
