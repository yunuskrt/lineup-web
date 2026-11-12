import { describe, expect, it } from 'vitest';
import { resultActionsLayout } from '@/lib/result-actions';

describe('resultActionsLayout', () => {
  it('keeps Play again and Change filters after a queue duel', () => {
    expect(
      resultActionsLayout({ isPrivate: false, hostAccess: 'locked' }),
    ).toEqual({ primary: 'playAgain', secondary: 'changeFilters' });
    expect(resultActionsLayout()).toEqual({
      primary: 'playAgain',
      secondary: 'changeFilters',
    });
  });

  it('offers New room after a room game when hosting is open', () => {
    expect(
      resultActionsLayout({ isPrivate: true, hostAccess: 'open' }),
    ).toEqual({ primary: 'newRoom', secondary: 'backToPlay' });
    expect(resultActionsLayout({ isPrivate: true })).toEqual({
      primary: 'newRoom',
      secondary: 'backToPlay',
    });
  });

  it('trades Play again for Play a duel at the solo cap', () => {
    expect(resultActionsLayout({ isSoloCapped: true })).toEqual({
      primary: 'playDuel',
      secondary: 'backToPlay',
    });
  });

  it('replays a picked match and leads back to the archive', () => {
    expect(resultActionsLayout({ isPicked: true })).toEqual({
      primary: 'playItAgain',
      secondary: 'backToArchive',
    });
    expect(resultActionsLayout({ isPicked: false }).primary).toBe('playAgain');
  });

  it.each(['locked', 'pending'] as const)(
    'leads with Back to play and locks New room when %s',
    (access) => {
      expect(
        resultActionsLayout({ isPrivate: true, hostAccess: access }),
      ).toEqual({ primary: 'backToPlay', secondary: 'lockedNewRoom' });
    },
  );
});
