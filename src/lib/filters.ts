import type { FilterOptions } from '@/types/catalog';
import type { EraRange, Filters } from '@/types/filters';
import type { PlayMode } from '@/types/play';

export const FILTER_PARAMS = {
  competition: 'competition',
  club: 'club',
  from: 'from',
  to: 'to',
  mode: 'mode',
} as const;

const SEASON_START = /^\d{4}$/;

function knownIds(
  params: URLSearchParams,
  key: string,
  options: readonly { id: string }[],
): string[] {
  const selected = new Set(params.getAll(key));
  return options
    .filter((option) => selected.has(option.id))
    .map((option) => option.id);
}

function seasonParam(
  params: URLSearchParams,
  key: string,
  { from, to }: EraRange,
): number | null {
  const value = params.get(key);
  if (value === null || !SEASON_START.test(value)) return null;
  return Math.min(to, Math.max(from, Number(value)));
}

export function filtersFromParams(
  params: URLSearchParams,
  options: FilterOptions,
): Filters {
  const from = seasonParam(params, FILTER_PARAMS.from, options.era);
  const to = seasonParam(params, FILTER_PARAMS.to, options.era);
  const era = {
    from: from ?? options.era.from,
    to: to ?? options.era.to,
  };

  return {
    competitionIds: knownIds(
      params,
      FILTER_PARAMS.competition,
      options.competitions,
    ),
    clubIds: knownIds(params, FILTER_PARAMS.club, options.clubs),
    era: era.from <= era.to ? era : { ...options.era },
  };
}

export function filtersToParams(
  filters: Filters,
  options: FilterOptions,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const id of filters.competitionIds) {
    params.append(FILTER_PARAMS.competition, id);
  }
  for (const id of filters.clubIds) params.append(FILTER_PARAMS.club, id);
  if (filters.era.from !== options.era.from) {
    params.set(FILTER_PARAMS.from, String(filters.era.from));
  }
  if (filters.era.to !== options.era.to) {
    params.set(FILTER_PARAMS.to, String(filters.era.to));
  }
  return params;
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
