'use client';

import Link from 'next/link';
import { useId } from 'react';
import { HistoryMore } from '@/components/profile/HistoryMore';
import { HistoryRow } from '@/components/profile/HistoryRow';
import { PROFILE_PANEL, SECTION_HEADING } from '@/components/profile/styles';
import { useToday } from '@/hooks/use-today';
import { PRIMARY_BUTTON } from '@/styles/classes';
import type { HistoryEntry } from '@/types/profile';
import type { HistoryMoreState } from '@/types/profile-screen';

type HistoryListProps = {
  history: HistoryEntry[];
  more: HistoryMoreState;
  onShowMore: () => void;
};

function EmptyHistory() {
  return (
    <div className={`${PROFILE_PANEL} flex flex-col items-start gap-4 p-6`}>
      <div className="flex flex-col gap-1">
        <h3 className="text-16 leading-6 font-semibold">No games yet</h3>
        <p className="text-14 leading-5 text-fg-muted">
          Your solo runs and duels will be listed here.
        </p>
      </div>
      <Link href="/play" className={PRIMARY_BUTTON}>
        Play
      </Link>
    </div>
  );
}

export function HistoryList({ history, more, onShowMore }: HistoryListProps) {
  const headingId = useId();
  const today = useToday();

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <h2 id={headingId} className={SECTION_HEADING}>
        History
      </h2>
      {history.length === 0 ? (
        <EmptyHistory />
      ) : (
        <>
          <ol
            aria-labelledby={headingId}
            className={`${PROFILE_PANEL} divide-y divide-line`}
          >
            {history.map((entry) => (
              <HistoryRow key={entry.id} entry={entry} today={today} />
            ))}
          </ol>
          <HistoryMore
            more={more}
            count={history.length}
            onShowMore={onShowMore}
          />
        </>
      )}
    </section>
  );
}
