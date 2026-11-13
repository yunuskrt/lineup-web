'use client';

import { type SubmitEvent, useId, useRef } from 'react';
import {
  type ArchiveFilterState,
  ArchiveFilters,
} from '@/components/archive/ArchiveFilters';
import { ArchiveRow } from '@/components/archive/ArchiveRow';
import { ArchiveSkeletonRows } from '@/components/archive/ArchiveSkeleton';
import { ARCHIVE_LIST } from '@/components/archive/styles';
import { HistoryMore } from '@/components/profile/HistoryMore';
import { PROFILE_HEADING } from '@/components/profile/styles';
import { ProLock } from '@/components/pro/ProLock';
import { ARCHIVE_SEARCH_MAX } from '@/lib/api/schemas/catalog';
import { archiveTotalLine } from '@/lib/archive';
import { SECONDARY_BUTTON, TEXT_INPUT } from '@/styles/classes';
import type { ArchiveView as ArchiveViewModel } from '@/types/archive';
import type { Filters } from '@/types/filters';
import type { MatchIdentity } from '@/types/match';

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

  return (
    <header className="flex flex-col gap-2">
      <h1 className={PROFILE_HEADING}>Archive</h1>
      {isLocked ? (
        <p className={LINE}>{LOCKED_LINE}</p>
      ) : view.total !== null ? (
        <p aria-live="polite" className={LINE}>
          {archiveTotalLine(view.total)}
        </p>
      ) : (
        // The line's own height while the total loads
        <div aria-hidden="true" className="flex h-6 items-center">
          <span className="h-4 w-full max-w-md rounded-sm bg-skeleton-fill" />
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
      return (
        <div className="flex flex-col items-start gap-4">
          <p role="alert" className="text-16 leading-6 text-danger">
            {view.errorMessage}
          </p>
          <button type="button" onClick={onRetry} className={SECONDARY_BUTTON}>
            Try again
          </button>
        </div>
      );
    case 'empty':
      return (
        <div className="flex flex-col items-start gap-4">
          <p className="text-16 leading-6">
            No match fits. Try fewer words or a wider filter.
          </p>
          <button type="button" onClick={onClear} className={SECONDARY_BUTTON}>
            {clearLabel}
          </button>
        </div>
      );
    case 'list':
      return (
        <div className="flex flex-col gap-6">
          <ul
            ref={listRef}
            aria-label="Matches, newest first"
            aria-busy={view.isRefreshing}
            className={`${ARCHIVE_LIST} divide-y divide-line ${
              view.isRefreshing ? 'opacity-60' : ''
            }`}
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
      <div className="flex flex-col gap-8">
        <Header view={view} />
        <ArchiveSkeletonRows />
      </div>
    );
  }

  if (view.status === 'locked') {
    return (
      <div className="flex flex-col gap-8">
        <Header view={view} />
        <ProLock
          label="Browse the archive"
          caption="The archive is part of Pro."
          size="large"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <Header view={view} />
      <div className="flex flex-col gap-4">
        <form role="search" onSubmit={submit} className="max-w-xl">
          <label htmlFor={searchId} className="sr-only">
            Search the archive
          </label>
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
            className={`${TEXT_INPUT} placeholder:text-fg-dim`}
          />
        </form>
        <ArchiveFilters state={filterState} onChange={onFiltersChange} />
      </div>
      <section aria-label="Results" className="flex flex-col gap-4">
        {playError ? (
          <p role="alert" className="text-14 leading-5 text-danger">
            {playError}
          </p>
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
