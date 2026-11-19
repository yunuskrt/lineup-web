'use client';

import React, { useRef } from 'react';
import { SearchX } from 'lucide-react';
import ArchiveRow from '@/components/archive/ArchiveRow';
import ArchiveSkeletonRows from '@/components/archive/ArchiveSkeleton';
import type { ArchiveViewProps } from '@/components/archive/ArchiveView';
import { ARCHIVE_LIST } from '@/components/archive/styles';
import HistoryMore from '@/components/profile/HistoryMore';
import RetryNotice from '@/components/shell/RetryNotice';
import { cn } from '@/lib/utils';
import { SECONDARY_BUTTON } from '@/styles/classes';
import StateNotice from '@/components/shell/StateNotice';

type Props = Pick<
  ArchiveViewProps,
  | 'view'
  | 'clearLabel'
  | 'onClear'
  | 'onRetry'
  | 'onShowMore'
  | 'onPlay'
  | 'starting'
>;

const Results = ({
  view,
  clearLabel,
  onClear,
  onRetry,
  onShowMore,
  onPlay,
  starting,
}: Props) => {
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
};

export default Results;
