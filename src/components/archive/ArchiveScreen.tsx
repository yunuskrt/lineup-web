'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useEffectEvent, useState, useTransition } from 'react';
import { ArchiveView } from '@/components/archive/ArchiveView';
import { QuitDialog } from '@/components/game/QuitDialog';
import { useArchive } from '@/hooks/use-archive';
import { useEnsureSession } from '@/hooks/use-auth';
import { useFilterOptions } from '@/hooks/use-filter-options';
import { useProAccess } from '@/hooks/use-pro';
import {
  ARCHIVE_SEARCH_DELAY_MS,
  archiveParams,
  archiveQueryOf,
  archiveSearchFrom,
  archiveSearchText,
  archiveView,
  pickedMatchPath,
  withOneClub,
} from '@/lib/archive';
import { authErrorMessageOf } from '@/lib/auth';
import { filtersFromParams, replaceQuery } from '@/lib/filters';
import { hasOpenRun, PRACTICE_OVER_RUN_COPY } from '@/lib/practice';
import { isStaleCursor } from '@/lib/profile';
import type { Filters } from '@/types/filters';
import type { MatchIdentity } from '@/types/match';

export function ArchiveScreen() {
  // Read once; the page keeps the URL in step after
  const searchParams = useSearchParams();
  const [params] = useState(() => new URLSearchParams(searchParams));
  const access = useProAccess();
  const options = useFilterOptions();
  const [search, setSearch] = useState(() => archiveSearchFrom(params));
  const [q, setQ] = useState(search);
  const [edited, setEdited] = useState<Filters | null>(null);
  const router = useRouter();
  const ensureSession = useEnsureSession();
  const [isNavigating, startNavigation] = useTransition();
  const [picked, setPicked] = useState<{
    id: string;
    kind: 'play' | 'practice';
  } | null>(null);
  // A practice start held by the open-run warning
  const [warnedMatch, setWarnedMatch] = useState<MatchIdentity | null>(null);
  const isStarting = ensureSession.isPending || isNavigating;

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

  // A guest is made first, as Start does
  async function start(match: MatchIdentity, practice: boolean) {
    setPicked({ id: match.id, kind: practice ? 'practice' : 'play' });
    try {
      await ensureSession.mutateAsync();
      startNavigation(() => router.push(pickedMatchPath(match.id, practice)));
    } catch {
      setPicked(null);
      setWarnedMatch(null);
    }
  }

  function play(match: MatchIdentity, practice: boolean) {
    if (practice && hasOpenRun()) setWarnedMatch(match);
    else void start(match, practice);
  }

  return (
    <>
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
        onPlay={play}
        starting={isStarting ? picked : null}
        playError={
          ensureSession.error && !isStarting
            ? authErrorMessageOf(ensureSession.error)
            : null
        }
      />
      {warnedMatch ? (
        <QuitDialog
          isOpen
          isQuitting={isStarting}
          copy={PRACTICE_OVER_RUN_COPY}
          onDismiss={() => setWarnedMatch(null)}
          onConfirm={() => void start(warnedMatch, true)}
        />
      ) : null}
    </>
  );
}
