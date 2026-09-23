import { normalizeName } from '@/lib/api/mock/normalize';
import type { MockSquadEntry } from '@/lib/api/mock/types';

// Tuned so "ronaldo" never reaches "ronaldinho" (0.72 apart)
export const FUZZY_THRESHOLD = 0.82;

export type MatchResolution =
  | { kind: 'hit'; entry: MockSquadEntry }
  | { kind: 'ambiguous'; playerIds: string[] }
  | { kind: 'miss' };

// Damerau-Levenshtein: a swapped pair costs 1, not 2
function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const rows: number[][] = [Array.from({ length: b.length + 1 }, (_, j) => j)];

  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(
        current[j - 1] + 1,
        rows[i - 1][j] + 1,
        rows[i - 1][j - 1] + cost,
      );

      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, rows[i - 2][j - 2] + 1);
      }

      current[j] = value;
    }
    rows.push(current);
  }

  return rows[a.length][b.length];
}

export function similarity(a: string, b: string): number {
  const longest = Math.max(a.length, b.length);
  if (longest === 0) return 1;
  return 1 - editDistance(a, b) / longest;
}

function exactMatches(
  normalized: string,
  squad: readonly MockSquadEntry[],
): MockSquadEntry[] {
  return squad.filter((entry) =>
    entry.aliases.some((alias) => normalizeName(alias) === normalized),
  );
}

// Ties are kept so a typo cannot slip past the collision rule
function bestFuzzyMatches(
  normalized: string,
  squad: readonly MockSquadEntry[],
): MockSquadEntry[] {
  let best: MockSquadEntry[] = [];
  let bestScore = FUZZY_THRESHOLD;

  for (const entry of squad) {
    for (const alias of entry.aliases) {
      const score = similarity(normalized, normalizeName(alias));

      if (score > bestScore) {
        bestScore = score;
        best = [entry];
      } else if (score === bestScore && !best.includes(entry)) {
        best.push(entry);
      }
    }
  }

  return best;
}

export function resolveGuess(
  guess: string,
  squad: readonly MockSquadEntry[],
): MatchResolution {
  const normalized = normalizeName(guess);
  if (normalized.length === 0) return { kind: 'miss' };

  const exact = exactMatches(normalized, squad);

  if (exact.length === 1) {
    return { kind: 'hit', entry: exact[0] };
  }

  // Ambiguity only matters inside the XI
  if (exact.length > 1) {
    return { kind: 'ambiguous', playerIds: exact.map((e) => e.playerId) };
  }

  const fuzzy = bestFuzzyMatches(normalized, squad);

  if (fuzzy.length === 1) return { kind: 'hit', entry: fuzzy[0] };

  if (fuzzy.length > 1) {
    return { kind: 'ambiguous', playerIds: fuzzy.map((e) => e.playerId) };
  }

  return { kind: 'miss' };
}
