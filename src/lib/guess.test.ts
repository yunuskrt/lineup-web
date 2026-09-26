import { describe, expect, it } from 'vitest';
import { MAX_GUESS_LENGTH } from '@/lib/api/schemas/common';
import { prepareGuess } from '@/lib/guess';

describe('prepareGuess', () => {
  it('trims surrounding whitespace', () => {
    expect(prepareGuess('  Rhys Harlow  ')).toBe('Rhys Harlow');
    expect(prepareGuess('\tTavinho\n')).toBe('Tavinho');
  });

  it('trims non-breaking spaces from pasted names', () => {
    expect(prepareGuess(' Rhys Harlow ')).toBe('Rhys Harlow');
    expect(prepareGuess('  ')).toBeNull();
  });

  it('keeps inner spacing as typed', () => {
    expect(prepareGuess('Jasper  van der Linde')).toBe('Jasper  van der Linde');
  });

  it.each(['', ' ', '   \t\n'])('rejects blank input %j', (raw) => {
    expect(prepareGuess(raw)).toBeNull();
  });

  it('accepts exactly the length limit', () => {
    const guess = 'a'.repeat(MAX_GUESS_LENGTH);
    expect(prepareGuess(guess)).toBe(guess);
  });

  it('rejects one character over the limit', () => {
    expect(prepareGuess('a'.repeat(MAX_GUESS_LENGTH + 1))).toBeNull();
  });

  it('measures the limit after trimming', () => {
    const guess = 'a'.repeat(MAX_GUESS_LENGTH);
    expect(prepareGuess(`  ${guess}  `)).toBe(guess);
  });

  it('leaves accents, case and Turkish letters untouched', () => {
    expect(prepareGuess('İbrahimović')).toBe('İbrahimović');
    expect(prepareGuess('Şahin')).toBe('Şahin');
    expect(prepareGuess('íñigo CASTAÑEDA')).toBe('íñigo CASTAÑEDA');
  });

  it('keeps apostrophes and hyphens', () => {
    expect(prepareGuess("O'Donovan")).toBe("O'Donovan");
    expect(prepareGuess('Addo-Mensah')).toBe('Addo-Mensah');
  });
});
