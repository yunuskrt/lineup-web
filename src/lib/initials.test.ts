import { describe, expect, it } from 'vitest';
import { initials } from '@/lib/initials';

describe('initials', () => {
  it.each([
    ['Gareth Pennock', 'GP'],
    ['Wes Tolland', 'WT'],
    ['Tavinho', 'T'],
  ])('reads %s as %s', (name, expected) => {
    expect(initials(name)).toBe(expected);
  });

  it('takes the last word past lowercase particles', () => {
    expect(initials('Jasper van der Linde')).toBe('JL');
    expect(initials('Rafael de Souza')).toBe('RS');
  });

  it('keeps accented letters whole', () => {
    expect(initials('Íñigo Castañeda')).toBe('ÍC');
    expect(initials('İlkay Şahin')).toBe('İŞ');
    expect(initials('Łukasz Čech')).toBe('ŁČ');
  });

  it('composes decomposed accents before reading them', () => {
    expect(initials('Émile Durand')).toBe('ÉD');
  });

  it('treats apostrophes and hyphens as part of the word', () => {
    expect(initials("Ciarán O'Donovan")).toBe('CO');
    expect(initials('Kofi Addo-Mensah')).toBe('KA');
    expect(initials('Christophe Delacroix-Morel')).toBe('CD');
  });

  it('uppercases lowercase letters', () => {
    expect(initials('ricardo quaresma')).toBe('RQ');
  });

  it('ignores surrounding and repeated whitespace', () => {
    expect(initials('  Rhys   Harlow \t')).toBe('RH');
  });

  it('is empty for a blank name', () => {
    expect(initials('   ')).toBe('');
  });
});
