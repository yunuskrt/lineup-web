'use client';

import React, { useId, useRef } from 'react';
import EmptyHistory from '@/components/profile/history-list/EmptyHistory';
import HistoryMore from '@/components/profile/HistoryMore';
import HistoryRow from '@/components/profile/HistoryRow';
import { HISTORY_LIST } from '@/components/profile/styles';
import { useToday } from '@/hooks/use-today';
import { TYPE_SECTION } from '@/styles/classes';
import type { HistoryEntry } from '@/types/profile';
import type { HistoryMoreState } from '@/types/profile-screen';

type Props = {
  history: HistoryEntry[];
  more: HistoryMoreState;
  onShowMore: () => void;
};

const HistoryList = ({ history, more, onShowMore }: Props) => {
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
};

export default HistoryList;
