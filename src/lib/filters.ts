import type { EmptyPoolReason } from '@/types/api';
import type { CompetitionOption, FilterOptions } from '@/types/catalog';
import type { EraRange, Filters } from '@/types/filters';
import type { ClubRef, CompetitionKind } from '@/types/match';
import type { PlayMode } from '@/types/play';

export const FILTER_PARAMS = {
  competition: 'competition',
  club: 'club',
  from: 'from',
  to: 'to',
  mode: 'mode',
} as const;

const SEASON_START = /^\d{4}$/;

const COMPETITION_GROUPS: readonly {
  label: string;
  kinds: readonly CompetitionKind[];
}[] = [
  { label: 'Leagues', kinds: ['league'] },
  { label: 'European cups', kinds: ['ucl', 'uel'] },
  { label: 'International', kinds: ['world_cup', 'euro'] },
];

export type CompetitionGroup<T> = { label: string; competitions: T[] };

// Empty groups are left out
export function competitionGroups<T extends { kind: CompetitionKind }>(
  competitions: readonly T[],
): CompetitionGroup<T>[] {
  return COMPETITION_GROUPS.map(({ label, kinds }) => ({
    label,
    competitions: competitions.filter((competition) =>
      kinds.includes(competition.kind),
    ),
  })).filter((group) => group.competitions.length > 0);
}

// Null unless exactly one known competition
export function pickedCompetition(
  filters: Filters,
  options: FilterOptions,
): CompetitionOption | null {
  if (filters.competitionIds.length !== 1) return null;
  const [id] = filters.competitionIds;
  return options.competitions.find((option) => option.id === id) ?? null;
}

export function clubsFor(
  options: FilterOptions,
  competition: CompetitionOption | null,
): ClubRef[] {
  if (!competition) return [...options.clubs];
  const ids = new Set(competition.clubIds);
  return options.clubs.filter((club) => ids.has(club.id));
}

export function effectiveSeasons(
  filters: Filters,
  options: FilterOptions,
): number[] {
  return (
    pickedCompetition(filters, options)?.seasonStarts ?? seasonsIn(options.era)
  );
}

export function rangeOf(seasons: readonly number[]): EraRange {
  return { from: seasons[0], to: seasons[seasons.length - 1] };
}

function isSameRange(a: EraRange, b: EraRange): boolean {
  return a.from === b.from && a.to === b.to;
}

// Snaps onto offered seasons, else resets
export function fitEra(era: EraRange, seasons: readonly number[]): EraRange {
  const from = seasons.find((season) => season >= era.from);
  const to = seasons.findLast((season) => season <= era.to);
  if (from === undefined || to === undefined || from > to) {
    return rangeOf(seasons);
  }
  return { from, to };
}

// Null picks Any; drops clubs and fits the era
export function selectCompetition(
  filters: Filters,
  id: string | null,
  options: FilterOptions,
): Filters {
  const next = { ...filters, competitionIds: id === null ? [] : [id] };
  const competition = pickedCompetition(next, options);
  const before = rangeOf(effectiveSeasons(filters, options));
  const seasons = effectiveSeasons(next, options);

  return {
    ...next,
    clubIds: competition
      ? filters.clubIds.filter((club) => competition.clubIds.includes(club))
      : filters.clubIds,
    era: isSameRange(filters.era, before)
      ? rangeOf(seasons)
      : fitEra(filters.era, seasons),
  };
}

export const CLUB_SEARCH_MIN = 2;
export const CLUB_RESULTS_MAX = 12;

const LETTER_FOLDS: Record<string, string> = {
  ı: 'i',
  ø: 'o',
  ł: 'l',
  đ: 'd',
};

export function searchKey(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[ıøłđ]/g, (letter) => LETTER_FOLDS[letter])
    .trim();
}

export function searchClubs(
  clubs: readonly ClubRef[],
  query: string,
): ClubRef[] {
  const key = searchKey(query);
  return clubs.filter(
    (club) =>
      searchKey(club.name).includes(key) ||
      searchKey(club.shortName).includes(key),
  );
}

export type ClubRowView = {
  // Catalog order, so a pressed chip never moves
  clubs: ClubRef[];
  hasSearch: boolean;
  isSearchingAll: boolean;
  matchCount: number | null;
  moreCount: number;
};

