import { describe, expect, it } from 'vitest';
import { FIXTURES, squadFor } from '@/lib/api/mock/data/fixtures';
import { overviewFrom, showcaseFrom } from '@/lib/api/mock/overview';
import { PLAYABLE_FIXTURES } from '@/lib/api/mock/pool';
import { MOCK_SHOWCASE } from '@/lib/api/mock/showcase';
import type { MockFixture } from '@/lib/api/mock/types';
import { TOP_CLUBS_MAX } from '@/lib/api/schemas/catalog';
import type { Showcase } from '@/types/catalog';

const OVERVIEW = overviewFrom();

function requireShowcase(showcase: Showcase | null): Showcase {
  if (!showcase) throw new Error('Expected a showcase');
  return showcase;
}

function fixture(id: string): MockFixture {
  const found = FIXTURES.find((f) => f.identity.id === id);
  if (!found) throw new Error(`Unknown fixture ${id}`);
  return found;
}

describe('overviewFrom', () => {
  it('counts the playable pool only, never the showcase', () => {
    expect(OVERVIEW.counts.matches).toBe(PLAYABLE_FIXTURES.length);
    expect(OVERVIEW.counts.matches).toBe(FIXTURES.length - 1);
  });

  it('counts a player who starts twice once', () => {
    const ids = PLAYABLE_FIXTURES.flatMap((f) =>
      [...f.home.squad, ...f.away.squad].map((entry) => entry.playerId),
    );
    expect(ids.length).toBeGreaterThan(new Set(ids).size);
    expect(OVERVIEW.counts.players).toBe(new Set(ids).size);
  });

  it('splits clubs from national teams by competition kind', () => {
    const { clubs, nationalTeams } = OVERVIEW.counts;
    expect(clubs).toBeGreaterThan(0);
    expect(nationalTeams).toBeGreaterThan(0);
    const sides = new Set(
      PLAYABLE_FIXTURES.flatMap((f) => [
        f.identity.home.id,
        f.identity.away.id,
      ]),
    );
    expect(clubs + nationalTeams).toBe(sides.size);
  });

  it('adds up finals, shootouts, extra time and goals', () => {
    const goals = PLAYABLE_FIXTURES.reduce(
      (sum, f) => sum + f.identity.score.home + f.identity.score.away,
      0,
    );
    expect(OVERVIEW.highlights).toEqual({
      finals: PLAYABLE_FIXTURES.filter((f) => f.identity.stage === 'Final')
        .length,
      shootouts: 2,
      extraTime: 2,
      goals,
    });
  });

  it('counts distinct season starts, within the era', () => {
    const { seasons } = OVERVIEW.counts;
    const { from, to } = OVERVIEW.era;
    expect(seasons).toBeGreaterThan(1);
    expect(seasons).toBeLessThanOrEqual(to - from + 1);
  });

  it('ranks clubs by matches, ties by name, clubs only', () => {
    const [first] = OVERVIEW.topClubs;
    expect(first.id).toBe('club-northgate');
    expect(OVERVIEW.topClubs.length).toBeLessThanOrEqual(TOP_CLUBS_MAX);
    expect(OVERVIEW.topClubs.some((club) => club.id.startsWith('nat-'))).toBe(
      false,
    );
  });

  it('lists each competition once, as a plain reference', () => {
    const ids = OVERVIEW.competitions.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(Object.keys(OVERVIEW.competitions[0]).sort()).toEqual([
      'id',
      'kind',
      'logoUrl',
      'name',
    ]);
  });
});

describe('showcaseFrom', () => {
  const showcase = requireShowcase(OVERVIEW.showcase);
  const source = fixture(MOCK_SHOWCASE.fixtureId);

  it('sends the named side whole, with the demo in its order', () => {
    expect(showcase.match.id).toBe(MOCK_SHOWCASE.fixtureId);
    expect(showcase.match.side).toBe(MOCK_SHOWCASE.side);
    expect(showcase.players).toHaveLength(11);
    const named = showcase.demo.reveals.map(
      (slot) => showcase.players.find((player) => player.slot === slot)?.id,
    );
    expect(named).toEqual(MOCK_SHOWCASE.reveals);
  });

  // The demo's "Not in this XI" must be true
  it('takes the wrong guess from the other side', () => {
    const miss = showcase.demo.miss;
    expect(miss).not.toBeNull();
    const own = squadFor(source, MOCK_SHOWCASE.side).map((e) => e.name);
    expect(own).not.toContain(miss?.name);
    const other = squadFor(source, 'away').map((e) => e.name);
    expect(other).toContain(miss?.name);
  });

  it('is null when the constant no longer fits', () => {
    expect(showcaseFrom({ ...MOCK_SHOWCASE, fixtureId: 'nope' })).toBeNull();
    expect(
      showcaseFrom({ ...MOCK_SHOWCASE, reveals: ['pl-samuel-ekwueme'] }),
    ).toBeNull();
    expect(
      showcaseFrom({ ...MOCK_SHOWCASE, miss: 'pl-emeka-nwosu' }),
    ).toBeNull();
  });
});
