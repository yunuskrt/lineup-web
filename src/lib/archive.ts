import { ARCHIVE_SEARCH_MAX } from '@/lib/api/schemas/catalog';
import { authErrorMessageOf } from '@/lib/auth';
import { filtersFromParams, filtersToParams, withQuery } from '@/lib/filters';
import { filterSummary } from '@/lib/lobby';
import type { ArchiveStatus, ArchiveView } from '@/types/archive';
import type { ArchivePage, ArchiveQuery, FilterOptions } from '@/types/catalog';
import type { Filters } from '@/types/filters';
import type { MatchIdentity } from '@/types/match';
import type { ProAccess } from '@/types/pro';
import type { HistoryMoreState } from '@/types/profile-screen';
import type { SoloStartRequest } from '@/types/solo';

export const ARCHIVE_PATH = '/archive';
export const ARCHIVE_SEARCH_PARAM = 'q';
export const ARCHIVE_SEARCH_DELAY_MS = 300;
export const PICKED_MATCH_PARAM = 'match';

// Short months keep the date column narrow
const ARCHIVE_DATE = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const COUNT = new Intl.NumberFormat('en-GB');

export function archiveDateLabel(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return ARCHIVE_DATE.format(Date.UTC(year, month - 1, day));
}

export function archiveSearchText(text: string): string {
  return text.trim().slice(0, ARCHIVE_SEARCH_MAX);
}

export function archiveSearchFrom(params: URLSearchParams): string {
  return archiveSearchText(params.get(ARCHIVE_SEARCH_PARAM) ?? '');
}

// A run on one match from the archive (R13)
export function pickedMatchPath(matchId: string): string {
  return withQuery(
    '/play/solo',
    new URLSearchParams({ [PICKED_MATCH_PARAM]: matchId }),
  );
}

// Back to /play: the filters stay, the pick goes
export function withoutPickedMatch(params: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(params);
  next.delete(PICKED_MATCH_PARAM);
  return next;
}

export function pickedMatchFrom(params: URLSearchParams): string | null {
  return params.get(PICKED_MATCH_PARAM)?.trim() || null;
}

// The filters ride along; the server ignores them
export function soloStartRequestOf(
  filters: Filters,
  matchId: string | null,
): SoloStartRequest {
  return matchId ? { ...filters, matchId } : filters;
}

// Every row has a Play; the name says which
export function playMatchLabel(match: MatchIdentity): string {
  return `Play ${match.home.name} v ${match.away.name}, ${archiveDateLabel(match.date)}`;
}

// R12 takes one competition and one club at most
export function archiveQueryOf(q: string, filters: Filters): ArchiveQuery {
  const search = archiveSearchText(q);
  const [competitionId] = filters.competitionIds;
  const [clubId] = filters.clubIds;
  return {
    ...(search ? { q: search } : {}),
    ...(filters.competitionIds.length === 1 ? { competitionId } : {}),
    ...(filters.clubIds.length === 1 ? { clubId } : {}),
    from: filters.era.from,
    to: filters.era.to,
  };
}

export function archiveQueryFromParams(
  params: URLSearchParams,
  options: FilterOptions,
): ArchiveQuery {
  return archiveQueryOf(
    archiveSearchFrom(params),
    filtersFromParams(params, options),
  );
}

// The filters as on /play, plus the search
export function archiveParams(
  q: string,
  filters: Filters,
  options: FilterOptions,
): URLSearchParams {
  const params = filtersToParams(filters, options);
  const search = archiveSearchText(q);
  if (search) params.set(ARCHIVE_SEARCH_PARAM, search);
  return params;
}

// One club at a time: the newest pick wins
export function withOneClub(previous: Filters, next: Filters): Filters {
  if (next.clubIds.length <= 1) return next;
  const added = next.clubIds.filter((id) => !previous.clubIds.includes(id));
  return { ...next, clubIds: (added.length ? added : next.clubIds).slice(-1) };
}

// Null when every filter is on Any
export function activeFiltersLabel(
  filters: Filters,
  options: FilterOptions,
): string | null {
  const values = filterSummary(filters, options)
    .map((line) => line.value)
    .filter((value) => value !== 'Any' && value !== 'Any season');
  return values.length ? values.join(', ') : null;
}

export function archiveTotalLine(total: number): string {
  const noun = total === 1 ? 'match' : 'matches';
  return `${COUNT.format(total)} ${noun}. Search by club, competition, season or nickname.`;
}

type ArchiveInput = {
  access: ProAccess;
  // A failed background refetch keeps its data
  options: { isError: boolean; error: unknown; hasData: boolean };
  pages: ArchivePage[] | undefined;
  isError: boolean;
  error: unknown;
  isPlaceholderData: boolean;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
  hasNextPage: boolean;
};

function moreState(input: ArchiveInput): HistoryMoreState {
  if (input.isFetchingNextPage) return 'loading';
  if (input.isFetchNextPageError) return 'failed';
  return input.hasNextPage ? 'idle' : 'end';
}

function hasOptionsFailed({ options }: ArchiveInput): boolean {
  return options.isError && !options.hasData;
}

function statusOf(input: ArchiveInput, total: number | null): ArchiveStatus {
  if (input.access === 'pending') return 'pending';
  if (input.access === 'locked') return 'locked';
  if (hasOptionsFailed(input)) return 'error';
  if (total === null) return input.isError ? 'error' : 'loading';
  return total === 0 ? 'empty' : 'list';
}

// Locked never asks; a failed page keeps the rest
export function archiveView(input: ArchiveInput): ArchiveView {
  const pages = input.access === 'open' ? input.pages : undefined;
  const total = pages?.[0]?.total ?? null;
  const status = statusOf(input, total);
  const failure = hasOptionsFailed(input) ? input.options.error : input.error;

  return {
    status,
    total,
    entries: pages?.flatMap((page) => page.entries) ?? [],
    more: moreState(input),
    errorMessage: status === 'error' ? authErrorMessageOf(failure) : undefined,
    isRefreshing: input.isPlaceholderData,
  };
}
