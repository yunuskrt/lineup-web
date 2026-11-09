import { fixtureById, squadFor } from '@/lib/api/mock/data/fixtures';
import { directoryKeyFor } from '@/lib/api/mock/directory';
import { toRevealed } from '@/lib/api/mock/engine';
import {
  filterOptionsFrom,
  PLAYABLE_FIXTURES,
  seasonStart,
} from '@/lib/api/mock/pool';
import { MOCK_SHOWCASE } from '@/lib/api/mock/showcase';
import type { MockFixture } from '@/lib/api/mock/types';
import { TOP_CLUBS_MAX } from '@/lib/api/schemas/catalog';
import type { CatalogOverview, Showcase } from '@/types/catalog';
import type { ClubRef, CompetitionKind, Side } from '@/types/match';

// The mock's clubs carry no kind; tournaments tell
const NATIONAL_TEAM_KINDS: ReadonlySet<CompetitionKind> = new Set([
  'world_cup',
  'euro',
]);

const OTHER_SIDE: Record<Side, Side> = { home: 'away', away: 'home' };

const NAME_ORDER = new Intl.Collator('en');

function sidesOf(fixture: MockFixture): ClubRef[] {
  return [fixture.identity.home, fixture.identity.away];
}

function isNationalTeamFixture(fixture: MockFixture): boolean {
  return NATIONAL_TEAM_KINDS.has(fixture.identity.competition.kind);
}

function topClubsOf(fixtures: readonly MockFixture[]): ClubRef[] {
  const counts = new Map<string, { club: ClubRef; matches: number }>();
  for (const fixture of fixtures) {
    if (isNationalTeamFixture(fixture)) continue;
    for (const club of sidesOf(fixture)) {
      const entry = counts.get(club.id) ?? { club, matches: 0 };
      counts.set(club.id, { club, matches: entry.matches + 1 });
    }
  }
  return [...counts.values()]
    .sort(
      (a, b) =>
        b.matches - a.matches || NAME_ORDER.compare(a.club.name, b.club.name),
    )
    .slice(0, TOP_CLUBS_MAX)
    .map((entry) => entry.club);
}

function distinctCount(values: readonly string[]): number {
  return new Set(values).size;
}

// Null when the constant no longer fits the data
export function showcaseFrom(showcase = MOCK_SHOWCASE): Showcase | null {
  const fixture = fixtureById(showcase.fixtureId);
  if (!fixture) return null;

  const squad = squadFor(fixture, showcase.side);
  const reveals = showcase.reveals.map(
    (playerId) => squad.find((entry) => entry.playerId === playerId)?.slot,
  );
  const miss = squadFor(fixture, OTHER_SIDE[showcase.side]).find(
    (entry) => entry.playerId === showcase.miss,
  );
  if (!miss || reveals.some((slot) => slot === undefined)) return null;

  return {
    match: {
      ...fixture.identity,
      side: showcase.side,
      formation: fixture[showcase.side].formation,
    },
    players: squad.map(toRevealed),
    demo: {
      reveals: reveals.filter((slot) => slot !== undefined),
      miss: {
        name: miss.name,
        imageUrl: miss.imageUrl,
        directoryKey: directoryKeyFor(miss.playerId),
      },
    },
  };
}

// Counted as R7 counts: the playable pool only
export function overviewFrom(
  fixtures: readonly MockFixture[] = PLAYABLE_FIXTURES,
  showcase = MOCK_SHOWCASE,
): CatalogOverview {
  const clubSides = fixtures.filter(
    (fixture) => !isNationalTeamFixture(fixture),
  );
  const nationalSides = fixtures.filter(isNationalTeamFixture);
  const { competitions, era } = filterOptionsFrom(fixtures);

  return {
    counts: {
      matches: fixtures.length,
      players: distinctCount(
        fixtures.flatMap((fixture) =>
          [...fixture.home.squad, ...fixture.away.squad].map(
            (entry) => entry.playerId,
          ),
        ),
      ),
      clubs: distinctCount(clubSides.flatMap(sidesOf).map((club) => club.id)),
      nationalTeams: distinctCount(
        nationalSides.flatMap(sidesOf).map((club) => club.id),
      ),
      seasons: new Set(fixtures.map(seasonStart)).size,
    },
    era,
    highlights: {
      finals: fixtures.filter((fixture) => fixture.identity.stage === 'Final')
        .length,
      shootouts: fixtures.filter((fixture) => fixture.shootout === true).length,
      extraTime: fixtures.filter((fixture) => fixture.extraTime === true)
        .length,
      goals: fixtures.reduce(
        (sum, { identity }) => sum + identity.score.home + identity.score.away,
        0,
      ),
    },
    competitions: competitions.map(({ id, kind, name, logoUrl }) => ({
      id,
      kind,
      name,
      logoUrl,
    })),
    topClubs: topClubsOf(fixtures),
    showcase: showcaseFrom(showcase),
  };
}
