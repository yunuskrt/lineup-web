import { describe, expect, it } from 'vitest';
import { resolveGuess, similarity } from '@/lib/api/mock/matcher';
import { SEED_SQUAD } from '@/lib/api/mock/data/seed';
import type { MockSquadEntry } from '@/lib/api/mock/types';

function hitId(guess: string): string | null {
  const result = resolveGuess(guess, SEED_SQUAD);
  return result.kind === 'hit' ? result.entry.playerId : null;
}

describe('resolveGuess', () => {
  it('resolves a full name and a bare surname', () => {
    expect(hitId('Diego Ferreira')).toBe('pl-08');
    expect(hitId('Ferreira')).toBe('pl-08');
  });

  it('resolves a nickname and a mononym', () => {
    expect(hitId('Rafa')).toBe('pl-11');
  });

  it('ignores case, accents and surrounding whitespace', () => {
    expect(hitId('  kerem şahin ')).toBe('pl-04');
    expect(hitId('BJØRN')).toBe('pl-05');
    expect(hitId('Černý')).toBe('pl-06');
    expect(hitId('Łucki')).toBe('pl-07');
  });

  it('refuses a bare surname shared by two players in the XI', () => {
    const result = resolveGuess('Moreau', SEED_SQUAD);
    expect(result.kind).toBe('ambiguous');
    if (result.kind === 'ambiguous') {
      expect(result.playerIds.sort()).toEqual(['pl-02', 'pl-03']);
    }
  });

  it('refuses a typo that ties across the same collision', () => {
    const result = resolveGuess('Moreua', SEED_SQUAD);
    expect(result.kind).toBe('ambiguous');
    if (result.kind === 'ambiguous') {
      expect(result.playerIds.sort()).toEqual(['pl-02', 'pl-03']);
    }
  });

  it('resolves the same collision once the first name disambiguates it', () => {
    expect(hitId('Luís Moreau')).toBe('pl-02');
    expect(hitId('Tomás Moreau')).toBe('pl-03');
  });

  it('resolves a surname that is only ambiguous outside the XI', () => {
    // Petrov is a common surname, but unique within this squad
    expect(hitId('Petrov')).toBe('pl-10');
  });

  it('misses a name that is not in the XI', () => {
    expect(resolveGuess('Zinedine Zidane', SEED_SQUAD).kind).toBe('miss');
    expect(resolveGuess('', SEED_SQUAD).kind).toBe('miss');
    expect(resolveGuess('!!!', SEED_SQUAD).kind).toBe('miss');
  });

  it('accepts a transposed typo and a dropped letter', () => {
    expect(hitId('Ferreria')).toBe('pl-08');
    expect(hitId('Oyelarn')).toBe('pl-09');
    expect(hitId('Vasqeuz')).toBe('pl-01');
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
