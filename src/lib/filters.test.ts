import { describe, expect, it } from 'vitest';
import { filtersSchema } from '@/lib/api/schemas/common';
import {
  filtersFromParams,
  filtersToParams,
  playModeFrom,
  seasonLabel,
  seasonsIn,
  toggleId,
  widenFilters,
  withFilters,
  withMode,
  withQuery,
} from '@/lib/filters';
import type { FilterOptions } from '@/types/catalog';
import type { Filters } from '@/types/filters';

const OPTIONS: FilterOptions = {
  competitions: [
    { id: 'comp-a', kind: 'league', name: 'Alpha League' },
    { id: 'comp-b', kind: 'ucl', name: 'Beta Cup' },
  ],
  clubs: [
    { id: 'club-a', name: 'Aston', shortName: 'AST', crestUrl: null },
    { id: 'club-b', name: 'Borough', shortName: 'BOR', crestUrl: null },
  ],
  era: { from: 2002, to: 2023 },
};

const DEFAULTS: Filters = {
  competitionIds: [],
  clubIds: [],
  era: { from: 2002, to: 2023 },
};

function parse(query: string): Filters {
  return filtersFromParams(new URLSearchParams(query), OPTIONS);
}

describe('filtersFromParams', () => {
  it('falls back to any competition, any club and the full era', () => {
    expect(parse('')).toEqual(DEFAULTS);
  });

  it('reads repeated ids and a season range', () => {
    expect(
      parse('competition=comp-b&club=club-a&club=club-b&from=2004&to=2012'),
    ).toEqual({
      competitionIds: ['comp-b'],
      clubIds: ['club-a', 'club-b'],
      era: { from: 2004, to: 2012 },
    });
  });

  it('drops unknown ids and keeps catalog order without repeats', () => {
    expect(parse('club=club-x&club=club-b&club=club-a&club=club-b')).toEqual({
      ...DEFAULTS,
      clubIds: ['club-a', 'club-b'],
    });
  });

  it('clamps seasons into the available era', () => {
    expect(parse('from=1990&to=2099').era).toEqual({ from: 2002, to: 2023 });
    expect(parse('from=2010').era).toEqual({ from: 2010, to: 2023 });
  });

  it('ignores seasons that are not four-digit years', () => {
    for (const value of ['abc', '2004.5', '-2004', '', '20045']) {
      expect(parse(`from=${value}&to=${value}`).era).toEqual(DEFAULTS.era);
    }
  });

  it('resets a range whose start is after its end', () => {
    expect(parse('from=2015&to=2008').era).toEqual(DEFAULTS.era);
  });

  it('resets a range that clamping turns backwards', () => {
    expect(parse('from=2099&to=2010').era).toEqual(DEFAULTS.era);
  });

  it('always produces filters the contract accepts', () => {
    const queries = [
      '',
      'competition=comp-a&competition=nope&club=club-b',
      'from=1990&to=2099',
      'from=2099&to=1990',
      'from=abc&to=&club=',
      'mode=duel&from=2023&to=2002',
    ];
    for (const query of queries) {
      expect(filtersSchema.safeParse(parse(query)).success).toBe(true);
    }
  });
});

describe('filtersToParams', () => {
  it('gives an empty query for the defaults', () => {
    expect(filtersToParams(DEFAULTS, OPTIONS).toString()).toBe('');
  });

  it('writes only the values that differ from the defaults', () => {
    const params = filtersToParams(
      { ...DEFAULTS, clubIds: ['club-a'], era: { from: 2002, to: 2010 } },
      OPTIONS,
    );
    expect(params.toString()).toBe('club=club-a&to=2010');
  });

  it('round trips through filtersFromParams', () => {
    const filters: Filters = {
      competitionIds: ['comp-a', 'comp-b'],
      clubIds: ['club-b'],
      era: { from: 2005, to: 2019 },
    };
    expect(
      filtersFromParams(filtersToParams(filters, OPTIONS), OPTIONS),
    ).toEqual(filters);
  });
});

