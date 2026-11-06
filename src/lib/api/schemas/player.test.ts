import { describe, expect, it } from 'vitest';
import { duelNamedPlayerSchema } from '@/lib/api/schemas/duel';
import { namedPlayerSchema } from '@/lib/api/schemas/player';

const NAMED = {
  id: 'player-1',
  name: 'Petr Čech',
  slot: 0,
  position: 'GK',
  imageUrl: null,
  order: 1,
  elapsedMs: 2_100,
};

function parses(patch: Record<string, unknown>): boolean {
  return namedPlayerSchema.safeParse({ ...NAMED, ...patch }).success;
}

describe('namedPlayerSchema', () => {
  it('accepts orders 1 to 11', () => {
    expect(parses({ order: 1 })).toBe(true);
    expect(parses({ order: 11 })).toBe(true);
  });

  it('rejects an order outside one XI', () => {
    expect(parses({ order: 0 })).toBe(false);
    expect(parses({ order: 12 })).toBe(false);
    expect(parses({ order: 1.5 })).toBe(false);
  });

  // A grace-window guess reads as the full round
  it('accepts 0 and the 15000ms cap', () => {
    expect(parses({ elapsedMs: 0 })).toBe(true);
    expect(parses({ elapsedMs: 15_000 })).toBe(true);
  });

  it('rejects a negative, fractional or uncapped time', () => {
    expect(parses({ elapsedMs: -1 })).toBe(false);
    expect(parses({ elapsedMs: 2_100.5 })).toBe(false);
    expect(parses({ elapsedMs: 15_001 })).toBe(false);
  });

  it('rejects a player without order or time', () => {
    expect(parses({ order: undefined })).toBe(false);
    expect(parses({ elapsedMs: undefined })).toBe(false);
  });
});

describe('duelNamedPlayerSchema', () => {
  it('needs the finder as well', () => {
    const named = { ...NAMED, foundBy: 'opponent' };
    expect(duelNamedPlayerSchema.safeParse(named).success).toBe(true);
    expect(
      duelNamedPlayerSchema.safeParse({ ...named, foundBy: undefined }).success,
    ).toBe(false);
  });
});
