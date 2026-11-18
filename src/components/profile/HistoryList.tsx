'use client';

import Link from 'next/link';
import { useId, useRef } from 'react';
import { HistoryMore } from '@/components/profile/HistoryMore';
import { HistoryRow } from '@/components/profile/HistoryRow';
import { History } from 'lucide-react';
import { HISTORY_LIST } from '@/components/profile/styles';
import StateNotice from '@/components/shell/StateNotice';
import { useToday } from '@/hooks/use-today';
import { PRIMARY_BUTTON, TYPE_SECTION } from '@/styles/classes';
import type { HistoryEntry } from '@/types/profile';
import type { HistoryMoreState } from '@/types/profile-screen';

type HistoryListProps = {
  history: HistoryEntry[];
  more: HistoryMoreState;
  onShowMore: () => void;
};

function EmptyHistory() {
  return (
    <StateNotice
      tone="empty"
      icon={History}
      title="No games yet"
      titleLevel={3}
      message="Your solo runs and duels will be listed here."
    >
      <Link href="/play" className={PRIMARY_BUTTON}>
        Play
      </Link>
    </StateNotice>
  );
}

export function HistoryList({ history, more, onShowMore }: HistoryListProps) {
  const headingId = useId();
  const today = useToday();
  const listRef = useRef<HTMLOListElement>(null);

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4">
      <h2 id={headingId} className={TYPE_SECTION}>
        History
      </h2>
      {history.length === 0 ? (
        <EmptyHistory />
      ) : (
        <>
          <ol
            ref={listRef}
            aria-labelledby={headingId}
            className={HISTORY_LIST}
          >
            {history.map((entry) => (
              <HistoryRow key={entry.id} entry={entry} today={today} />
            ))}
          </ol>
          <HistoryMore
            more={more}
            count={history.length}
            onShowMore={onShowMore}
            listRef={listRef}
          />
        </>
      )}
    </section>
  );
}
