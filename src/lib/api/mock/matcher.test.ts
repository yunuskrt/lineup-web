import { describe, expect, it } from 'vitest';
import { resolveGuess, similarity } from '@/lib/api/mock/matcher';
import { requireFixture, squadFor } from '@/lib/api/mock/data/fixtures';
import type { MockSquad, MockSquadEntry } from '@/lib/api/mock/types';

// Two Harlows in one XI: the in-XI collision case
const NORTHGATE = squadFor(requireFixture('match-crown-2003'), 'home');
const YILDIRIMSPOR = squadFor(
  requireFixture('match-federation-2012-final'),
  'home',
);
const OSTRENIA = squadFor(
  requireFixture('match-nations-cup-2006-semi'),
  'away',
);
const SOLVARA = squadFor(requireFixture('match-meridiana-2010'), 'away');

function hitId(guess: string, squad: MockSquad = NORTHGATE): string | null {
  const result = resolveGuess(guess, squad);
  return result.kind === 'hit' ? result.entry.playerId : null;
}

describe('resolveGuess', () => {
  it('resolves a full name and a bare surname', () => {
    expect(hitId('Kieran Moss')).toBe('pl-kieran-moss');
    expect(hitId('Moss')).toBe('pl-kieran-moss');
  });

  it('resolves a nickname and a mononym', () => {
    expect(hitId('Kiko', SOLVARA)).toBe('pl-francisco-belmonte');
    expect(hitId('Tavinho', SOLVARA)).toBe('pl-tavinho');
  });

  it('ignores case, accents and surrounding whitespace', () => {
    expect(hitId('  kerem şahin ', YILDIRIMSPOR)).toBe('pl-kerem-sahin');
    expect(hitId('İLKER DOĞANÇAY', YILDIRIMSPOR)).toBe('pl-ilker-dogancay');
    expect(hitId('Kılıç', YILDIRIMSPOR)).toBe('pl-baris-kilic');
    expect(hitId('Černý', OSTRENIA)).toBe('pl-jakub-cerny');
    expect(hitId('Łukasz Wróbel', OSTRENIA)).toBe('pl-lukasz-wrobel');
  });

  it('refuses a bare surname shared by two players in the XI', () => {
    const result = resolveGuess('Harlow', NORTHGATE);
    expect(result.kind).toBe('ambiguous');
    if (result.kind === 'ambiguous') {
      expect(result.playerIds.sort()).toEqual([
        'pl-dean-harlow',
        'pl-rhys-harlow',
      ]);
    }
  });

  it('refuses a typo that ties across the same collision', () => {
    const result = resolveGuess('Harlwo', NORTHGATE);
    expect(result.kind).toBe('ambiguous');
    if (result.kind === 'ambiguous') {
      expect(result.playerIds.sort()).toEqual([
        'pl-dean-harlow',
        'pl-rhys-harlow',
      ]);
    }
  });

  it('resolves the same collision once the first name disambiguates it', () => {
    expect(hitId('Dean Harlow')).toBe('pl-dean-harlow');
    expect(hitId('Rhys Harlow')).toBe('pl-rhys-harlow');
  });

  it('resolves a surname shared only with the opposing XI', () => {
    const fixture = requireFixture('match-crown-2015');
    expect(hitId('Price', squadFor(fixture, 'home'))).toBe('pl-callum-price');
    expect(hitId('Price', squadFor(fixture, 'away'))).toBe('pl-owen-price');
  });

  it('misses a name that is not in the XI', () => {
    expect(resolveGuess('Zinedine Zidane', NORTHGATE).kind).toBe('miss');
    expect(resolveGuess('', NORTHGATE).kind).toBe('miss');
    expect(resolveGuess('!!!', NORTHGATE).kind).toBe('miss');
  });

  it('accepts a transposed typo and a dropped letter', () => {
    expect(hitId('Pennokc')).toBe('pl-gareth-pennock');
    expect(hitId('Tollnd')).toBe('pl-wes-tolland');
    expect(hitId('Fenwikc')).toBe('pl-stuart-fenwick');
  });

  it('never resolves Ronaldo to Ronaldinho', () => {
    const squad: MockSquadEntry[] = [
      {
        playerId: 'x-1',
        name: 'Ronaldinho',
        slot: 0,
        position: 'FW',
        aliases: ['ronaldinho'],
      },
    ];

    expect(resolveGuess('Ronaldo', squad).kind).toBe('miss');
    expect(similarity('ronaldo', 'ronaldinho')).toBeLessThan(0.82);
  });
});
