import { describe, expect, it } from 'vitest';
import { favouriteClubOf } from '@/lib/api/mock/store';
import type { ClubRef } from '@/types/match';

function club(id: string): ClubRef {
  return { id, name: id, shortName: id.slice(0, 3), crestUrl: null };
}

const NORTH = club('north');
const SOUTH = club('south');
const EAST = club('east');

describe('favouriteClubOf', () => {
  it('has no favourite before any run', () => {
    expect(favouriteClubOf([])).toBeNull();
  });

  it('picks the most-played club even when another was played last', () => {
    expect(favouriteClubOf([NORTH, NORTH, SOUTH])).toEqual(NORTH);
  });

  it('breaks a tie in favour of the most recent club', () => {
    expect(favouriteClubOf([NORTH, SOUTH])).toEqual(SOUTH);
    expect(favouriteClubOf([NORTH, SOUTH, EAST, SOUTH, NORTH])).toEqual(NORTH);
  });
});
