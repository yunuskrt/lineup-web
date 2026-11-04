import { describe, expect, it } from 'vitest';
import { competitionOptionSchema } from '@/lib/api/schemas/catalog';

const OPTION = {
  id: 'comp-a',
  kind: 'league',
  name: 'Alpha League',
  clubIds: ['club-a'],
  seasonStarts: [2004, 2010],
};

function parses(patch: Record<string, unknown>): boolean {
  return competitionOptionSchema.safeParse({ ...OPTION, ...patch }).success;
}

describe('competitionOptionSchema', () => {
  it('accepts an option with no logoUrl until R3b sends it', () => {
    expect(parses({})).toBe(true);
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
