'use client';

import { type RefObject, useLayoutEffect, useRef } from 'react';
import { useChangedSinceMount } from '@/hooks/use-changed-since-mount';
import { SECONDARY_BUTTON } from '@/styles/classes';
import type { HistoryMoreState } from '@/types/profile-screen';

type HistoryMoreProps = {
  more: HistoryMoreState;
  count: number;
  onShowMore: () => void;
  // The list whose rows the button appends
  listRef: RefObject<HTMLElement | null>;
  // What is listed, plural
  noun?: string;
};

const BUTTON = `w-full sm:w-auto aria-disabled:text-fg-muted aria-disabled:hover:bg-transparent ${SECONDARY_BUTTON}`;

// A row's own control, else the row itself
function focusRow(row: Element | undefined) {
  if (!(row instanceof HTMLElement)) return;
  const control = row.querySelector<HTMLElement>(
    'a[href], button:not([aria-disabled="true"])',
  );
  (control ?? row).focus();
}

export function HistoryMore({
  more,
  count,
  onShowMore,
  listRef,
  noun = 'games',
}: HistoryMoreProps) {
  const hasAppended = useChangedSinceMount(count);
  const isLoading = more === 'loading';
  // The row count when Show more was pressed
  const awaitedFrom = useRef<number | null>(null);

  // The last page removes the button; keep focus
  useLayoutEffect(() => {
    const from = awaitedFrom.current;
    if (from === null || more === 'loading') return;
    awaitedFrom.current = null;
    if (more !== 'end') return;
    const active = document.activeElement;
    if (active && active !== document.body) return;
    focusRow(listRef.current?.children[from]);
  }, [more, listRef]);

  function showMore() {
    awaitedFrom.current = count;
    onShowMore();
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p role="status" className="sr-only">
        {hasAppended ? `Showing ${count} ${noun}` : ''}
      </p>
      {more === 'failed' ? (
        <>
          <p role="alert" className="text-14 leading-5 text-danger">
            Couldn&apos;t load more {noun}.
          </p>
          <button type="button" onClick={showMore} className={BUTTON}>
            Try again
          </button>
        </>
      ) : null}
      {more === 'idle' || isLoading ? (
        // Not `disabled`: that would drop keyboard focus
        <button
          type="button"
          aria-disabled={isLoading}
          onClick={isLoading ? undefined : showMore}
          className={BUTTON}
        >
          {isLoading ? 'Loading…' : 'Show more'}
        </button>
      ) : null}
    </div>
  );
}
