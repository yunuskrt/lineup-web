import { describe, expect, it } from 'vitest';
import { filtersSchema } from '@/lib/api/schemas/common';
import {
  CLUB_RESULTS_MAX,
  clubRowView,
  clubsFor,
  competitionGroups,
  effectiveSeasons,
  filtersFromParams,
  filtersToParams,
  fitEra,
  pickedCompetition,
  playModeFrom,
  searchClubs,
  searchKey,
  seasonLabel,
  seasonsIn,
  selectCompetition,
  toggleId,
  widenFilters,
  withFilters,
  withMode,
  withoutParams,
  withQuery,
} from '@/lib/filters';
import type { FilterOptions } from '@/types/catalog';
import type { Filters } from '@/types/filters';
import type { ClubRef } from '@/types/match';

function club(id: string, name: string, shortName: string): ClubRef {
  return { id, name, shortName, crestUrl: null };
}

const OPTIONS: FilterOptions = {
  competitions: [
    {
      id: 'comp-a',
      kind: 'league',
      name: 'Alpha League',
      logoUrl: null,
      clubIds: ['club-a', 'club-b'],
      seasonStarts: [2004, 2005, 2006, 2010, 2012],
    },
    {
      id: 'comp-b',
      kind: 'ucl',
      name: 'Beta Cup',
      logoUrl: null,
      clubIds: ['club-b', 'club-c'],
      seasonStarts: [2002, 2006, 2023],
    },
    {
      id: 'comp-w',
      kind: 'world_cup',
      name: 'World Cup',
      logoUrl: null,
      clubIds: ['nat-d'],
      seasonStarts: [2006],
    },
  ],
  clubs: [
    club('club-a', 'Aston', 'AST'),
    club('club-c', 'Beşiktaş', 'BJK'),
    club('club-b', 'Borough', 'BOR'),
    club('nat-d', 'Denmark', 'DEN'),
  ],
  era: { from: 2002, to: 2023 },
};

