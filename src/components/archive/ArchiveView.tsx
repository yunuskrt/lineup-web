'use client';

import { type SubmitEvent, useId, useRef } from 'react';
import { Archive, Search, SearchX, TriangleAlert } from 'lucide-react';
import {
  type ArchiveFilterState,
  ArchiveFilters,
} from '@/components/archive/ArchiveFilters';
import { ArchiveRow } from '@/components/archive/ArchiveRow';
import { ArchiveSkeletonRows } from '@/components/archive/ArchiveSkeleton';
import { ARCHIVE_LIST } from '@/components/archive/styles';
import { HistoryMore } from '@/components/profile/HistoryMore';
import { ProLock } from '@/components/pro/ProLock';
import RetryNotice from '@/components/shell/RetryNotice';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Empty, EmptyHeader, EmptyMedia } from '@/components/ui/empty';
import { useAppConfig } from '@/hooks/use-pro';
import { ARCHIVE_SEARCH_MAX } from '@/lib/api/schemas/catalog';
import { archiveTotalLine } from '@/lib/archive';
import { showsPro } from '@/lib/pro';
import { cn } from '@/lib/utils';
import {
  BOARD_SECTION,
  SECONDARY_BUTTON,
  TEXT_INPUT,
  TYPE_TITLE,
} from '@/styles/classes';
import type { ArchiveView as ArchiveViewModel } from '@/types/archive';
import type { Filters } from '@/types/filters';
import type { MatchIdentity } from '@/types/match';
import { SKELETON } from '@/components/ui/skeleton';
import { StateNotice } from '@/components/shell/StateNotice';

const LOCKED_LINE =
  'Every match in the game, searchable. Pick one and play it.';

const LINE = 'text-16 leading-6 text-fg-muted';

type ArchiveViewProps = {
  view: ArchiveViewModel;
  search: string;
  filterState: ArchiveFilterState | null;
  // Clear search, or Clear filters with no search
  clearLabel: string;
  onSearchChange: (text: string) => void;
  onSearchSubmit: () => void;
  onFiltersChange: (filters: Filters) => void;
  onClear: () => void;
  onRetry: () => void;
  onShowMore: () => void;
  onPlay: (match: MatchIdentity, practice: boolean) => void;
  // The row whose run is being started, and how
  starting: { id: string; kind: 'play' | 'practice' } | null;
  // Making the guest for a run failed
  playError?: string | null;
};

function Header({ view }: { view: ArchiveViewModel }) {
  const isLocked = view.status === 'locked';
  const config = useAppConfig();

  return (
    <header className={cn(BOARD_SECTION, 'gap-2')}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className={TYPE_TITLE}>Archive</h1>
        {/* No word "Pro" while the split is off */}
        {showsPro(config.data ?? null) ? (
          <Badge variant="sticker" tone="brand">
            Pro
          </Badge>
        ) : null}
      </div>
      {isLocked ? (
        <p className={LINE}>{LOCKED_LINE}</p>
      ) : view.total !== null ? (
        <p aria-live="polite" className={LINE}>
          {archiveTotalLine(view.total)}
        </p>
      ) : (
        // The line's own height while the total loads
        <div aria-hidden="true" className="flex h-6 items-center">
          <span className={`h-4 w-full max-w-md ${SKELETON}`} />
        </div>
      )}
    </header>
  );
}

function Results({
  view,
  clearLabel,
  onClear,
  onRetry,
  onShowMore,
  onPlay,
  starting,
}: Pick<
  ArchiveViewProps,
  | 'view'
  | 'clearLabel'
  | 'onClear'
  | 'onRetry'
  | 'onShowMore'
  | 'onPlay'
  | 'starting'
>) {
  const listRef = useRef<HTMLUListElement>(null);
  switch (view.status) {
    case 'loading':
      return (
        <>
          <p role="status" className="sr-only">
            Loading matches
          </p>
          <ArchiveSkeletonRows />
        </>
      );
    case 'error':
      return <RetryNotice message={view.errorMessage} onRetry={onRetry} />;
    case 'empty':
      return (
        <StateNotice
          tone="empty"
          icon={SearchX}
          message="No match fits. Try fewer words or a wider filter."
        >
          <button type="button" onClick={onClear} className={SECONDARY_BUTTON}>
            {clearLabel}
          </button>
        </StateNotice>
      );
    case 'list':
      return (
        <div className="flex flex-col gap-6">
          <ul
            ref={listRef}
            aria-label="Matches, newest first"
            aria-busy={view.isRefreshing}
            className={cn(ARCHIVE_LIST, view.isRefreshing && 'opacity-60')}
          >
            {view.entries.map((match) => (
              <ArchiveRow
                key={match.id}
                match={match}
                onPlay={onPlay}
                starting={starting?.id === match.id ? starting.kind : null}
                isDisabled={starting !== null && starting.id !== match.id}
              />
            ))}
          </ul>
          <HistoryMore
            more={view.more}
            count={view.entries.length}
            onShowMore={onShowMore}
            listRef={listRef}
            noun="matches"
          />
        </div>
      );
    case 'pending':
    case 'locked':
      return null;
  }
}

export function ArchiveView({
  view,
  search,
  filterState,
  clearLabel,
  onSearchChange,
  onSearchSubmit,
  onFiltersChange,
  onClear,
  onRetry,
  onShowMore,
  onPlay,
  starting,
  playError = null,
}: ArchiveViewProps) {
  const searchId = useId();
  const searchRef = useRef<HTMLInputElement>(null);

  // The empty state goes; focus the search
  function clear() {
    onClear();
    searchRef.current?.focus();
  }

  function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearchSubmit();
  }

  // No controls until the lock is known: no flash
  if (view.status === 'pending') {
    return (
      <div>
        <Header view={view} />
        <div className={BOARD_SECTION}>
          <ArchiveSkeletonRows />
        </div>
      </div>
    );
  }

  if (view.status === 'locked') {
    return (
      <div>
        <Header view={view} />
        <div className={BOARD_SECTION}>
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <Archive />
              </EmptyMedia>
            </EmptyHeader>
            <ProLock
              label="Browse the archive"
              caption="The archive is part of Pro."
              size="large"
            />
          </Empty>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header view={view} />
      <div className={BOARD_SECTION}>
        <form role="search" onSubmit={submit} className="relative max-w-xl">
          <label htmlFor={searchId} className="sr-only">
            Search the archive
          </label>
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-fg-muted"
          />
          <input
            ref={searchRef}
            id={searchId}
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search the archive"
            maxLength={ARCHIVE_SEARCH_MAX}
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
            className={cn(TEXT_INPUT, 'pl-11')}
          />
        </form>
        <ArchiveFilters state={filterState} onChange={onFiltersChange} />
      </div>
      <section aria-label="Results" className={BOARD_SECTION}>
        {playError ? (
          <Alert role="alert">
            <TriangleAlert aria-hidden="true" />
            <AlertDescription>{playError}</AlertDescription>
          </Alert>
        ) : null}
        <Results
          view={view}
          clearLabel={clearLabel}
          onClear={clear}
          onRetry={onRetry}
          onShowMore={onShowMore}
          onPlay={onPlay}
          starting={starting}
        />
      </section>
    </div>
  );
}
