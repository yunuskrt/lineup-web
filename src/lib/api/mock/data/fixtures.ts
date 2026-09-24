import { z } from 'zod';
import { CLUBS, COMPETITIONS } from '@/lib/api/mock/data/competitions';
import { MATCHES } from '@/lib/api/mock/data/matches';
import { PLAYERS } from '@/lib/api/mock/data/players';
import {
  mockFixtureRecordSchema,
  mockFixtureSchema,
  mockPlayerSchema,
} from '@/lib/api/mock/types';
import type {
  MockFixture,
  MockFixtureRecord,
  MockPlayer,
  MockSide,
  MockSquad,
} from '@/lib/api/mock/types';
import { clubRefSchema, competitionRefSchema } from '@/lib/api/schemas/match';
import type { ClubRef, CompetitionRef, Side } from '@/types/match';

export type FixtureSource = {
  competitions: readonly CompetitionRef[];
  clubs: readonly ClubRef[];
  players: readonly MockPlayer[];
  matches: readonly MockFixtureRecord[];
};

function parseOrThrow<T>(schema: z.ZodType<T>, value: unknown, label: string) {
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`${label} is invalid:\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

function indexById<T extends { id: string }>(
  items: readonly T[],
  label: string,
): Map<string, T> {
  const index = new Map<string, T>();
  for (const item of items) {
    if (index.has(item.id)) throw new Error(`Duplicate ${label} id ${item.id}`);
    index.set(item.id, item);
  }
  return index;
}

function lookup<T>(index: Map<string, T>, id: string, context: string): T {
  const found = index.get(id);
  if (!found) throw new Error(`${context} references unknown id ${id}`);
  return found;
}

export function buildFixtures(source: FixtureSource): MockFixture[] {
  const competitions = indexById(
    source.competitions.map((item) =>
      parseOrThrow(competitionRefSchema, item, `Competition ${item.id}`),
    ),
    'competition',
  );
  const clubs = indexById(
    source.clubs.map((item) =>
      parseOrThrow(clubRefSchema, item, `Club ${item.id}`),
    ),
    'club',
  );
  const players = indexById(
    source.players.map((item) =>
      parseOrThrow(mockPlayerSchema, item, `Player ${item.id}`),
    ),
    'player',
  );
  indexById(source.matches, 'fixture');

  return source.matches.map((raw) => {
    const label = `Fixture ${raw.id}`;
    const record = parseOrThrow(mockFixtureRecordSchema, raw, label);
    const { competitionId, homeClubId, awayClubId, home, away, ...rest } =
      record;

    const toSquadSide = (side: MockSide) => ({
      formation: side.formation,
      squad: side.lineup.map((entry) => {
        const player = lookup(players, entry.playerId, label);
        return { ...entry, name: player.name, aliases: player.aliases };
      }),
    });

    return parseOrThrow(
      mockFixtureSchema,
      {
        identity: {
          ...rest,
          competition: lookup(competitions, competitionId, label),
          home: lookup(clubs, homeClubId, label),
          away: lookup(clubs, awayClubId, label),
        },
        home: toSquadSide(home),
        away: toSquadSide(away),
      },
      label,
    );
  });
}

export const FIXTURES: readonly MockFixture[] = buildFixtures({
  competitions: COMPETITIONS,
  clubs: CLUBS,
  players: PLAYERS,
  matches: MATCHES,
});

export function fixtureById(id: string): MockFixture | null {
  return FIXTURES.find((fixture) => fixture.identity.id === id) ?? null;
}

export function squadFor(fixture: MockFixture, side: Side): MockSquad {
  return fixture[side].squad;
}
