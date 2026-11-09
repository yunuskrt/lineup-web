import { describe, expect, it } from 'vitest';
import { overviewFrom } from '@/lib/api/mock/overview';
import {
  catalogOverviewSchema,
  competitionOptionSchema,
  directoryPlayerSchema,
  playerDirectorySchema,
  TOP_CLUBS_MAX,
} from '@/lib/api/schemas/catalog';
import type { CatalogOverview, Showcase } from '@/types/catalog';

const OPTION = {
  id: 'comp-a',
  kind: 'league',
  name: 'Alpha League',
  logoUrl: null,
  clubIds: ['club-a'],
  seasonStarts: [2004, 2010],
};

function parses(patch: Record<string, unknown>): boolean {
  return competitionOptionSchema.safeParse({ ...OPTION, ...patch }).success;
}

describe('competitionOptionSchema', () => {
  // Backend R3b always sends it, null or a URL
  it('rejects an option with no logoUrl', () => {
    expect(parses({ logoUrl: undefined })).toBe(false);
  });

  it('accepts a null, absolute or root-relative logoUrl', () => {
    expect(parses({ logoUrl: null })).toBe(true);
    expect(parses({ logoUrl: 'https://cdn.example.com/a.svg' })).toBe(true);
    expect(parses({ logoUrl: '/mock/competitions/a.svg' })).toBe(true);
  });

  it('rejects a logoUrl the image rule refuses', () => {
    expect(parses({ logoUrl: '//cdn.example.com/a.svg' })).toBe(false);
    expect(parses({ logoUrl: '' })).toBe(false);
  });

  it('accepts a competition with no clubs listed', () => {
    expect(parses({ clubIds: [] })).toBe(true);
  });

  it('rejects empty seasons or one outside the catalog range', () => {
    expect(parses({ seasonStarts: [] })).toBe(false);
    expect(parses({ seasonStarts: [1999] })).toBe(false);
    expect(parses({ seasonStarts: [2026] })).toBe(false);
    expect(parses({ seasonStarts: [2004.5] })).toBe(false);
  });

  it('rejects an empty club id', () => {
    expect(parses({ clubIds: [''] })).toBe(false);
  });
});

describe('directoryPlayerSchema', () => {
  const PLAYER = {
    key: 'Zq3_-k'.padEnd(22, 'A'),
    name: 'Zlatan Ibrahimović',
    imageUrl: 'https://cdn.example.com/players/zlatan.webp',
    terms: ['ibrahimovic', 'zlatan ibrahimovic'],
  };

  function directoryParses(patch: Record<string, unknown>): boolean {
    return directoryPlayerSchema.safeParse({ ...PLAYER, ...patch }).success;
  }

  it('accepts a player with a photo or without one', () => {
    expect(directoryParses({})).toBe(true);
    expect(directoryParses({ imageUrl: null })).toBe(true);
  });

  it('rejects a key that is not 22 base64url characters', () => {
    expect(directoryParses({ key: 'player-1' })).toBe(false);
    expect(directoryParses({ key: '+'.repeat(22) })).toBe(false);
  });

  it('needs at least one search term', () => {
    expect(directoryParses({ terms: [] })).toBe(false);
    expect(directoryParses({ terms: [''] })).toBe(false);
  });

  it('accepts an empty directory', () => {
    expect(playerDirectorySchema.safeParse({ players: [] }).success).toBe(true);
  });
});

const OVERVIEW = overviewFrom();

function showcaseOf(overview: CatalogOverview): Showcase {
  if (!overview.showcase) throw new Error('The mock has a showcase');
  return overview.showcase;
}

function withShowcase(patch: Partial<Showcase>): CatalogOverview {
  return { ...OVERVIEW, showcase: { ...showcaseOf(OVERVIEW), ...patch } };
}

function overviewParses(overview: unknown): boolean {
  return catalogOverviewSchema.safeParse(overview).success;
}

describe('catalogOverviewSchema', () => {
  it('accepts the R7 shape, with or without a showcase', () => {
    expect(overviewParses(OVERVIEW)).toBe(true);
    expect(overviewParses({ ...OVERVIEW, showcase: null })).toBe(true);
  });

  it('rejects a negative or fractional count', () => {
    const counts = { ...OVERVIEW.counts, matches: -1 };
    expect(overviewParses({ ...OVERVIEW, counts })).toBe(false);
    const highlights = { ...OVERVIEW.highlights, goals: 1.5 };
    expect(overviewParses({ ...OVERVIEW, highlights })).toBe(false);
  });

  it(`rejects more than ${TOP_CLUBS_MAX} top clubs`, () => {
    const [club] = OVERVIEW.topClubs;
    const topClubs = Array.from({ length: TOP_CLUBS_MAX + 1 }, (_, index) => ({
      ...club,
      id: `club-${index}`,
    }));
    expect(overviewParses({ ...OVERVIEW, topClubs })).toBe(false);
  });

  it('rejects a showcase without its whole XI', () => {
    const players = showcaseOf(OVERVIEW).players.slice(1);
    expect(overviewParses(withShowcase({ players }))).toBe(false);
  });

  it('rejects two players in one slot', () => {
    const [first, second, ...rest] = showcaseOf(OVERVIEW).players;
    const players = [first, { ...second, slot: first.slot }, ...rest];
    expect(overviewParses(withShowcase({ players }))).toBe(false);
  });

  it('rejects a duplicate reveal', () => {
    const { demo } = showcaseOf(OVERVIEW);
    const reveals = [demo.reveals[0], demo.reveals[0]];
    expect(overviewParses(withShowcase({ demo: { ...demo, reveals } }))).toBe(
      false,
    );
  });

  it('rejects a reveal outside the XI', () => {
    const { demo } = showcaseOf(OVERVIEW);
    const reveals = [...demo.reveals, 11];
    expect(overviewParses(withShowcase({ demo: { ...demo, reveals } }))).toBe(
      false,
    );
  });

  it('accepts a demo with no wrong guess', () => {
    const { demo } = showcaseOf(OVERVIEW);
    expect(
      overviewParses(withShowcase({ demo: { ...demo, miss: null } })),
    ).toBe(true);
  });
});
