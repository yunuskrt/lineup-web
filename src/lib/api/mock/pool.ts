import { FIXTURES } from '@/lib/api/mock/data/fixtures';
import type { MockFixture } from '@/lib/api/mock/types';
import {
  FIRST_SEASON_START,
  LAST_SEASON_START,
} from '@/lib/api/schemas/common';
import type { FilterOptions } from '@/types/catalog';
import type { Filters } from '@/types/filters';
import type { ClubRef, CompetitionRef } from '@/types/match';

type FilterKey = 'competition' | 'club' | 'era';

export type EmptyPoolReason = FilterKey | 'combination';

export type FixtureSelection =
  { fixture: MockFixture } | { emptyBecause: EmptyPoolReason };

const FILTER_ORDER: readonly FilterKey[] = ['competition', 'club', 'era'];

export function seasonStart(fixture: MockFixture): number {
  return Number.parseInt(fixture.identity.season.slice(0, 4), 10);
}

const PASSES: Record<
  FilterKey,
  (fixture: MockFixture, filters: Filters) => boolean
> = {
  competition: (fixture, filters) =>
    filters.competitionIds.length === 0 ||
    filters.competitionIds.includes(fixture.identity.competition.id),
  club: (fixture, filters) =>
    filters.clubIds.length === 0 ||
    filters.clubIds.includes(fixture.identity.home.id) ||
    filters.clubIds.includes(fixture.identity.away.id),
  era: (fixture, filters) => {
    const start = seasonStart(fixture);
    return start >= filters.era.from && start <= filters.era.to;
  },
};

function matching(
  fixtures: readonly MockFixture[],
  filters: Filters,
  ignored: FilterKey | null = null,
): MockFixture[] {
  return fixtures.filter((fixture) =>
    FILTER_ORDER.every(
      (key) => key === ignored || PASSES[key](fixture, filters),
    ),
  );
}

// Blame the first filter whose removal refills it
function blame(
  filters: Filters,
  fixtures: readonly MockFixture[],
): EmptyPoolReason {
  const culprit = FILTER_ORDER.find(
    (key) => matching(fixtures, filters, key).length > 0,
  );
  return culprit ?? 'combination';
}

export function emptyReason(
  filters: Filters,
  fixtures: readonly MockFixture[] = FIXTURES,
): EmptyPoolReason | null {
  if (matching(fixtures, filters).length > 0) return null;
  return blame(filters, fixtures);
}

export function selectFixture(
  filters: Filters,
  random: () => number,
  fixtures: readonly MockFixture[] = FIXTURES,
): FixtureSelection {
  const pool = matching(fixtures, filters);
  if (pool.length === 0) return { emptyBecause: blame(filters, fixtures) };

  const index = Math.min(pool.length - 1, Math.floor(random() * pool.length));
  return { fixture: pool[index] };
}

function uniqueById<T extends { id: string; name: string }>(
  items: readonly T[],
): T[] {
  const byId = new Map(items.map((item) => [item.id, item]));
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function filterOptionsFrom(
  fixtures: readonly MockFixture[] = FIXTURES,
): FilterOptions {
  const competitions: CompetitionRef[] = fixtures.map(
    (fixture) => fixture.identity.competition,
  );
  const clubs: ClubRef[] = fixtures.flatMap((fixture) => [
    fixture.identity.home,
    fixture.identity.away,
  ]);
  const starts = fixtures.map(seasonStart);

  return {
    competitions: uniqueById(competitions),
    clubs: uniqueById(clubs),
    era:
      starts.length === 0
        ? { from: FIRST_SEASON_START, to: LAST_SEASON_START }
        : { from: Math.min(...starts), to: Math.max(...starts) },
  };
}
