import { normalizeName } from '@/lib/normalize';
import type { DirectoryPlayer } from '@/types/catalog';

export const MIN_SUGGESTION_LETTERS = 3;
export const MAX_SUGGESTIONS = 20;

const EXACT = 0;
const PREFIX = 1;
const LATER_WORD = 2;

type IndexedPlayer = { player: DirectoryPlayer; terms: readonly string[] };

export type SuggestionIndex = readonly IndexedPlayer[];

export type Suggestion = { player: DirectoryPlayer; isNamed: boolean };

type Ranked = Suggestion & { rank: number };

const NAME_ORDER = new Intl.Collator('en');

export function buildSuggestionIndex(
  players: readonly DirectoryPlayer[],
): SuggestionIndex {
  return players.map((player) => ({
    player,
    terms: [...new Set([...player.terms, normalizeName(player.name)])],
  }));
}

function rankOf(terms: readonly string[], query: string): number | null {
  let best: number | null = null;
  for (const term of terms) {
    if (term === query) return EXACT;
    if (term.startsWith(query)) best = PREFIX;
    else if (best === null && term.includes(` ${query}`)) best = LATER_WORD;
  }
  return best;
}

function compare(a: Ranked, b: Ranked): number {
  if (a.isNamed !== b.isNamed) return a.isNamed ? 1 : -1;
  if (a.rank !== b.rank) return a.rank - b.rank;
  const byName = NAME_ORDER.compare(a.player.name, b.player.name);
  if (byName !== 0) return byName;
  return a.player.key < b.player.key ? -1 : 1;
}

// Text alone: never the match, squad or filters
export function suggest(
  index: SuggestionIndex,
  query: string,
  namedKeys: ReadonlySet<string>,
): Suggestion[] {
  const normalized = normalizeName(query);
  if (normalized.replace(/ /g, '').length < MIN_SUGGESTION_LETTERS) return [];

  const ranked: Ranked[] = [];
  for (const { player, terms } of index) {
    const rank = rankOf(terms, normalized);
    if (rank === null) continue;
    ranked.push({ player, rank, isNamed: namedKeys.has(player.key) });
  }

  return ranked
    .sort(compare)
    .slice(0, MAX_SUGGESTIONS)
    .map(({ player, isNamed }) => ({ player, isNamed }));
}

// Arrow keys skip named rows and wrap at the ends
export function stepHighlight(
  suggestions: readonly Suggestion[],
  currentKey: string | null,
  direction: 1 | -1,
): string | null {
  const pickable = suggestions.filter((item) => !item.isNamed);
  if (pickable.length === 0) return null;

  const index = pickable.findIndex((item) => item.player.key === currentKey);
  if (index < 0) {
    const edge = direction === 1 ? 0 : pickable.length - 1;
    return pickable[edge].player.key;
  }
  const next = (index + direction + pickable.length) % pickable.length;
  return pickable[next].player.key;
}

export function suggestionCountLabel(count: number): string {
  return count === 1 ? '1 suggestion' : `${count} suggestions`;
}
