import { describe, expect, it, vi } from 'vitest';
import { CLUBS, COMPETITIONS } from '@/lib/api/mock/data/competitions';
import { FIXTURES } from '@/lib/api/mock/data/fixtures';
import {
  emptyReason,
  filterOptionsFrom,
  PLAYABLE_FIXTURES,
  seasonStart,
  selectFixture,
} from '@/lib/api/mock/pool';
import { MOCK_SHOWCASE } from '@/lib/api/mock/showcase';
import type { FixtureSelection } from '@/lib/api/mock/pool';
import type { MockFixture } from '@/lib/api/mock/types';
import { filterOptionsSchema } from '@/lib/api/schemas/catalog';
import {
  FIRST_SEASON_START,
  LAST_SEASON_START,
} from '@/lib/api/schemas/common';
import type { Filters } from '@/types/filters';

const OPEN: Filters = {
  competitionIds: [],
  clubIds: [],
  era: { from: FIRST_SEASON_START, to: LAST_SEASON_START },
};

function picked(selection: FixtureSelection): MockFixture {
  if (!('fixture' in selection)) {
    throw new Error(`Empty pool: ${selection.emptyBecause}`);
  }
  return selection.fixture;
}

// Every fixture a filter set reaches, one per slot
function reachable(filters: Filters): MockFixture[] {
  const found = new Map<string, MockFixture>();
  for (let step = 0; step < 100; step += 1) {
    const selection = selectFixture(filters, () => step / 100);
    if ('fixture' in selection) {
      found.set(selection.fixture.identity.id, selection.fixture);
    }
  }
  return [...found.values()];
}

describe('selectFixture', () => {
  it('is deterministic for an injected random', () => {
    const first = picked(selectFixture(OPEN, () => 0.42));
    const again = picked(selectFixture(OPEN, () => 0.42));
    expect(again.identity.id).toBe(first.identity.id);
  });

  it('reaches every playable fixture with no filters', () => {
    expect(reachable(OPEN)).toHaveLength(PLAYABLE_FIXTURES.length);
  });

  // Its XI is on the landing page (HC 2)
  it('never serves the showcase fixture', () => {
    expect(PLAYABLE_FIXTURES).toHaveLength(FIXTURES.length - 1);
    const ids = reachable(OPEN).map((f) => f.identity.id);
    expect(ids).not.toContain(MOCK_SHOWCASE.fixtureId);
    const theirs = reachable({
      ...OPEN,
      competitionIds: ['comp-continental-cup'],
    });
    expect(theirs.map((f) => f.identity.id)).not.toContain(
      MOCK_SHOWCASE.fixtureId,
    );
  });

  it('stays in range when random returns its upper edge', () => {
    expect(picked(selectFixture(OPEN, () => 0.9999999))).toBeDefined();
  });

  it('narrows by competition', () => {
    const matches = reachable({
      ...OPEN,
      competitionIds: ['comp-crown-league'],
    });

    expect(matches.length).toBeGreaterThan(1);
    for (const f of matches) {
      expect(f.identity.competition.id).toBe('comp-crown-league');
    }
  });

  it('narrows by club on either side', () => {
    const matches = reachable({ ...OPEN, clubIds: ['club-northgate'] });
    const sides = matches.map((f) =>
      f.identity.home.id === 'club-northgate' ? 'home' : 'away',
    );

    expect(matches.length).toBeGreaterThanOrEqual(3);
    expect(new Set(sides)).toEqual(new Set(['home', 'away']));
    for (const f of matches) {
      expect([f.identity.home.id, f.identity.away.id]).toContain(
        'club-northgate',
      );
    }
  });

  it('narrows by era, inclusive at both ends', () => {
    const matches = reachable({ ...OPEN, era: { from: 2009, to: 2014 } });

    expect(matches.map(seasonStart).sort()).toEqual([2009, 2011, 2012, 2014]);
  });

  it('blames the competition when dropping it refills the pool', () => {
    expect(
      selectFixture(
        {
          ...OPEN,
          competitionIds: ['comp-nations-championship'],
          clubIds: ['club-northgate'],
        },
        () => 0,
      ),
    ).toEqual({ emptyBecause: 'competition' });
  });

  it('blames the club when only dropping it refills the pool', () => {
    expect(
      selectFixture(
        {
          competitionIds: ['comp-crown-league'],
          clubIds: ['club-yildirimspor'],
          era: { from: 2000, to: 2003 },
        },
        () => 0,
      ),
    ).toEqual({ emptyBecause: 'club' });
  });

  it('blames the era when nothing else is set', () => {
    expect(
      selectFixture({ ...OPEN, era: { from: 2000, to: 2001 } }, () => 0),
    ).toEqual({ emptyBecause: 'era' });
  });

  it('blames the combination when no single filter is at fault', () => {
    expect(
      selectFixture(
        {
          competitionIds: ['comp-crown-league'],
          clubIds: ['club-yildirimspor'],
          era: { from: 2020, to: 2025 },
        },
        () => 0,
      ),
    ).toEqual({ emptyBecause: 'combination' });
  });

  it('selects from an injected fixture list', () => {
    const only = FIXTURES.slice(0, 1);
    expect(picked(selectFixture(OPEN, () => 0.9, only))).toBe(only[0]);
  });
});

