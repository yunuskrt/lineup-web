'use client';

import { useChangedSinceMount } from '@/hooks/use-changed-since-mount';
import { SECONDARY_BUTTON } from '@/styles/classes';
import type { HistoryMoreState } from '@/types/profile-screen';

type HistoryMoreProps = {
  more: HistoryMoreState;
  count: number;
  onShowMore: () => void;
};

const BUTTON = `w-full sm:w-auto aria-disabled:text-fg-muted aria-disabled:hover:bg-transparent ${SECONDARY_BUTTON}`;

export function HistoryMore({ more, count, onShowMore }: HistoryMoreProps) {
  const hasAppended = useChangedSinceMount(count);
  const isLoading = more === 'loading';

  return (
    <div className="flex flex-col items-center gap-3">
      <p role="status" className="sr-only">
        {hasAppended ? `Showing ${count} games` : ''}
      </p>
      {more === 'failed' ? (
        <>
          <p role="alert" className="text-14 leading-5 text-danger">
            Couldn&apos;t load more games.
          </p>
          <button type="button" onClick={onShowMore} className={BUTTON}>
            Try again
          </button>
        </>
      ) : null}
      {more === 'idle' || isLoading ? (
        // Not `disabled`: that would drop keyboard focus
        <button
          type="button"
          aria-disabled={isLoading}
          onClick={isLoading ? undefined : onShowMore}
          className={BUTTON}
        >
          {isLoading ? 'Loading…' : 'Show more'}
        </button>
      ) : null}
    </div>
  );
}
