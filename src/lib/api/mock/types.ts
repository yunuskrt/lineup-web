import { z } from 'zod';
import { normalizeName } from '@/lib/api/mock/normalize';
import {
  FIRST_SEASON_START,
  idSchema,
  LAST_SEASON_START,
  SQUAD_SIZE,
} from '@/lib/api/schemas/common';
import { formationSchema, matchIdentitySchema } from '@/lib/api/schemas/match';
import { positionGroupSchema } from '@/lib/api/schemas/player';
import type { MatchIdentity } from '@/types/match';
import type { PositionGroup } from '@/types/player';

const slotSchema = z
  .number()
  .int()
  .min(0)
  .max(SQUAD_SIZE - 1);

export const mockSquadEntrySchema = z.object({
  playerId: idSchema,
  name: z.string().min(1),
  slot: slotSchema,
  position: positionGroupSchema,
  aliases: z.array(z.string().min(1)).min(1),
});

export const mockSquadSchema = z
  .array(mockSquadEntrySchema)
  .length(SQUAD_SIZE)
  .refine(
    (squad) => new Set(squad.map((entry) => entry.slot)).size === SQUAD_SIZE,
    { error: 'Every squad slot must be filled exactly once' },
  );

export const mockPlayerSchema = z
  .object({
    id: idSchema,
    name: z.string().min(1),
    aliases: z.array(z.string().min(1)).min(1),
  })
  .superRefine((player, ctx) => {
    const unnormalized = player.aliases.filter(
      (alias) => normalizeName(alias) !== alias,
    );
    if (unnormalized.length > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['aliases'],
        message: `Aliases must be stored normalized: ${unnormalized.join(', ')}`,
      });
    }

    if (!player.aliases.includes(normalizeName(player.name))) {
      ctx.addIssue({
        code: 'custom',
        path: ['aliases'],
        message: 'Aliases must include the normalized full name',
      });
    }

    if (new Set(player.aliases).size !== player.aliases.length) {
      ctx.addIssue({
        code: 'custom',
        path: ['aliases'],
        message: 'Aliases must be unique',
      });
    }
  });

export const mockLineupEntrySchema = z.object({
  playerId: idSchema,
  slot: slotSchema,
  position: positionGroupSchema,
});

function formationLines(formation: string): number[] {
  return formation.split('-').map(Number);
}

// Slot 0 is the GK; outfield lines fill defence to attack
export function positionForSlot(
  formation: string,
  slot: number,
): PositionGroup | null {
  if (slot === 0) return 'GK';

  const lines = formationLines(formation);
  let lineStart = 1;

  for (const [index, size] of lines.entries()) {
    if (slot < lineStart + size) {
      if (index === 0) return 'DF';
      return index === lines.length - 1 ? 'FW' : 'MF';
    }
    lineStart += size;
  }

  return null;
}

export const mockSideSchema = z
  .object({
    formation: formationSchema,
    lineup: z.array(mockLineupEntrySchema).length(SQUAD_SIZE),
  })
  .superRefine((side, ctx) => {
    const outfield = formationLines(side.formation).reduce((a, b) => a + b, 0);
    if (outfield !== SQUAD_SIZE - 1) {
      ctx.addIssue({
        code: 'custom',
        path: ['formation'],
        message: `Formation ${side.formation} must have ${SQUAD_SIZE - 1} outfield players`,
      });
      return;
    }

    const slots = new Set(side.lineup.map((entry) => entry.slot));
    if (slots.size !== SQUAD_SIZE) {
      ctx.addIssue({
        code: 'custom',
        path: ['lineup'],
        message: 'Every slot must be filled exactly once',
      });
    }

    const players = new Set(side.lineup.map((entry) => entry.playerId));
    if (players.size !== SQUAD_SIZE) {
      ctx.addIssue({
        code: 'custom',
        path: ['lineup'],
        message: 'A player cannot start twice in one XI',
      });
    }

    side.lineup.forEach((entry, index) => {
      const expected = positionForSlot(side.formation, entry.slot);
      if (entry.position !== expected) {
        ctx.addIssue({
          code: 'custom',
          path: ['lineup', index, 'position'],
          message: `Slot ${entry.slot} in ${side.formation} is ${expected}, not ${entry.position}`,
        });
      }
    });
  });

export const mockFixtureRecordSchema = matchIdentitySchema
  .omit({ competition: true, home: true, away: true })
  .extend({
    competitionId: idSchema,
    homeClubId: idSchema,
    awayClubId: idSchema,
    home: mockSideSchema,
    away: mockSideSchema,
  });

const mockFixtureSideSchema = z.object({
  formation: formationSchema,
  squad: mockSquadSchema,
});

const TOURNAMENT_KINDS = new Set(['world_cup', 'euro']);
const SEASON_PATTERN = /^(\d{4})(?:-(\d{2}))?$/;

function seasonIssue(identity: MatchIdentity): string | null {
  const match = SEASON_PATTERN.exec(identity.season);
  if (!match) return 'Season is malformed';

  const start = Number(match[1]);
  if (start < FIRST_SEASON_START || start > LAST_SEASON_START) {
    return `Season ${identity.season} is outside the covered range`;
  }

  if (TOURNAMENT_KINDS.has(identity.competition.kind)) {
    if (match[2]) return 'Tournament seasons are a single year';
    return identity.date.startsWith(`${start}-`)
      ? null
      : `Date ${identity.date} is outside ${identity.season}`;
  }

  if (!match[2]) return 'League and European club seasons span two years';
  if (Number(match[2]) !== (start + 1) % 100) {
    return 'Season years must be consecutive';
  }

  const isInSeason =
    identity.date >= `${start}-07-01` && identity.date <= `${start + 1}-06-30`;
  return isInSeason
    ? null
    : `Date ${identity.date} is outside ${identity.season}`;
}

export const mockFixtureSchema = z
  .object({
    identity: matchIdentitySchema,
    home: mockFixtureSideSchema,
    away: mockFixtureSideSchema,
  })
  .superRefine((fixture, ctx) => {
    if (fixture.identity.home.id === fixture.identity.away.id) {
      ctx.addIssue({
        code: 'custom',
        path: ['identity'],
        message: 'Home and away clubs must differ',
      });
    }

    const homeIds = new Set(fixture.home.squad.map((entry) => entry.playerId));
    const shared = fixture.away.squad.filter((entry) =>
      homeIds.has(entry.playerId),
    );
    if (shared.length > 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['away'],
        message: `Players on both sides: ${shared.map((e) => e.playerId).join(', ')}`,
      });
    }

    const issue = seasonIssue(fixture.identity);
    if (issue) {
      ctx.addIssue({
        code: 'custom',
        path: ['identity', 'season'],
        message: issue,
      });
    }
  });

export type MockSquadEntry = z.infer<typeof mockSquadEntrySchema>;
export type MockSquad = z.infer<typeof mockSquadSchema>;
export type MockPlayer = z.infer<typeof mockPlayerSchema>;
export type MockLineupEntry = z.infer<typeof mockLineupEntrySchema>;
export type MockSide = z.infer<typeof mockSideSchema>;
export type MockFixtureRecord = z.infer<typeof mockFixtureRecordSchema>;
export type MockFixture = z.infer<typeof mockFixtureSchema>;
