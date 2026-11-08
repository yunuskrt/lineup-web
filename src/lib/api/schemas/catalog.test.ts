import { describe, expect, it } from 'vitest';
import {
  competitionOptionSchema,
  directoryPlayerSchema,
  playerDirectorySchema,
} from '@/lib/api/schemas/catalog';

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
