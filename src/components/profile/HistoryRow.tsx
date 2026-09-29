import { HISTORY_ROW, PROFILE_TAG } from '@/components/profile/styles';
import { LivesLeft, livesLeftLabel } from '@/components/profile/LivesLeft';
import { SQUAD_SIZE } from '@/lib/api/schemas/common';
import { historyOutcomeLabel, historyTone, playedAtLabel } from '@/lib/profile';
import { matchSubtitle, scoreline } from '@/lib/summary';
import type { HistoryEntry } from '@/types/profile';
import type { HistoryTone } from '@/types/profile-screen';

const TONE_TEXT: Record<HistoryTone, string> = {
  win: 'text-you',
  loss: 'text-danger',
  draw: 'text-fg',
  clear: 'text-found',
  neutral: 'text-fg-muted',
};

const MODE_LABELS: Record<HistoryEntry['mode'], string> = {
  solo: 'Solo',
  duel: 'Duel',
};

function Outcome({ entry }: { entry: HistoryEntry }) {
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
}

type HistoryRowProps = {
  entry: HistoryEntry;
  today: Date | null;
};

export function HistoryRow({ entry, today }: HistoryRowProps) {
  const subtitle = matchSubtitle(entry.match);

  return (
    <li className={HISTORY_ROW}>
      <div className="col-start-1 row-start-1 flex min-w-0 items-center gap-2 sm:contents">
        <span
          className={`sm:col-start-1 sm:row-start-1 sm:justify-self-start ${PROFILE_TAG}`}
        >
          {MODE_LABELS[entry.mode]}
        </span>
        <Outcome entry={entry} />
        <span className="truncate font-display text-16 leading-6 font-semibold tabular-nums sm:col-start-3 sm:row-start-1">
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
}
