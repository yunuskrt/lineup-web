import { afterEach, describe, expect, it } from 'vitest';
import {
  accuracyLabel,
  matchContext,
  matchDateLabel,
  matchSubtitle,
  roundSecondsLabel,
  roundTimeBars,
  roundTimeStats,
  scoreline,
  summaryTitle,
} from '@/lib/summary';
import type { MatchIdentity } from '@/types/match';

const IDENTITY: MatchIdentity = {
  id: 'm-1',
  competition: { id: 'c-1', kind: 'ucl', name: 'Continental Cup' },
  season: '2004-05',
  date: '2005-05-25',
  stage: 'Final',
  home: { id: 'h', name: 'Real Solvara', shortName: 'Solvara', crestUrl: null },
  away: {
    id: 'a',
    name: 'Northgate United',
    shortName: 'Northgate',
    crestUrl: null,
  },
  score: { home: 3, away: 3 },
  nickname: null,
};

const ORIGINAL_TZ = process.env.TZ;

afterEach(() => {
  process.env.TZ = ORIGINAL_TZ;
});

describe('summaryTitle', () => {
  it('names each way a run ends', () => {
    expect(summaryTitle('perfect_clear')).toBe('Perfect clear');
    expect(summaryTitle('lives_out')).toBe('Run over');
    expect(summaryTitle('quit')).toBe('Run ended');
  });
});

describe('scoreline', () => {
  it('joins the score with an en dash', () => {
    expect(scoreline(IDENTITY)).toBe('Real Solvara 3–3 Northgate United');
  });

  it('keeps two-digit scores whole', () => {
    const rout = { ...IDENTITY, score: { home: 10, away: 0 } };
    expect(scoreline(rout)).toBe('Real Solvara 10–0 Northgate United');
  });

  it('can use short names', () => {
    expect(scoreline(IDENTITY, 'shortName')).toBe('Solvara 3–3 Northgate');
  });
});

describe('matchContext', () => {
  it('reads competition, stage and date as a sentence', () => {
    expect(matchContext(IDENTITY)).toBe('Continental Cup final, 25 May 2005');
  });

  it('leaves out a missing stage', () => {
    const league = { ...IDENTITY, stage: null };
    expect(matchContext(league)).toBe('Continental Cup, 25 May 2005');
  });

  it('keeps numbered stages readable', () => {
    const league = { ...IDENTITY, stage: 'Matchday 34' };
    expect(matchContext(league)).toBe(
      'Continental Cup matchday 34, 25 May 2005',
    );
  });

  it.each(['Pacific/Kiritimati', 'America/Adak', 'UTC'])(
    'renders the same date under TZ=%s',
    (zone) => {
      process.env.TZ = zone;
      expect(matchDateLabel('2005-05-25')).toBe('25 May 2005');
      expect(matchDateLabel('2006-01-01')).toBe('1 January 2006');
    },
  );
});

describe('matchSubtitle', () => {
  it('is the context when there is no nickname', () => {
    expect(matchSubtitle(IDENTITY)).toBe(matchContext(IDENTITY));
  });

  it('leads with the nickname when there is one', () => {
    const named = { ...IDENTITY, nickname: 'The Rain Final' };
    expect(matchSubtitle(named)).toBe(
      'The Rain Final: Continental Cup final, 25 May 2005',
    );
  });
});

describe('accuracyLabel', () => {
  it('rounds to a whole percent', () => {
    expect(accuracyLabel(0)).toBe('0%');
    expect(accuracyLabel(1)).toBe('100%');
    expect(accuracyLabel(2 / 3)).toBe('67%');
    expect(accuracyLabel(0.667)).toBe('67%');
  });
});

describe('roundSecondsLabel', () => {
  it('shows seconds to one decimal', () => {
    expect(roundSecondsLabel(4230)).toBe('4.2s');
    expect(roundSecondsLabel(15_000)).toBe('15.0s');
    expect(roundSecondsLabel(0)).toBe('0.0s');
  });
});

describe('roundTimeBars', () => {
  it('scales each round to its share of 15s', () => {
    expect(roundTimeBars([7500, 3000])).toEqual([0.5, 0.2]);
  });

  it('clamps rounds past 15s', () => {
    expect(roundTimeBars([15_400, 15_000])).toEqual([1, 1]);
  });

  it('is empty with no rounds', () => {
    expect(roundTimeBars([])).toEqual([]);
  });
});

describe('roundTimeStats', () => {
  it('gives the average and the fastest round', () => {
    expect(roundTimeStats([2000, 4000, 9000])).toEqual({
      averageMs: 5000,
      fastestMs: 2000,
    });
  });

  it('is null with no rounds', () => {
    expect(roundTimeStats([])).toBeNull();
  });
});
