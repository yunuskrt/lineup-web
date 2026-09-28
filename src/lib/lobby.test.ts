import { describe, expect, it } from 'vitest';
import {
  SAMPLE_FILTER_OPTIONS,
  SAMPLE_OPEN_FILTERS,
  SAMPLE_OPPONENT,
} from '@/lib/dev/samples';
import { coinFlipTitle, filterSummary, lobbyGate } from '@/lib/lobby';
import type { DuelLobbyView } from '@/types/duel-lobby';
import type { Filters } from '@/types/filters';

const OPTIONS = SAMPLE_FILTER_OPTIONS;
const [CUP, LEAGUE] = OPTIONS.competitions;
const [NORTHGATE, SOLVARA, VARENNA] = OPTIONS.clubs;

function summaryOf(filters: Partial<Filters>) {
  const lines = filterSummary({ ...SAMPLE_OPEN_FILTERS, ...filters }, OPTIONS);
  return Object.fromEntries(lines.map((line) => [line.label, line.value]));
}

describe('filterSummary', () => {
  it('reads every open group as any', () => {
    expect(summaryOf({})).toEqual({
      Competition: 'Any',
      Club: 'Any',
      Era: 'Any season',
    });
  });

  it('keeps the rows in filter order', () => {
    const lines = filterSummary(SAMPLE_OPEN_FILTERS, OPTIONS);
    expect(lines.map((line) => line.label)).toEqual([
      'Competition',
      'Club',
      'Era',
    ]);
  });

  it('names one or two picks in catalog order', () => {
    expect(summaryOf({ competitionIds: [CUP.id] }).Competition).toBe(CUP.name);
    expect(summaryOf({ clubIds: [SOLVARA.id, NORTHGATE.id] }).Club).toBe(
      `${NORTHGATE.name}, ${SOLVARA.name}`,
    );
    expect(summaryOf({ competitionIds: [LEAGUE.id, CUP.id] }).Competition).toBe(
      `${CUP.name}, ${LEAGUE.name}`,
    );
  });

  it('counts past two picks', () => {
    const clubIds = [VARENNA.id, NORTHGATE.id, SOLVARA.id];
    expect(summaryOf({ clubIds }).Club).toBe(`${NORTHGATE.name} + 2 more`);
  });

  it('skips ids the catalog does not know', () => {
    expect(summaryOf({ clubIds: ['gone'] }).Club).toBe('Any');
  });

  it('reads a partial era as a range', () => {
    expect(summaryOf({ era: { from: 2004, to: 2010 } }).Era).toBe(
      '2004–05 to 2010–11',
    );
  });

  it('reads a single season on its own', () => {
    expect(summaryOf({ era: { from: 2009, to: 2009 } }).Era).toBe('2009–10');
  });

  it('reads an era past the catalog as any season', () => {
    const era = { from: OPTIONS.era.from - 2, to: OPTIONS.era.to + 1 };
    expect(summaryOf({ era }).Era).toBe('Any season');
  });

  it('keeps an era that touches one end as a range', () => {
    expect(summaryOf({ era: { from: OPTIONS.era.from, to: 2005 } }).Era).toBe(
      '2000–01 to 2005–06',
    );
  });
});

describe('coinFlipTitle', () => {
  it('names you when your set won', () => {
    expect(coinFlipTitle('you', SAMPLE_OPPONENT)).toBe('Your filters won');
  });

  it('names the opponent by handle when theirs won', () => {
    expect(coinFlipTitle('opponent', SAMPLE_OPPONENT)).toBe(
      `${SAMPLE_OPPONENT.handle}'s filters won`,
    );
  });
});

describe('lobbyGate', () => {
  const STEPS: DuelLobbyView[] = [
    { step: 'searching' },
    { step: 'paired', opponent: SAMPLE_OPPONENT },
    {
      step: 'filters',
      yours: [],
      submission: { yours: 'pending', theirs: 'pending' },
    },
    {
      step: 'coinFlip',
      winner: 'opponent',
      applied: [],
      opponent: SAMPLE_OPPONENT,
    },
    { step: 'noOpponent' },
  ];

  it('gives every step its own title', () => {
    const titles = STEPS.map((lobby) => lobbyGate(lobby).title);
    expect(new Set(titles).size).toBe(STEPS.length);
  });

  it('never carries a gate action; the panel owns them', () => {
    for (const lobby of STEPS) {
      expect(lobbyGate(lobby).actionLabel, lobby.step).toBeUndefined();
      expect(lobbyGate(lobby).choices, lobby.step).toBeUndefined();
    }
  });

  it('titles the flip with the winner', () => {
    expect(lobbyGate(STEPS[3]).title).toBe(
      coinFlipTitle('opponent', SAMPLE_OPPONENT),
    );
  });
});