const [ALPHA, BETA] = OPTIONS.competitions;

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

  it('reads a competition, repeated clubs and a season range', () => {
    expect(
      parse('competition=comp-a&club=club-a&club=club-b&from=2005&to=2010'),
    ).toEqual({
      competitionIds: ['comp-a'],
      clubIds: ['club-a', 'club-b'],
      era: { from: 2005, to: 2010 },
    });
  });

  it('keeps the first known competition of an old link', () => {
    expect(
      parse('competition=nope&competition=comp-b&competition=comp-a')
        .competitionIds,
    ).toEqual(['comp-b']);
  });

  it("keeps only the competition's clubs", () => {
    expect(parse('competition=comp-b&club=club-a&club=club-c').clubIds).toEqual(
      ['club-c'],
    );
  });

  it("snaps seasons onto the competition's own", () => {
    expect(parse('competition=comp-b').era).toEqual({ from: 2002, to: 2023 });
    expect(parse('competition=comp-b&from=2003&to=2022').era).toEqual({
      from: 2006,
      to: 2006,
    });
    expect(parse('competition=comp-w&from=2007').era).toEqual({
      from: 2006,
      to: 2006,
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

  it("leaves out a competition's full season range", () => {
    const params = filtersToParams(
      {
        competitionIds: [ALPHA.id],
        clubIds: [],
        era: { from: 2004, to: 2010 },
      },
      OPTIONS,
    );
    expect(params.toString()).toBe('competition=comp-a&to=2010');
  });

  it('round trips through filtersFromParams', () => {
    const filters: Filters = {
      competitionIds: ['comp-a'],
      clubIds: ['club-b'],
      era: { from: 2005, to: 2010 },
    };
    expect(
      filtersFromParams(filtersToParams(filters, OPTIONS), OPTIONS),
    ).toEqual(filters);
  });
});

describe('competitionGroups', () => {
  it('groups by kind in a fixed order and skips empty groups', () => {
    const groups = competitionGroups(OPTIONS.competitions);
    expect(
      groups.map((group) => [
        group.label,
        group.competitions.map((competition) => competition.id),
      ]),
    ).toEqual([
      ['Leagues', ['comp-a']],
      ['European cups', ['comp-b']],
      ['International', ['comp-w']],
    ]);
    expect(competitionGroups([ALPHA]).map((group) => group.label)).toEqual([
      'Leagues',
    ]);
  });

  it('keeps catalog order inside a group', () => {
    const uel = { ...BETA, id: 'comp-u', kind: 'uel' as const, name: 'Aaa' };
    const [europe] = competitionGroups([BETA, uel]);
    expect(europe.competitions.map((competition) => competition.id)).toEqual([
      'comp-b',
      'comp-u',
    ]);
  });
});

describe('pickedCompetition', () => {
  it('finds exactly one known competition', () => {
    expect(
      pickedCompetition({ ...DEFAULTS, competitionIds: ['comp-b'] }, OPTIONS),
    ).toBe(BETA);
  });

  it('is null for none, several or an unknown id', () => {
    for (const competitionIds of [[], ['comp-a', 'comp-b'], ['gone']]) {
      expect(
        pickedCompetition({ ...DEFAULTS, competitionIds }, OPTIONS),
      ).toBeNull();
    }
  });
});

describe('clubsFor', () => {
  it("lists a competition's clubs in catalog order", () => {
    expect(clubsFor(OPTIONS, BETA).map((item) => item.id)).toEqual([
      'club-c',
      'club-b',
    ]);
  });

  it('lists every club with no competition', () => {
    expect(clubsFor(OPTIONS, null)).toEqual(OPTIONS.clubs);
  });
});

describe('effectiveSeasons', () => {
  it("offers the competition's seasons, or the whole era", () => {
    expect(
      effectiveSeasons({ ...DEFAULTS, competitionIds: ['comp-b'] }, OPTIONS),
    ).toEqual([2002, 2006, 2023]);
    expect(effectiveSeasons(DEFAULTS, OPTIONS)).toEqual(seasonsIn(OPTIONS.era));
  });
});

describe('fitEra', () => {
  const seasons = [2004, 2006, 2010, 2012];

  it('moves each bound inward to an offered season', () => {
    expect(fitEra({ from: 2005, to: 2011 }, seasons)).toEqual({
      from: 2006,
      to: 2010,
    });
    expect(fitEra({ from: 2000, to: 2030 }, seasons)).toEqual({
      from: 2004,
      to: 2012,
    });
  });

  it('resets to the full range when nothing fits', () => {
    expect(fitEra({ from: 2007, to: 2009 }, seasons)).toEqual({
      from: 2004,
      to: 2012,
    });
    expect(fitEra({ from: 2013, to: 2020 }, seasons)).toEqual({
      from: 2004,
      to: 2012,
    });
  });
});

describe('selectCompetition', () => {
  it("drops the clubs a competition doesn't have", () => {
    const filters = { ...DEFAULTS, clubIds: ['club-a', 'club-b'] };
    expect(selectCompetition(filters, 'comp-b', OPTIONS)).toEqual({
      competitionIds: ['comp-b'],
      clubIds: ['club-b'],
      era: { from: 2002, to: 2023 },
    });
  });

  it('keeps the clubs when going back to any', () => {
    const filters = {
      competitionIds: ['comp-b'],
      clubIds: ['club-c'],
      era: { from: 2002, to: 2023 },
    };
    expect(selectCompetition(filters, null, OPTIONS).clubIds).toEqual([
      'club-c',
    ]);
  });

  it('lets an untouched era follow the competition', () => {
    const alpha = selectCompetition(DEFAULTS, 'comp-a', OPTIONS);
    expect(alpha.era).toEqual({ from: 2004, to: 2012 });
    expect(selectCompetition(alpha, 'comp-w', OPTIONS).era).toEqual({
      from: 2006,
      to: 2006,
    });
    expect(selectCompetition(alpha, null, OPTIONS).era).toEqual(OPTIONS.era);
  });

  it('keeps a narrowed era where it fits', () => {
    const narrow = { ...DEFAULTS, era: { from: 2005, to: 2011 } };
    expect(selectCompetition(narrow, 'comp-a', OPTIONS).era).toEqual({
      from: 2005,
      to: 2010,
    });
    expect(selectCompetition(narrow, 'comp-b', OPTIONS).era).toEqual({
      from: 2006,
      to: 2006,
    });
  });

  it('resets a narrowed era that the competition misses', () => {
    const narrow = { ...DEFAULTS, era: { from: 2013, to: 2020 } };
    expect(selectCompetition(narrow, 'comp-a', OPTIONS).era).toEqual({
      from: 2004,
      to: 2012,
    });
  });

  it('always produces filters the contract accepts', () => {
    for (const id of [null, 'comp-a', 'comp-b', 'comp-w']) {
      const next = selectCompetition(DEFAULTS, id, OPTIONS);
      expect(filtersSchema.safeParse(next).success, String(id)).toBe(true);
    }
  });
});

describe('searchKey', () => {
  it('folds case, accents and Turkish and Nordic letters', () => {
    expect(searchKey('Beşiktaş')).toBe('besiktas');
    expect(searchKey('Atlético')).toBe('atletico');
    expect(searchKey('İstanbul')).toBe('istanbul');
    expect(searchKey('Kasımpaşa')).toBe('kasimpasa');
    expect(searchKey('Brøndby')).toBe('brondby');
    expect(searchKey('Łódź')).toBe('lodz');
    expect(searchKey('Đakovo')).toBe('dakovo');
    expect(searchKey('  Inter ')).toBe('inter');
  });
});

describe('searchClubs', () => {
  it('matches inside the name or the short code', () => {
    const ids = (query: string) =>
      searchClubs(OPTIONS.clubs, query).map((item) => item.id);
    expect(ids('besik')).toEqual(['club-c']);
    expect(ids('ORO')).toEqual(['club-b']);
    expect(ids('bjk')).toEqual(['club-c']);
    expect(ids('zzz')).toEqual([]);
  });
});

describe('clubRowView', () => {
  const many: FilterOptions = {
    ...OPTIONS,
    competitions: [
      { ...ALPHA, clubIds: Array.from({ length: 20 }, (_, i) => `c${i}`) },
    ],
    clubs: Array.from({ length: 20 }, (_, i) =>
      club(`c${i}`, `Club ${String(i).padStart(2, '0')}`, `C${i}`),
    ),
  };
  const ids = (view: { clubs: ClubRef[] }) => view.clubs.map((item) => item.id);

  it('shows no clubs with no competition until a search', () => {
    const view = clubRowView(DEFAULTS, OPTIONS, '');
    expect(view).toMatchObject({
      hasSearch: true,
      isSearchingAll: true,
      matchCount: null,
      moreCount: 0,
    });
    expect(view.clubs).toEqual([]);
    expect(clubRowView(DEFAULTS, OPTIONS, 'b').clubs).toEqual([]);
  });

  it('searches every club from two characters', () => {
    const view = clubRowView(DEFAULTS, OPTIONS, 'bo');
    expect(ids(view)).toEqual(['club-b']);
    expect(view.matchCount).toBe(1);
  });

  it('always shows selected clubs, in catalog order', () => {
    const filters = { ...DEFAULTS, clubIds: ['nat-d'] };
    expect(ids(clubRowView(filters, OPTIONS, ''))).toEqual(['nat-d']);
    expect(ids(clubRowView(filters, OPTIONS, 'as'))).toEqual([
      'club-a',
      'club-c',
      'nat-d',
    ]);
  });

  it(`caps an open search at ${CLUB_RESULTS_MAX} and counts the rest`, () => {
    const open = { ...many, competitions: [] };
    const view = clubRowView(DEFAULTS, open, 'club');
    expect(view.clubs).toHaveLength(CLUB_RESULTS_MAX);
    expect(view.moreCount).toBe(20 - CLUB_RESULTS_MAX);
    expect(view.matchCount).toBe(20);

    const picked = clubRowView({ ...DEFAULTS, clubIds: ['c19'] }, open, 'club');
    expect(picked.clubs).toHaveLength(CLUB_RESULTS_MAX + 1);
    expect(picked.moreCount).toBe(20 - CLUB_RESULTS_MAX - 1);
  });

  it("lists a small competition's clubs with no search box", () => {
    const filters = { ...DEFAULTS, competitionIds: ['comp-b'] };
    const view = clubRowView(filters, OPTIONS, 'ignored');
    expect(ids(view)).toEqual(['club-c', 'club-b']);
    expect(view).toMatchObject({ hasSearch: false, isSearchingAll: false });
  });

  it('narrows a large competition from one character, uncapped', () => {
    const filters = { ...DEFAULTS, competitionIds: ['comp-a'] };
    expect(clubRowView(filters, many, '').clubs).toHaveLength(20);
    const view = clubRowView(filters, many, '1');
    expect(view.hasSearch).toBe(true);
    expect(ids(view)).toEqual([
      'c1',
      'c10',
      'c11',
      'c12',
      'c13',
      'c14',
      'c15',
      'c16',
      'c17',
      'c18',
      'c19',
    ]);
    expect(view.moreCount).toBe(0);
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
      era: { from: 2004, to: 2012 },
    });
  });

  it('lets an untouched era follow when the competition goes', () => {
    const untouched = { ...narrow, era: { from: 2004, to: 2012 } };
    expect(widenFilters(untouched, 'competition', OPTIONS)).toEqual({
      competitionIds: [],
      clubIds: ['club-b'],
      era: OPTIONS.era,
    });
  });

  it('widens the era to the whole catalog with no competition', () => {
    const open = { ...narrow, competitionIds: [] };
    expect(widenFilters(open, 'era', OPTIONS)?.era).toEqual(OPTIONS.era);
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

describe('withoutParams', () => {
  it('drops the named leftovers and keeps the filters', () => {
    const params = new URLSearchParams('room=create&mode=duel&club=c-1');
    expect(withoutParams(params, ['room']).toString()).toBe(
      'mode=duel&club=c-1',
    );
    expect(withoutParams(params, ['room', 'mode']).toString()).toBe('club=c-1');
    expect(params.has('room')).toBe(true);
  });

  it('ignores a name that is not there', () => {
    const params = new URLSearchParams('club=c-1');
    expect(withoutParams(params, ['match']).toString()).toBe('club=c-1');
  });
});