describe('emptyReason', () => {
  it('is null whenever the filters reach a fixture', () => {
    expect(emptyReason(OPEN)).toBeNull();
    expect(emptyReason({ ...OPEN, clubIds: ['club-northgate'] })).toBeNull();
  });

  it('agrees with selectFixture on every empty case', () => {
    const empties: Filters[] = [
      { ...OPEN, competitionIds: ['comp-nowhere'] },
      { ...OPEN, era: { from: 2000, to: 2001 } },
      {
        competitionIds: ['comp-crown-league'],
        clubIds: ['club-yildirimspor'],
        era: { from: 2020, to: 2025 },
      },
    ];

    for (const filters of empties) {
      const selection = selectFixture(filters, () => 0);
      expect(selection).toEqual({ emptyBecause: emptyReason(filters) });
    }
  });

  // The duel checks with it; seeded draws must hold
  it('never consumes a random draw', () => {
    const random = vi.fn(() => 0);
    emptyReason(OPEN);
    emptyReason({ ...OPEN, era: { from: 2000, to: 2001 } });
    expect(random).not.toHaveBeenCalled();

    selectFixture({ ...OPEN, era: { from: 2000, to: 2001 } }, random);
    expect(random).not.toHaveBeenCalled();
  });
});

describe('filterOptionsFrom', () => {
  it('lists what the fixtures contain, sorted by name', () => {
    const options = filterOptionsFrom(FIXTURES);
    const byName = (a: { name: string }, b: { name: string }) =>
      a.name.localeCompare(b.name);

    expect(options.competitions).toEqual(
      [...COMPETITIONS].sort(byName).map((ref) => expect.objectContaining(ref)),
    );
    expect(options.clubs).toEqual([...CLUBS].sort(byName));
  });

  it("links each competition to its fixtures' clubs and seasons", () => {
    const options = filterOptionsFrom(FIXTURES);
    const clubOrder = options.clubs.map((club) => club.id);

    for (const competition of options.competitions) {
      const own = FIXTURES.filter(
        (fixture) => fixture.identity.competition.id === competition.id,
      );
      const clubIds = new Set(
        own.flatMap(({ identity }) => [identity.home.id, identity.away.id]),
      );
      expect(new Set(competition.clubIds)).toEqual(clubIds);
      expect(competition.clubIds).toEqual(
        clubOrder.filter((id) => clubIds.has(id)),
      );
      expect(competition.seasonStarts).toEqual(
        [...new Set(own.map(seasonStart))].sort((a, b) => a - b),
      );
      expect(competition.seasonStarts.length).toBeGreaterThan(0);
      for (const season of competition.seasonStarts) {
        expect(season).toBeGreaterThanOrEqual(options.era.from);
        expect(season).toBeLessThanOrEqual(options.era.to);
      }
    }
  });

  it('sorts seasons whatever order the fixtures come in', () => {
    const options = filterOptionsFrom([...FIXTURES].reverse());
    for (const { seasonStarts } of options.competitions) {
      expect(seasonStarts).toEqual([...seasonStarts].sort((a, b) => a - b));
    }
    expect(
      options.competitions.some(({ seasonStarts }) => seasonStarts.length > 1),
    ).toBe(true);
  });

  it('parses against the catalog contract', () => {
    expect(
      filterOptionsSchema.safeParse(filterOptionsFrom(FIXTURES)).success,
    ).toBe(true);
  });

  it('spans the earliest to the latest season start', () => {
    const starts = FIXTURES.map(seasonStart);
    expect(filterOptionsFrom(FIXTURES).era).toEqual({
      from: Math.min(...starts),
      to: Math.max(...starts),
    });
  });

  it('falls back to the full range for an empty list', () => {
    expect(filterOptionsFrom([]).era).toEqual({
      from: FIRST_SEASON_START,
      to: LAST_SEASON_START,
    });
  });
});
