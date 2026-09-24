import { describe, expect, it } from 'vitest';
import type { z } from 'zod';
import { fixtureById } from '@/lib/api/mock/data/fixtures';
import { MATCHES } from '@/lib/api/mock/data/matches';
import { SEED_SQUAD } from '@/lib/api/mock/data/seed';
import {
  mockFixtureSchema,
  mockPlayerSchema,
  mockSideSchema,
  mockSquadSchema,
  positionForSlot,
} from '@/lib/api/mock/types';
import type { MockFixture } from '@/lib/api/mock/types';

function issuesOf(schema: z.ZodType, value: unknown): string[] {
  const parsed = schema.safeParse(value);
  return parsed.success ? [] : parsed.error.issues.map((i) => i.message);
}

function tournamentFixture(): MockFixture {
  const fixture = fixtureById('match-nations-cup-2006-semi');
  if (!fixture) throw new Error('Missing tournament fixture');
  return structuredClone(fixture);
}

function withIdentity(changes: Partial<MockFixture['identity']>): MockFixture {
  const fixture = tournamentFixture();
  return { ...fixture, identity: { ...fixture.identity, ...changes } };
}

describe('positionForSlot', () => {
  it('puts the goalkeeper in slot 0', () => {
    expect(positionForSlot('4-4-2', 0)).toBe('GK');
  });

  it('maps 4-2-3-1 as DF×4, MF×5, FW×1', () => {
    const positions = Array.from({ length: 11 }, (_, slot) =>
      positionForSlot('4-2-3-1', slot),
    );
    expect(positions).toEqual([
      'GK',
      ...Array(4).fill('DF'),
      ...Array(5).fill('MF'),
      'FW',
    ]);
  });

  it('treats every middle line of a five-line formation as MF', () => {
    const positions = Array.from({ length: 11 }, (_, slot) =>
      positionForSlot('4-1-2-1-2', slot),
    );
    expect(positions).toEqual([
      'GK',
      ...Array(4).fill('DF'),
      ...Array(4).fill('MF'),
      'FW',
      'FW',
    ]);
  });

  it('returns null for a slot past the last line', () => {
    expect(positionForSlot('3-4-2', 10)).toBeNull();
  });
});

describe('mockPlayerSchema', () => {
  const player = { id: 'pl-x', name: 'Kerem Şahin', aliases: ['kerem sahin'] };

  it('accepts normalized aliases including the full name', () => {
    expect(issuesOf(mockPlayerSchema, player)).toEqual([]);
  });

  it('requires the normalized full name among the aliases', () => {
    expect(
      issuesOf(mockPlayerSchema, { ...player, aliases: ['sahin'] }),
    ).toContain('Aliases must include the normalized full name');
  });

  it('rejects a repeated alias', () => {
    expect(
      issuesOf(mockPlayerSchema, {
        ...player,
        aliases: ['kerem sahin', 'sahin', 'sahin'],
      }),
    ).toContain('Aliases must be unique');
  });
});

describe('mockSideSchema', () => {
  const side = MATCHES[0].home;

  it('rejects a formation that does not total ten outfield players', () => {
    expect(issuesOf(mockSideSchema, { ...side, formation: '4-4-3' })).toEqual([
      'Formation 4-4-3 must have 10 outfield players',
    ]);
  });

  it('rejects the same player starting twice', () => {
    const lineup = side.lineup.map((entry, index) =>
      index === 2 ? { ...entry, playerId: side.lineup[1].playerId } : entry,
    );
    expect(issuesOf(mockSideSchema, { ...side, lineup })).toContain(
      'A player cannot start twice in one XI',
    );
  });
});

describe('mockFixtureSchema', () => {
  it('accepts a tournament played in its own year', () => {
    expect(issuesOf(mockFixtureSchema, tournamentFixture())).toEqual([]);
  });

  it('rejects the same club on both sides', () => {
    const fixture = tournamentFixture();
    const same = withIdentity({ away: fixture.identity.home });
    expect(issuesOf(mockFixtureSchema, same)).toContain(
      'Home and away clubs must differ',
    );
  });

  it('rejects a two-year season on a tournament', () => {
    expect(
      issuesOf(mockFixtureSchema, withIdentity({ season: '2006-07' })),
    ).toContain('Tournament seasons are a single year');
  });

  it('rejects a tournament date outside its year', () => {
    expect(
      issuesOf(mockFixtureSchema, withIdentity({ date: '2007-01-10' })),
    ).toContain('Date 2007-01-10 is outside 2006');
  });

  it('rejects a season outside the covered range', () => {
    expect(
      issuesOf(
        mockFixtureSchema,
        withIdentity({ season: '1998', date: '1998-07-01' }),
      ),
    ).toContain('Season 1998 is outside the covered range');
  });

  it('rejects non-consecutive league season years', () => {
    const league = fixtureById('match-crown-2003');
    if (!league) throw new Error('Missing league fixture');

    const skipped = {
      ...league,
      identity: { ...league.identity, season: '2002-04' },
    };
    expect(issuesOf(mockFixtureSchema, skipped)).toContain(
      'Season years must be consecutive',
    );
  });
});

// Guards fixture quality — W07 replaces the seed with real lineups
describe('mockSquadSchema', () => {
  it('accepts the seed squad', () => {
    expect(mockSquadSchema.safeParse(SEED_SQUAD).success).toBe(true);
  });

  it('rejects a squad that is not exactly eleven', () => {
    expect(mockSquadSchema.safeParse(SEED_SQUAD.slice(0, 10)).success).toBe(
      false,
    );

    const twelve = [...SEED_SQUAD, { ...SEED_SQUAD[0], playerId: 'pl-12' }];
    expect(mockSquadSchema.safeParse(twelve).success).toBe(false);
  });

  it('rejects two players sharing a formation slot', () => {
    const clashing = SEED_SQUAD.map((entry, index) =>
      index === 1 ? { ...entry, slot: SEED_SQUAD[0].slot } : entry,
    );

    expect(mockSquadSchema.safeParse(clashing).success).toBe(false);
  });

  it('rejects a player with no aliases', () => {
    const aliasless = SEED_SQUAD.map((entry, index) =>
      index === 0 ? { ...entry, aliases: [] } : entry,
    );

    expect(mockSquadSchema.safeParse(aliasless).success).toBe(false);
  });
});
