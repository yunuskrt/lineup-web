import { describe, expect, it } from 'vitest';
import {
  buildSuggestionIndex,
  MAX_SUGGESTIONS,
  stepHighlight,
  type Suggestion,
  suggest,
  suggestionCountLabel,
} from '@/lib/suggestions';
import type { DirectoryPlayer } from '@/types/catalog';

function entry(
  name: string,
  terms: string[],
  key = name.replace(/[^A-Za-z]/g, '').padEnd(22, 'x'),
): DirectoryPlayer {
  return { key, name, imageUrl: null, terms };
}

const ZLATAN = entry('Zlatan Ibrahimović', [
  'ibrahimovic',
  'zlatan',
  'zlatan ibrahimovic',
]);
const SAHIN = entry('Nuri Şahin', ['nuri sahin', 'sahin']);
const HULK = entry('Givanildo Vieira de Sousa', [
  'givanildo vieira de sousa',
  'hulk',
]);
const ILICALI = entry('Yusuf Ilıcalı', ['ilicali', 'yusuf ilicali']);

const INDEX = buildSuggestionIndex([ZLATAN, SAHIN, HULK, ILICALI]);
const NONE = new Set<string>();

function names(query: string, named: ReadonlySet<string> = NONE): string[] {
  return suggest(INDEX, query, named).map((item) => item.player.name);
}

describe('suggest', () => {
  it('waits for three letters, spaces not counted', () => {
    expect(names('zl')).toEqual([]);
    expect(names('z l')).toEqual([]);
    expect(names('  z l a ')).toEqual([]);
    expect(names('zla')).toEqual(['Zlatan Ibrahimović']);
  });

  it('matches the start of any word, never the middle', () => {
    expect(names('ibr')).toEqual(['Zlatan Ibrahimović']);
    expect(names('zlatan ibr')).toEqual(['Zlatan Ibrahimović']);
    expect(names('movi')).toEqual([]);
  });

  it('finds a player through an alias alone', () => {
    expect(names('hulk')).toEqual(['Givanildo Vieira de Sousa']);
  });

  it('searches the normalized display name too', () => {
    const index = buildSuggestionIndex([entry('Dean Harlow', ['harlow'])]);
    expect(suggest(index, 'dean', NONE)).toHaveLength(1);
  });

  it('folds diacritics and Turkish letters in the query', () => {
    expect(names('İbrahimović')).toEqual(['Zlatan Ibrahimović']);
    expect(names('Şahin')).toEqual(['Nuri Şahin']);
    expect(names('ılıc')).toEqual(['Yusuf Ilıcalı']);
  });

  it('ranks exact, then prefix, then a later word', () => {
    const index = buildSuggestionIndex([
      entry('Carl Harrow', ['carl harrow']),
      entry('Harro Lind', ['harro lind', 'lind']),
      entry('Harro', ['harro']),
    ]);
    const ranked = suggest(index, 'harro', NONE).map((s) => s.player.name);
    expect(ranked).toEqual(['Harro', 'Harro Lind', 'Carl Harrow']);
  });

  it('breaks ties by name, then key', () => {
    const index = buildSuggestionIndex([
      entry('Tom Vale', ['vale'], 'b'.repeat(22)),
      entry('Ann Vale', ['vale'], 'c'.repeat(22)),
      entry('Tom Vale', ['vale'], 'a'.repeat(22)),
    ]);
    const keys = suggest(index, 'vale', NONE).map((s) => s.player.key[0]);
    expect(keys).toEqual(['c', 'a', 'b']);
  });

  it('puts named players last and marks them', () => {
    const index = buildSuggestionIndex([
      entry('Dean Harlow', ['harlow']),
      entry('Rhys Harlow', ['harlow']),
    ]);
    const named = new Set([index[0].player.key]);
    expect(suggest(index, 'harlow', named)).toEqual([
      { player: index[1].player, isNamed: false },
      { player: index[0].player, isNamed: true },
    ]);
  });

  it(`returns at most ${MAX_SUGGESTIONS}`, () => {
    const many = Array.from({ length: 30 }, (_, i) =>
      entry(`Player ${i}`, [`smith ${i}`], `${i}`.padEnd(22, 'k')),
    );
    const index = buildSuggestionIndex(many);
    expect(suggest(index, 'smith', NONE)).toHaveLength(MAX_SUGGESTIONS);
  });

  it('returns nothing from an empty directory', () => {
    expect(suggest(buildSuggestionIndex([]), 'harlow', NONE)).toEqual([]);
  });
});

describe('stepHighlight', () => {
  const [a, b, c] = ['Ann', 'Bob', 'Cal'].map((name) =>
    entry(name, [name.toLowerCase()]),
  );
  const LIST: Suggestion[] = [
    { player: a, isNamed: false },
    { player: b, isNamed: true },
    { player: c, isNamed: false },
  ];

  it('starts at the first or last pickable row', () => {
    expect(stepHighlight(LIST, null, 1)).toBe(a.key);
    expect(stepHighlight(LIST, null, -1)).toBe(c.key);
  });

  it('skips named rows and wraps at the ends', () => {
    expect(stepHighlight(LIST, a.key, 1)).toBe(c.key);
    expect(stepHighlight(LIST, c.key, 1)).toBe(a.key);
    expect(stepHighlight(LIST, a.key, -1)).toBe(c.key);
  });

  it('starts over when the highlighted row has gone', () => {
    expect(stepHighlight(LIST, 'gone'.padEnd(22, 'x'), 1)).toBe(a.key);
  });

  it('highlights nothing when every row is named', () => {
    const named = LIST.map((item) => ({ ...item, isNamed: true }));
    expect(stepHighlight(named, null, 1)).toBeNull();
  });
});

describe('suggestionCountLabel', () => {
  it('reads one or many', () => {
    expect(suggestionCountLabel(1)).toBe('1 suggestion');
    expect(suggestionCountLabel(7)).toBe('7 suggestions');
  });
});