export function clubRowView(
  filters: Filters,
  options: FilterOptions,
  query: string,
): ClubRowView {
  const competition = pickedCompetition(filters, options);
  const list = clubsFor(options, competition);
  const isSearchingAll = competition === null;
  const hasSearch = isSearchingAll || list.length > CLUB_RESULTS_MAX;
  const isSearching =
    hasSearch &&
    searchKey(query).length >= (isSearchingAll ? CLUB_SEARCH_MIN : 1);

  if (!isSearching) {
    return {
      clubs: isSearchingAll
        ? list.filter((club) => filters.clubIds.includes(club.id))
        : list,
      hasSearch,
      isSearchingAll,
      matchCount: null,
      moreCount: 0,
    };
  }

  const matches = new Set(searchClubs(list, query).map((club) => club.id));
  const cap = isSearchingAll ? CLUB_RESULTS_MAX : Infinity;
  let shown = 0;
  const clubs = list.filter((club) => {
    if (filters.clubIds.includes(club.id)) return true;
    if (!matches.has(club.id) || shown >= cap) return false;
    shown += 1;
    return true;
  });
  const unselected = [...matches].filter(
    (id) => !filters.clubIds.includes(id),
  ).length;

  return {
    clubs,
    hasSearch,
    isSearchingAll,
    matchCount: matches.size,
    moreCount: unselected - shown,
  };
}

function seasonParam(params: URLSearchParams, key: string): number | null {
  const value = params.get(key);
  return value !== null && SEASON_START.test(value) ? Number(value) : null;
}

export function filtersFromParams(
  params: URLSearchParams,
  options: FilterOptions,
): Filters {
  // Old links may hold several; first known wins
  const competition =
    params
      .getAll(FILTER_PARAMS.competition)
      .map((id) => options.competitions.find((option) => option.id === id))
      .find((option) => option !== undefined) ?? null;
  const clubs = new Set(params.getAll(FILTER_PARAMS.club));
  const seasons = competition?.seasonStarts ?? seasonsIn(options.era);
  const full = rangeOf(seasons);

  return {
    competitionIds: competition ? [competition.id] : [],
    clubIds: clubsFor(options, competition)
      .filter((club) => clubs.has(club.id))
      .map((club) => club.id),
    era: fitEra(
      {
        from: seasonParam(params, FILTER_PARAMS.from) ?? full.from,
        to: seasonParam(params, FILTER_PARAMS.to) ?? full.to,
      },
      seasons,
    ),
  };
}

export function filtersToParams(
  filters: Filters,
  options: FilterOptions,
): URLSearchParams {
  const params = new URLSearchParams();
  const full = rangeOf(effectiveSeasons(filters, options));
  for (const id of filters.competitionIds) {
    params.append(FILTER_PARAMS.competition, id);
  }
  for (const id of filters.clubIds) params.append(FILTER_PARAMS.club, id);
  if (filters.era.from !== full.from) {
    params.set(FILTER_PARAMS.from, String(filters.era.from));
  }
  if (filters.era.to !== full.to) {
    params.set(FILTER_PARAMS.to, String(filters.era.to));
  }
  return params;
}

// Keeps other params, like the mode, as they were
export function withFilters(
  params: URLSearchParams,
  filters: Filters,
  options: FilterOptions,
): URLSearchParams {
  const next = new URLSearchParams(params);
  for (const key of [
    FILTER_PARAMS.competition,
    FILTER_PARAMS.club,
    FILTER_PARAMS.from,
    FILTER_PARAMS.to,
  ]) {
    next.delete(key);
  }
  for (const [key, value] of filtersToParams(filters, options)) {
    next.append(key, value);
  }
  return next;
}

// Null when no single group is to blame
export function widenFilters(
  filters: Filters,
  reason: EmptyPoolReason,
  options: FilterOptions,
): Filters | null {
  switch (reason) {
    case 'competition':
      return selectCompetition(filters, null, options);
    case 'club':
      return { ...filters, clubIds: [] };
    case 'era':
      return { ...filters, era: rangeOf(effectiveSeasons(filters, options)) };
    case 'combination':
      return null;
  }
}

export function toggleId(
  selected: readonly string[],
  id: string,
  options: readonly { id: string }[],
): string[] {
  const next = new Set(selected);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return options
    .filter((option) => next.has(option.id))
    .map((option) => option.id);
}

export function playModeFrom(param: string | null): PlayMode {
  return param === 'duel' ? 'duel' : 'solo';
}

export function withMode(
  params: URLSearchParams,
  mode: PlayMode,
): URLSearchParams {
  const next = new URLSearchParams(params);
  next.delete(FILTER_PARAMS.mode);
  if (mode === 'duel') next.set(FILTER_PARAMS.mode, mode);
  return next;
}

export function seasonLabel(start: number): string {
  return `${start}–${String((start + 1) % 100).padStart(2, '0')}`;
}

export function seasonsIn({ from, to }: EraRange): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}

export function withQuery(path: string, params: URLSearchParams): string {
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

// Filters into the URL, no server round trip
export function replaceQuery(params: URLSearchParams): void {
  window.history.replaceState(
    null,
    '',
    withQuery(window.location.pathname, params),
  );
}
