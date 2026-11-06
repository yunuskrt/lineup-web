import { afterEach, describe, expect, it } from 'vitest';
import {
  accuracyLabel,
  matchContext,
  matchDateLabel,
  matchSubtitle,
  missedOnPitch,
  namedOrder,
  roundSecondsLabel,
  scoreline,
  summaryTitle,
} from '@/lib/summary';
import type { MatchIdentity } from '@/types/match';
import type { RevealedPlayer } from '@/types/player';
import type { SoloSummary } from '@/types/solo';

const IDENTITY: MatchIdentity = {
  id: 'm-1',
  competition: {
    id: 'c-1',
    kind: 'ucl',
    name: 'Continental Cup',
    logoUrl: null,
  },
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

describe('namedOrder', () => {
  const at = (order: number, elapsedMs: number) => ({ order, elapsedMs });

  it('lists the rows in the order the server gave', () => {
    const { rows } = namedOrder([at(3, 900), at(1, 4_000), at(2, 2_500)]);
    expect(rows.map((row) => row.order)).toEqual([1, 2, 3]);
  });

  it('marks the fastest row, by its sorted index', () => {
    expect(namedOrder([at(2, 1_200), at(1, 4_000)]).fastestIndex).toBe(1);
  });

  it('gives a tie for fastest to the first named', () => {
    expect(namedOrder([at(2, 1_500), at(1, 1_500)]).fastestIndex).toBe(0);
  });

  it('has no fastest with no rows', () => {
    expect(namedOrder([])).toEqual({ rows: [], fastestIndex: null });
  });

  it('keeps all eleven, in order', () => {
    const eleven = Array.from({ length: 11 }, (_, i) => at(11 - i, 15_000));
    const { rows, fastestIndex } = namedOrder(eleven);
    expect(rows.map((row) => row.order)).toEqual(
      Array.from({ length: 11 }, (_, i) => i + 1),
    );
    expect(fastestIndex).toBe(0);
  });

  it('leaves the input as it was', () => {
    const found = [at(2, 1), at(1, 2)];
    namedOrder(found);
    expect(found.map((row) => row.order)).toEqual([2, 1]);
  });
});

describe('missedOnPitch', () => {
  const MISSED: RevealedPlayer[] = [
    {
      id: 'p-1',
      name: 'Tomas Varga',
      slot: 0,
      position: 'GK',
      imageUrl: null,
    },
  ];
  const summary = (missed: RevealedPlayer[] | null): SoloSummary => ({
    match: IDENTITY,
    found: [],
    missedCount: 11,
    missed,
    livesRemaining: 0,
    endReason: 'lives_out',
    accuracy: 0,
    bestStreak: 0,
    roundTimesMs: [],
  });

  it('shows the missed players once revealed', () => {
    const end = {
      status: 'ready',
      summary: summary(MISSED),
      isMissedRevealed: true,
    } as const;
    expect(missedOnPitch(end)).toBe(MISSED);
  });

  it('keeps a Pro list off the pitch until then', () => {
    const end = {
      status: 'ready',
      summary: summary(MISSED),
      isMissedRevealed: false,
    } as const;
    expect(missedOnPitch(end)).toBeUndefined();
  });

  it('has nothing to show a free run', () => {
    const end = {
      status: 'ready',
      summary: summary(null),
      isMissedRevealed: true,
    } as const;
    expect(missedOnPitch(end)).toBeUndefined();
  });

  it('shows nothing while the summary loads, or mid-run', () => {
    expect(missedOnPitch({ status: 'loading' })).toBeUndefined();
    expect(missedOnPitch(null)).toBeUndefined();
  });
});
