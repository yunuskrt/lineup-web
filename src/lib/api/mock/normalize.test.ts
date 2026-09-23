import { describe, expect, it } from 'vitest';
import { normalizeName } from '@/lib/api/mock/normalize';

describe('normalizeName', () => {
  it('strips diacritics from Latin Extended-A names', () => {
    expect(normalizeName('İbrahimović')).toBe('ibrahimovic');
    expect(normalizeName('Čech')).toBe('cech');
    expect(normalizeName('Özil')).toBe('ozil');
    expect(normalizeName('Hernández')).toBe('hernandez');
  });

  it('handles the Turkish dotted and dotless i in both directions', () => {
    expect(normalizeName('İSTANBUL')).toBe('istanbul');
    expect(normalizeName('Şahin')).toBe('sahin');
    expect(normalizeName('Ilıcalı')).toBe('ilicali');
    expect(normalizeName('Gökhan')).toBe('gokhan');
    expect(normalizeName('Çalhanoğlu')).toBe('calhanoglu');
  });

  it('maps letters that NFD does not decompose', () => {
    expect(normalizeName('Bjørn')).toBe('bjorn');
    expect(normalizeName('Łukasz')).toBe('lukasz');
    expect(normalizeName('Weiß')).toBe('weiss');
  });

  it('removes within-word punctuation but splits on the rest', () => {
    expect(normalizeName("O'Shea")).toBe('oshea');
    expect(normalizeName('Hernández-Pérez')).toBe('hernandez perez');
  });

  it('collapses whitespace and trims', () => {
    expect(normalizeName('  Zlatan   Ibrahimovic  ')).toBe(
      'zlatan ibrahimovic',
    );
    expect(normalizeName('\tRafa\n')).toBe('rafa');
  });

  it('is idempotent', () => {
    const once = normalizeName('İbrahimović');
    expect(normalizeName(once)).toBe(once);
  });

  it('returns an empty string for input with no letters', () => {
    expect(normalizeName('!!!')).toBe('');
    expect(normalizeName('   ')).toBe('');
  });
});
