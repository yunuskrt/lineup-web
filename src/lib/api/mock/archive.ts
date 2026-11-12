import type { z } from 'zod';
import { PLAYABLE_FIXTURES, seasonStart } from '@/lib/api/mock/pool';
import { fail, ok } from '@/lib/api/mock/shared';
import type { MockFixture } from '@/lib/api/mock/types';
import {
  ARCHIVE_PAGE_SIZE,
  archiveQuerySchema,
} from '@/lib/api/schemas/catalog';
import { normalizeName } from '@/lib/normalize';
import type { ApiResult } from '@/types/api';
import type { ArchivePage, ArchiveQuery } from '@/types/catalog';
import type { MatchIdentity } from '@/types/match';

export const STALE_ARCHIVE_CURSOR = 'That page link is no longer valid.';

function words(text: string): string[] {
  return normalizeName(text).split(' ').filter(Boolean);
}

// 2004-05 also answers to 2004 and 2005
function seasonWords(season: string): string[] {
  const start = Number(season.slice(0, 4));
  return season.length > 4 ? [String(start), String(start + 1)] : [season];
}

// R12's words: clubs, competition, nickname, year
export function archiveWords(match: MatchIdentity): string[] {
  return [
    match.home.name,
    match.home.shortName,
    match.away.name,
    match.away.shortName,
    match.competition.name,
    ...seasonWords(match.season),
    match.date.slice(0, 4),
  ].flatMap(words);
}

// Every word must start a word of the match
export function matchesSearch(match: MatchIdentity, q: string): boolean {
  const wanted = words(q);
  const own = archiveWords(match);
  return wanted.every((word) => own.some((term) => term.startsWith(word)));
}

type ParsedQuery = z.output<typeof archiveQuerySchema>;

function passes(fixture: MockFixture, query: ParsedQuery): boolean {
  const { identity } = fixture;
  const start = seasonStart(fixture);
  return (
    (!query.competitionId || identity.competition.id === query.competitionId) &&
    (!query.clubId ||
      identity.home.id === query.clubId ||
      identity.away.id === query.clubId) &&
    (query.from === undefined || start >= query.from) &&
    (query.to === undefined || start <= query.to) &&
    (!query.q || matchesSearch(identity, query.q))
  );
}

// Newest first, then by id, as the backend orders
function newestFirst(a: MatchIdentity, b: MatchIdentity): number {
  if (a.date !== b.date) return a.date < b.date ? 1 : -1;
  return a.id.localeCompare(b.id);
}

export function archivePageOf(
  query: ArchiveQuery,
  fixtures: readonly MockFixture[] = PLAYABLE_FIXTURES,
): ApiResult<ArchivePage> {
  const parsed = archiveQuerySchema.safeParse(query);
  if (!parsed.success) {
    return fail('invalid_input', 'That search is not valid.');
  }

  const matches = fixtures
    .filter((fixture) => passes(fixture, parsed.data))
    .map((fixture) => fixture.identity)
    .sort(newestFirst);

  // The cursor is the last id already shown
  const { cursor, limit = ARCHIVE_PAGE_SIZE } = parsed.data;
  const start = cursor ? matches.findIndex((m) => m.id === cursor) + 1 : 0;
  if (cursor && start === 0) return fail('invalid_input', STALE_ARCHIVE_CURSOR);

  const entries = matches.slice(start, start + limit);
  const hasMore = start + limit < matches.length;
  return ok({
    entries,
    nextCursor: hasMore ? entries[entries.length - 1].id : null,
    total: matches.length,
  });
}
