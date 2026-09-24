import { describe, expect, it } from 'vitest';
import { CLUBS, COMPETITIONS } from '@/lib/api/mock/data/competitions';
import {
  buildFixtures,
  FIXTURES,
  fixtureById,
  squadFor,
} from '@/lib/api/mock/data/fixtures';
import type { FixtureSource } from '@/lib/api/mock/data/fixtures';
import { MATCHES } from '@/lib/api/mock/data/matches';
import { PLAYERS } from '@/lib/api/mock/data/players';
import { resolveGuess } from '@/lib/api/mock/matcher';
import { normalizeName } from '@/lib/api/mock/normalize';
import { seasonStart } from '@/lib/api/mock/pool';
import type { MockFixture } from '@/lib/api/mock/types';
import { competitionKindSchema } from '@/lib/api/schemas/common';
import type { Side } from '@/types/match';

const SOURCE: FixtureSource = {
  competitions: COMPETITIONS,
  clubs: CLUBS,
  players: PLAYERS,
  matches: MATCHES,
};

const SIDES: readonly Side[] = ['home', 'away'];

function fixture(id: string): MockFixture {
  const found = fixtureById(id);
  if (!found) throw new Error(`Missing fixture ${id}`);
  return found;
}

function guessIn(id: string, side: Side, guess: string) {
  return resolveGuess(guess, squadFor(fixture(id), side));
}

function hitId(id: string, side: Side, guess: string): string | null {
  const result = guessIn(id, side, guess);
  return result.kind === 'hit' ? result.entry.playerId : null;
}

function eraBucket(start: number): string {
  if (start <= 2007) return '2000-07';
  if (start <= 2015) return '2008-15';
  return '2016-25';
}

function countBy<T>(items: readonly T[], key: (item: T) => string) {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
  }
  return counts;
}

function withMatch(
  id: string,
  change: (match: (typeof MATCHES)[number]) => unknown,
): FixtureSource {
  return {
    ...SOURCE,
    matches: MATCHES.map((match) =>
      match.id === id ? change(structuredClone(match)) : match,
    ) as FixtureSource['matches'],
  };
}

