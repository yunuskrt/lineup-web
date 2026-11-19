import React from 'react';
import ModeTag from '@/components/profile/history-row/ModeTag';
import Outcome from '@/components/profile/history-row/Outcome';
import { HISTORY_ROW } from '@/components/profile/styles';
import LivesLeft, { livesLeftLabel } from '@/components/profile/LivesLeft';
import { SQUAD_SIZE } from '@/lib/api/schemas/common';
import { playedAtLabel } from '@/lib/profile';
import { matchSubtitle, scoreline } from '@/lib/summary';
import type { HistoryEntry } from '@/types/profile';

type Props = {
  entry: HistoryEntry;
  today: Date | null;
};

const HistoryRow = ({ entry, today }: Props) => {
  const subtitle = matchSubtitle(entry.match);

  return (
    // Focusable only from script: the last Show more
    <li tabIndex={-1} className={HISTORY_ROW}>
      <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-2 sm:contents">
        <ModeTag entry={entry} />
        <Outcome entry={entry} />
        <span className="truncate font-display text-14 leading-6 font-semibold tabular-nums sm:col-start-3 sm:row-start-1 sm:text-16">
          {scoreline(entry.match, 'shortName')}
        </span>
      </div>
      <span
        title={subtitle}
        className="col-start-1 row-start-2 truncate text-14 leading-5 text-fg-muted sm:col-start-4 sm:row-start-1"
      >
        {subtitle}
      </span>
      <span className="col-start-2 row-start-2 text-right text-14 leading-5 font-medium whitespace-nowrap tabular-nums sm:col-start-5 sm:row-start-1">
        {entry.foundCount} of {SQUAD_SIZE}
      </span>
      <span className="hidden lg:col-start-6 lg:row-start-1 lg:flex lg:justify-center">
        <LivesLeft lives={entry.livesRemaining} />
      </span>
      <span
        // The pips show from lg; the count is always read
        className="sr-only lg:hidden"
      >
        {livesLeftLabel(entry.livesRemaining)}
      </span>
      <span className="col-start-2 row-start-1 text-right text-12 leading-4 whitespace-nowrap text-fg-muted sm:col-start-6 sm:text-14 sm:leading-5 lg:col-start-7">
        {today ? playedAtLabel(entry.playedAt, today) : null}
      </span>
    </li>
  );
};

export default HistoryRow;