describe('toggleId', () => {
  it('adds an id in catalog order and removes it again', () => {
    const added = toggleId(['club-b'], 'club-a', OPTIONS.clubs);
    expect(added).toEqual(['club-a', 'club-b']);
    expect(toggleId(added, 'club-b', OPTIONS.clubs)).toEqual(['club-a']);
  });

  it('returns to any when the last id is removed', () => {
    expect(toggleId(['club-a'], 'club-a', OPTIONS.clubs)).toEqual([]);
  });
});

describe('withMode', () => {
  it('writes duel and leaves solo out as the default', () => {
    const params = new URLSearchParams('club=club-a&mode=duel');
    expect(withMode(params, 'solo').toString()).toBe('club=club-a');
    expect(withMode(params, 'duel').toString()).toBe('club=club-a&mode=duel');
    expect(params.toString()).toBe('club=club-a&mode=duel');
  });
});

describe('playModeFrom', () => {
  it('reads duel and defaults everything else to solo', () => {
    expect(playModeFrom('duel')).toBe('duel');
    expect(playModeFrom('solo')).toBe('solo');
    expect(playModeFrom('DUEL')).toBe('solo');
    expect(playModeFrom(null)).toBe('solo');
  });
});

describe('seasonLabel', () => {
  it('joins the start year to the next two digits with an en dash', () => {
    expect(seasonLabel(2004)).toBe('2004–05');
    expect(seasonLabel(2025)).toBe('2025–26');
    expect(seasonLabel(2009)).toBe('2009–10');
    expect(seasonLabel(1999)).toBe('1999–00');
  });
});

describe('seasonsIn', () => {
  it('lists every season start in the range', () => {
    expect(seasonsIn({ from: 2002, to: 2005 })).toEqual([
      2002, 2003, 2004, 2005,
    ]);
    expect(seasonsIn({ from: 2010, to: 2010 })).toEqual([2010]);
  });
});

describe('withQuery', () => {
  it('appends a query only when there is one', () => {
    expect(withQuery('/play/solo', new URLSearchParams())).toBe('/play/solo');
    expect(withQuery('/play/solo', new URLSearchParams('club=club-a'))).toBe(
      '/play/solo?club=club-a',
    );
  });
});

describe('widenFilters', () => {
  const narrow: Filters = {
    competitionIds: ['comp-a'],
    clubIds: ['club-b'],
    era: { from: 2010, to: 2012 },
  };

  it('clears only the group the server blamed', () => {
    expect(widenFilters(narrow, 'competition', OPTIONS)).toEqual({
      ...narrow,
      competitionIds: [],
    });
    expect(widenFilters(narrow, 'club', OPTIONS)).toEqual({
      ...narrow,
      clubIds: [],
    });
    expect(widenFilters(narrow, 'era', OPTIONS)).toEqual({
      ...narrow,
      era: OPTIONS.era,
    });
  });

  it('has nothing to widen when no single group is to blame', () => {
    expect(widenFilters(narrow, 'combination', OPTIONS)).toBeNull();
  });

  it('keeps the result a valid filter set', () => {
    for (const reason of ['competition', 'club', 'era'] as const) {
      const widened = widenFilters(narrow, reason, OPTIONS);
      expect(filtersSchema.safeParse(widened).success, reason).toBe(true);
    }
  });
});

describe('withFilters', () => {
  it('swaps the filter params and keeps the rest', () => {
    const params = new URLSearchParams(
      'mode=duel&competition=comp-a&club=club-b&from=2010',
    );
    const next = withFilters(
      params,
      { ...DEFAULTS, clubIds: ['club-b'] },
      OPTIONS,
    );
    expect(next.toString()).toBe('mode=duel&club=club-b');
  });

  it('leaves the source params untouched', () => {
    const params = new URLSearchParams('competition=comp-a');
    withFilters(params, DEFAULTS, OPTIONS);
    expect(params.toString()).toBe('competition=comp-a');
  });
});