describe('fixture integrity', () => {
  it('parses every fixture with unique ids everywhere', () => {
    expect(FIXTURES).toHaveLength(MATCHES.length);

    for (const ids of [
      COMPETITIONS.map((item) => item.id),
      CLUBS.map((item) => item.id),
      PLAYERS.map((item) => item.id),
      MATCHES.map((item) => item.id),
    ]) {
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('returns null for an unknown fixture id', () => {
    expect(fixtureById('match-nowhere')).toBeNull();
  });

  it('uses every competition, club and player it declares', () => {
    const competitions = new Set(
      FIXTURES.map((f) => f.identity.competition.id),
    );
    const clubs = new Set(
      FIXTURES.flatMap((f) => [f.identity.home.id, f.identity.away.id]),
    );
    const players = new Set(
      FIXTURES.flatMap((f) =>
        SIDES.flatMap((side) => f[side].squad.map((e) => e.playerId)),
      ),
    );

    expect(competitions.size).toBe(COMPETITIONS.length);
    expect(clubs.size).toBe(CLUBS.length);
    expect(players.size).toBe(PLAYERS.length);
  });

  it('stores every alias normalized, including the full name', () => {
    for (const player of PLAYERS) {
      for (const alias of player.aliases) {
        expect(normalizeName(alias)).toBe(alias);
      }
      expect(player.aliases).toContain(normalizeName(player.name));
    }
  });

  it('has no in-XI alias collision other than the deliberate one', () => {
    const collisions: string[] = [];

    for (const f of FIXTURES) {
      for (const side of SIDES) {
        const owners = countBy(
          f[side].squad.flatMap((entry) => entry.aliases),
          (alias) => alias,
        );
        for (const [alias, count] of owners) {
          if (count > 1) collisions.push(`${f.identity.id}/${side}/${alias}`);
        }
      }
    }

    expect(collisions.sort()).toEqual([
      'match-continental-2005-final/away/harlow',
      'match-crown-2003/home/harlow',
    ]);
  });
});

describe('coverage matrix', () => {
  it('holds 8 to 10 fixtures', () => {
    expect(FIXTURES.length).toBeGreaterThanOrEqual(8);
    expect(FIXTURES.length).toBeLessThanOrEqual(10);
  });

  it('covers every competition kind and two distinct leagues', () => {
    const kinds = new Set(FIXTURES.map((f) => f.identity.competition.kind));
    expect([...kinds].sort()).toEqual(
      [...competitionKindSchema.options].sort(),
    );

    const leagues = new Set(
      FIXTURES.filter((f) => f.identity.competition.kind === 'league').map(
        (f) => f.identity.competition.id,
      ),
    );
    expect(leagues.size).toBeGreaterThanOrEqual(2);
  });

  it('puts at least two fixtures in every era bucket', () => {
    const buckets = countBy(FIXTURES, (f) => eraBucket(seasonStart(f)));

    for (const bucket of ['2000-07', '2008-15', '2016-25']) {
      expect(buckets.get(bucket) ?? 0).toBeGreaterThanOrEqual(2);
    }
  });

  it('has a club appearing in at least three fixtures', () => {
    const appearances = countBy(
      FIXTURES.flatMap((f) => [f.identity.home.id, f.identity.away.id]),
      (id) => id,
    );

    expect(Math.max(...appearances.values())).toBeGreaterThanOrEqual(3);
  });

  it('uses four formations, one with four or more lines', () => {
    const formations = new Set(
      FIXTURES.flatMap((f) => SIDES.map((side) => f[side].formation)),
    );

    expect(formations.size).toBeGreaterThanOrEqual(4);
    expect(
      [...formations].some((formation) => formation.split('-').length >= 4),
    ).toBe(true);
  });

  it('mixes stages and nicknames', () => {
    const stages = FIXTURES.map((f) => f.identity.stage ?? '');

    for (const pattern of [/^Final$/, /^Semi-final$/, /^Group/, /^Matchday/]) {
      expect(stages.some((stage) => pattern.test(stage))).toBe(true);
    }

    const nicknames = FIXTURES.map((f) => f.identity.nickname);
    expect(nicknames.some((nickname) => nickname === null)).toBe(true);
    expect(nicknames.some((nickname) => nickname !== null)).toBe(true);
  });

  it('carries no crest image anywhere', () => {
    for (const f of FIXTURES) {
      expect(f.identity.home.crestUrl).toBeNull();
      expect(f.identity.away.crestUrl).toBeNull();
    }
  });
});

describe('name shapes', () => {
  it('uses every awkward character the display face must cover', () => {
    const names = PLAYERS.map((player) => player.name).join(' ');

    for (const char of ['İ', 'ı', 'ş', 'ğ', 'ç', 'ñ', 'č', 'ø', 'Ł']) {
      expect(names).toContain(char);
    }
  });

  it('keeps a bare surname ambiguous inside one XI', () => {
    expect(guessIn('match-crown-2003', 'home', 'Harlow').kind).toBe(
      'ambiguous',
    );
    expect(hitId('match-crown-2003', 'home', 'Dean Harlow')).toBe(
      'pl-dean-harlow',
    );
  });

  it('accepts a surname shared only with the opposing XI', () => {
    expect(hitId('match-crown-2015', 'home', 'Price')).toBe('pl-callum-price');
    expect(hitId('match-crown-2015', 'away', 'Price')).toBe('pl-owen-price');
  });

  it('resolves mononyms and nicknames', () => {
    const id = 'match-meridiana-2010';
    expect(hitId(id, 'away', 'Tavinho')).toBe('pl-tavinho');
    expect(hitId(id, 'away', 'Kiko')).toBe('pl-francisco-belmonte');
    expect(hitId(id, 'home', 'Tavo')).toBe('pl-tavo');
  });

  it('never crosses a near-miss pair', () => {
    const id = 'match-meridiana-2010';
    expect(guessIn(id, 'away', 'Tavo').kind).toBe('miss');
    expect(guessIn(id, 'home', 'Tavinho').kind).toBe('miss');
  });

  it('resolves particles, hyphens and apostrophes', () => {
    expect(hitId('match-crown-2003', 'home', 'Van der Linde')).toBe(
      'pl-jasper-van-der-linde',
    );
    expect(hitId('match-crown-2003', 'home', 'Addo-Mensah')).toBe(
      'pl-kofi-addo-mensah',
    );
    expect(hitId('match-crown-2003', 'home', "O'Donovan")).toBe(
      'pl-ciaran-odonovan',
    );
    expect(hitId('match-crown-2003', 'home', 'O Donovan')).toBe(
      'pl-ciaran-odonovan',
    );
    expect(hitId('match-meridiana-2010', 'away', 'de Almeida')).toBe(
      'pl-mateus-de-almeida',
    );
    expect(hitId('match-championship-2012-group', 'home', 'Weiss-Roeder')).toBe(
      'pl-anton-weiss-roeder',
    );
  });

  it('resolves Turkish names typed with or without diacritics', () => {
    const id = 'match-federation-2012-final';
    for (const guess of [
      'İlker Doğançay',
      'Ilker Dogancay',
      'ilker dogançay',
    ]) {
      expect(hitId(id, 'home', guess)).toBe('pl-ilker-dogancay');
    }
    expect(hitId(id, 'home', 'Şimşek')).toBe('pl-oguzhan-simsek');
    expect(hitId(id, 'home', 'Kilic')).toBe('pl-baris-kilic');
  });

  it('has a player starting for two clubs in two eras', () => {
    const stints = new Map<string, Set<string>>();

    for (const f of FIXTURES) {
      for (const side of SIDES) {
        const club = f.identity[side].id;
        const era = eraBucket(seasonStart(f));
        for (const entry of f[side].squad) {
          const seen = stints.get(entry.playerId) ?? new Set<string>();
          seen.add(`${club}|${era}`);
          stints.set(entry.playerId, seen);
        }
      }
    }

    const isRecurring = [...stints.values()].some((seen) => {
      const pairs = [...seen].map((stint) => stint.split('|'));
      return pairs.some(([club, era]) =>
        pairs.some(([other, otherEra]) => other !== club && otherEra !== era),
      );
    });

    expect(isRecurring).toBe(true);
  });

  it('includes a display name of at least 24 characters', () => {
    const longest = Math.max(...PLAYERS.map((player) => player.name.length));
    expect(longest).toBeGreaterThanOrEqual(24);
  });
});

describe('buildFixtures', () => {
  function errorFrom(source: FixtureSource): string {
    try {
      buildFixtures(source);
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
    throw new Error('Expected buildFixtures to throw');
  }

  it('rejects a duplicated slot', () => {
    const message = errorFrom(
      withMatch('match-crown-2003', (match) => {
        match.home.lineup[2].slot = 1;
        return match;
      }),
    );
    expect(message).toContain('match-crown-2003');
    expect(message).toContain('Every slot must be filled exactly once');
  });

  it('rejects a position that disagrees with the formation', () => {
    const message = errorFrom(
      withMatch('match-crown-2003', (match) => {
        match.home.lineup[9].position = 'MF';
        return match;
      }),
    );
    expect(message).toContain('Slot 9 in 4-4-2 is FW, not MF');
  });

  it('rejects an unknown player id', () => {
    const message = errorFrom(
      withMatch('match-crown-2003', (match) => {
        match.away.lineup[0].playerId = 'pl-nobody';
        return match;
      }),
    );
    expect(message).toContain('unknown id pl-nobody');
  });

  it('rejects a single-year season on a league', () => {
    const message = errorFrom(
      withMatch('match-crown-2003', (match) => ({ ...match, season: '2003' })),
    );
    expect(message).toContain('span two years');
  });

  it('rejects a date outside the season', () => {
    const message = errorFrom(
      withMatch('match-crown-2003', (match) => ({
        ...match,
        date: '2003-08-10',
      })),
    );
    expect(message).toContain('outside 2002-03');
  });

  it('rejects a player starting for both sides', () => {
    const message = errorFrom(
      withMatch('match-crown-2003', (match) => {
        match.away.lineup[0].playerId = 'pl-gareth-pennock';
        return match;
      }),
    );
    expect(message).toContain('Players on both sides');
  });

  it('rejects a duplicated player id', () => {
    const message = errorFrom({
      ...SOURCE,
      players: [...PLAYERS, PLAYERS[0]],
    });
    expect(message).toBe(`Duplicate player id ${PLAYERS[0].id}`);
  });

  it('rejects an unknown club id', () => {
    const message = errorFrom(
      withMatch('match-crown-2003', (match) => ({
        ...match,
        awayClubId: 'club-nowhere',
      })),
    );
    expect(message).toContain('unknown id club-nowhere');
  });

  it('rejects an alias that is not stored normalized', () => {
    const message = errorFrom({
      ...SOURCE,
      players: PLAYERS.map((player) =>
        player.id === 'pl-kerem-sahin'
          ? { ...player, aliases: [...player.aliases, 'Şahin'] }
          : player,
      ),
    });
    expect(message).toContain('stored normalized');
  });
});
