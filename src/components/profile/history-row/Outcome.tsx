import React from 'react';
import { historyOutcomeLabel, historyTone } from '@/lib/profile';
import type { HistoryEntry } from '@/types/profile';
import type { HistoryTone } from '@/types/profile-screen';

const TONE_TEXT: Record<HistoryTone, string> = {
  win: 'text-you-text',
  loss: 'text-danger-text',
  draw: 'text-fg',
  clear: 'text-found-text',
  neutral: 'text-fg-muted',
};

type Props = { entry: HistoryEntry };

const Outcome = ({ entry }: Props) => {
  const tone = historyTone(entry);

  return (
    <span
      className={`flex shrink-0 items-center gap-1.5 text-14 leading-5 font-semibold whitespace-nowrap sm:col-start-2 sm:row-start-1 ${TONE_TEXT[tone]}`}
    >
      {tone === 'draw' ? (
        <span
          aria-hidden="true"
          className="flex h-3 overflow-hidden rounded-sm"
        >
          <span className="w-1 bg-you" />
          <span className="w-1 bg-opponent" />
        </span>
      ) : null}
      {historyOutcomeLabel(entry)}
    </span>
  );
};

export default Outcome;
