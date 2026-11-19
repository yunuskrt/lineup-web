'use client';

import React, { type SubmitEvent, useId, useRef } from 'react';
import { Archive, Search, TriangleAlert } from 'lucide-react';
import ArchiveFilters, {
  type ArchiveFilterState,
} from '@/components/archive/ArchiveFilters';
import Header from '@/components/archive/archive-view/Header';
import Results from '@/components/archive/archive-view/Results';
import ArchiveSkeletonRows from '@/components/archive/ArchiveSkeleton';
import ProLock from '@/components/pro/ProLock';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Empty, EmptyHeader, EmptyMedia } from '@/components/ui/empty';
import { ARCHIVE_SEARCH_MAX } from '@/lib/api/schemas/catalog';
import { cn } from '@/lib/utils';
import { BOARD_SECTION, TEXT_INPUT } from '@/styles/classes';
import type { ArchiveView as ArchiveViewModel } from '@/types/archive';
import type { Filters } from '@/types/filters';
import type { MatchIdentity } from '@/types/match';

export type ArchiveViewProps = {
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

type Props = ArchiveViewProps;

const ArchiveView = ({
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
}: Props) => {
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
};

export default ArchiveView;
