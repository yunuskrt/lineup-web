'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useEffectEvent, useState } from 'react';
import { ArchiveView } from '@/components/archive/ArchiveView';
import { useArchive } from '@/hooks/use-archive';
import { useFilterOptions } from '@/hooks/use-filter-options';
import { useProAccess } from '@/hooks/use-pro';
import {
  ARCHIVE_SEARCH_DELAY_MS,
  archiveParams,
  archiveQueryOf,
  archiveSearchFrom,
  archiveSearchText,
  archiveView,
  withOneClub,
} from '@/lib/archive';
import { filtersFromParams, replaceQuery } from '@/lib/filters';
import { isStaleCursor } from '@/lib/profile';
import type { Filters } from '@/types/filters';

export function ArchiveScreen() {
  // Read once; the page keeps the URL in step after
  const searchParams = useSearchParams();
  const [params] = useState(() => new URLSearchParams(searchParams));
  const access = useProAccess();
  const options = useFilterOptions();
  const [search, setSearch] = useState(() => archiveSearchFrom(params));
  const [q, setQ] = useState(search);
  const [edited, setEdited] = useState<Filters | null>(null);

  const filters =
    edited ?? (options.data ? filtersFromParams(params, options.data) : null);
  // Locked or still loading: no request at all
  const query =
    access === 'open' && filters ? archiveQueryOf(q, filters) : null;
  const archive = useArchive(query);

  const view = archiveView({
    access,
    options: {
      isError: options.isError,
      error: options.error,
      hasData: options.data !== undefined,
    },
    pages: archive.data?.pages,
    isError: archive.isError,
    error: archive.error,
    isPlaceholderData: archive.isPlaceholderData,
    isFetchingNextPage: archive.isFetchingNextPage,
    isFetchNextPageError: archive.isFetchNextPageError,
    hasNextPage: archive.hasNextPage,
  });

  function apply(nextQ: string, nextFilters: Filters | null = filters) {
    setQ(nextQ);
    if (nextFilters && options.data) {
      replaceQuery(archiveParams(nextQ, nextFilters, options.data));
    }
  }

  const applyTyped = useEffectEvent((next: string) => apply(next));

  // Searches once typing stops; Enter goes at once
  useEffect(() => {
    const next = archiveSearchText(search);
    if (next === q) return;
    const timer = setTimeout(() => applyTyped(next), ARCHIVE_SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [search, q]);

  function changeFilters(next: Filters) {
    if (!filters) return;
    const picked = withOneClub(filters, next);
    setEdited(picked);
    apply(q, picked);
  }

  function clear() {
    if (q) {
      setSearch('');
      apply('');
      return;
    }
    if (!options.data) return;
    const all = filtersFromParams(new URLSearchParams(), options.data);
    setEdited(all);
    apply('', all);
  }

  function retry() {
    if (options.isError && !options.data) void options.refetch();
    else void archive.refetch();
  }

  function showMore() {
    if (archive.isFetchingNextPage) return;
    // A page link the server forgot: start over
    if (archive.isFetchNextPageError && isStaleCursor(archive.error)) {
      void archive.refetch();
      return;
    }
    void archive.fetchNextPage();
  }

  return (
    <ArchiveView
      view={view}
      search={search}
      filterState={
        filters && options.data ? { options: options.data, filters } : null
      }
      clearLabel={q ? 'Clear search' : 'Clear filters'}
      onSearchChange={setSearch}
      onSearchSubmit={() => apply(archiveSearchText(search))}
      onFiltersChange={changeFilters}
      onClear={clear}
      onRetry={retry}
      onShowMore={showMore}
    />
  );
}
