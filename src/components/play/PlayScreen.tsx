'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { FilterPanel } from '@/components/play/FilterPanel';
import { FilterSkeleton } from '@/components/play/FilterSkeleton';
import { ModeChoice } from '@/components/play/ModeChoice';
import { PlayStart } from '@/components/play/PlayStart';
import { useFilterOptions } from '@/hooks/use-filter-options';
import { authErrorMessageOf } from '@/lib/auth';
import {
  FILTER_PARAMS,
  filtersFromParams,
  filtersToParams,
  playModeFrom,
  withMode,
  withQuery,
} from '@/lib/filters';
import { SECONDARY_BUTTON } from '@/styles/classes';
import type { Filters } from '@/types/filters';
import type { PlayMode } from '@/types/play';

// Keeps filters in the URL without a server round trip
function replaceQuery(params: URLSearchParams) {
  window.history.replaceState(
    null,
    '',
    withQuery(window.location.pathname, params),
  );
}

export function PlayScreen() {
  // Page props go stale after replaceState; this won't
  const searchParams = useSearchParams();
  const [params] = useState(() => new URLSearchParams(searchParams));
  const [mode, setMode] = useState(() =>
    playModeFrom(params.get(FILTER_PARAMS.mode)),
  );
  const [edited, setEdited] = useState<Filters | null>(null);
  const options = useFilterOptions();

  const filters =
    edited ?? (options.data ? filtersFromParams(params, options.data) : null);
  const filterParams =
    filters && options.data ? filtersToParams(filters, options.data) : null;

  function changeMode(next: PlayMode) {
    setMode(next);
    replaceQuery(withMode(filterParams ?? params, next));
  }

  function changeFilters(next: Filters) {
    if (!options.data) return;
    setEdited(next);
    replaceQuery(withMode(filtersToParams(next, options.data), mode));
  }

  return (
    <div className="flex flex-col gap-12">
      <ModeChoice mode={mode} onChange={changeMode} />
      <section
        aria-labelledby="play-filters"
        className="flex max-w-4xl flex-col gap-8"
      >
        <div>
          <h2 id="play-filters" className="text-20 font-semibold">
            Match filters
          </h2>
          <p className="mt-2 text-14 text-fg-muted">
            Choose where the match comes from. Leave a group on Any to include
            all of it.
          </p>
        </div>
        {/* A failed background refetch keeps its data */}
        {filters && options.data ? (
          <FilterPanel
            options={options.data}
            filters={filters}
            onChange={changeFilters}
          />
        ) : options.isError ? (
          <div className="flex flex-col items-start gap-4">
            <p role="alert" className="text-14 text-danger">
              {authErrorMessageOf(options.error)}
            </p>
            <button
              type="button"
              onClick={() => options.refetch()}
              className={SECONDARY_BUTTON}
            >
              Try again
            </button>
          </div>
        ) : (
          <FilterSkeleton />
        )}
        <PlayStart
          mode={mode}
          href={filterParams ? withQuery(`/play/${mode}`, filterParams) : null}
        />
      </section>
    </div>
  );
}
