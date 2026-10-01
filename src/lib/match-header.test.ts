import { describe, expect, it } from 'vitest';
import { matchInPlayFor } from '@/lib/api/mock/shared';
import { requireFixture } from '@/lib/api/mock/data/fixtures';
import { matchHeaderView } from '@/lib/match-header';

const RAIN_FINAL = requireFixture('match-federation-2012-final');

describe('matchHeaderView', () => {
  it('lays out both sides with their own scores', () => {
    const view = matchHeaderView(matchInPlayFor(RAIN_FINAL, 'home'));

    expect(view.home.club.name).toBe('Yıldırımspor');
    expect(view.home.club.shortName).toBe('YLD');
    expect(view.home.score).toBe(2);
    expect(view.away.club.name).toBe('FC Weerdam');
    expect(view.away.score).toBe(1);
  });

  it('names the competition and the date in words', () => {
    const view = matchHeaderView(matchInPlayFor(RAIN_FINAL, 'home'));

    expect(view.competition).toBe('Federation Trophy');
    expect(view.date).toBe('9 May 2012');
  });

  it('marks only the side being named', () => {
    const home = matchHeaderView(matchInPlayFor(RAIN_FINAL, 'home'));
    expect(home.home.isNamed).toBe(true);
    expect(home.away.isNamed).toBe(false);

    const away = matchHeaderView(matchInPlayFor(RAIN_FINAL, 'away'));
    expect(away.home.isNamed).toBe(false);
    expect(away.away.isNamed).toBe(true);
  });

  it('says whose XI is being named', () => {
    expect(
      matchHeaderView(matchInPlayFor(RAIN_FINAL, 'home')).namingLabel,
    ).toBe("You're naming Yıldırımspor's starting XI.");
    expect(
      matchHeaderView(matchInPlayFor(RAIN_FINAL, 'away')).namingLabel,
    ).toBe("You're naming FC Weerdam's starting XI.");
  });
});
