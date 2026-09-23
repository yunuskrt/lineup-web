// Letters that do not decompose under NFD and need an explicit mapping
const NON_DECOMPOSING: Record<string, string> = {
  ı: 'i',
  ø: 'o',
  ł: 'l',
  đ: 'd',
  ð: 'd',
  æ: 'ae',
  œ: 'oe',
  ß: 'ss',
  þ: 'th',
};

const COMBINING_MARKS = /[̀-ͯ]/g;
const WITHIN_WORD_PUNCTUATION = /['’ʼ`]/g;
const NON_ALPHANUMERIC = /[^a-z0-9]+/g;

export function normalizeName(input: string): string {
  // NFD first so İ loses its dot before lowercasing
  const stripped = input.normalize('NFD').replace(COMBINING_MARKS, '');

  const lowered = stripped.toLowerCase();

  const mapped = Array.from(lowered)
    .map((char) => NON_DECOMPOSING[char] ?? char)
    .join('');

  return mapped
    .replace(WITHIN_WORD_PUNCTUATION, '')
    .replace(NON_ALPHANUMERIC, ' ')
    .trim();
}
