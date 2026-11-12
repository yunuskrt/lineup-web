import {
  ARCHIVE_PLAY_BUTTON,
  ARCHIVE_ROW,
  ARCHIVE_ROW_ACTIONS,
  ARCHIVE_ROW_FOOT,
} from '@/components/archive/styles';
import { ClubCrest } from '@/components/game/ClubCrest';
import { CompetitionLogo } from '@/components/game/CompetitionLogo';
import { archiveDateLabel, playMatchLabel } from '@/lib/archive';
import { matchEvent } from '@/lib/summary';
import type { MatchIdentity } from '@/types/match';

const ROW_ACTIONS = [
  { kind: 'play', verb: 'Play' },
  { kind: 'practice', verb: 'Practise' },
] as const;

type ArchiveRowProps = {
  match: MatchIdentity;
  // `practice` starts it with no clock (R14)
  onPlay: (match: MatchIdentity, practice: boolean) => void;
  // A guest is being made for this row's run
  starting?: 'play' | 'practice' | null;
  // Another row is starting
  isDisabled?: boolean;
};

// Phones drop the crests; one line from xl
export function ArchiveRow({
  match,
  onPlay,
  starting = null,
  isDisabled = false,
}: ArchiveRowProps) {
  const date = archiveDateLabel(match.date);
  const event = matchEvent(match);

  return (
    <li className={ARCHIVE_ROW}>
      <time
        dateTime={match.date}
        className="hidden text-14 leading-5 text-fg-muted tabular-nums xl:col-start-1 xl:row-start-1 xl:block"
      >
        {date}
      </time>
      <span className="col-start-1 row-start-1 flex min-w-0 items-center justify-end gap-2 xl:col-start-2">
        <span
          title={match.home.name}
          className="truncate text-14 leading-5 font-medium sm:text-16 sm:leading-6"
        >
          {match.home.name}
        </span>
        <span className="hidden sm:flex">
          <ClubCrest club={match.home} size="row" />
        </span>
      </span>
      <span className="col-start-2 row-start-1 flex items-baseline justify-center gap-1 font-display text-16 leading-6 font-semibold tabular-nums xl:col-start-3">
        <span>{match.score.home}</span>
        <span aria-hidden="true" className="text-fg-dim">
          –
        </span>
        <span className="sr-only">to</span>
        <span>{match.score.away}</span>
      </span>
      <span className="col-start-3 row-start-1 flex min-w-0 items-center gap-2 xl:col-start-4">
        <span className="hidden sm:flex">
          <ClubCrest club={match.away} size="row" />
        </span>
        <span
          title={match.away.name}
          className="truncate text-14 leading-5 font-medium sm:text-16 sm:leading-6"
        >
          {match.away.name}
        </span>
      </span>
      <div className={ARCHIVE_ROW_FOOT}>
        <span className="flex min-w-0 items-center gap-2 text-12 leading-4 text-fg-muted sm:flex-1 xl:col-start-5 xl:row-start-1 xl:flex-col xl:items-start xl:gap-0.5">
          <span className="shrink-0 tabular-nums xl:hidden">{date}</span>
          <span className="flex min-w-0 flex-1 items-center gap-1.5 sm:flex-initial xl:max-w-full">
            <CompetitionLogo
              competition={match.competition}
              className="size-4"
            />
            <span
              title={event}
              className="truncate xl:text-14 xl:leading-5 xl:text-fg"
            >
              {event}
            </span>
          </span>
          {match.nickname ? (
            <span
              title={match.nickname}
              className="min-w-0 truncate max-sm:hidden xl:max-w-full"
            >
              {match.nickname}
            </span>
          ) : null}
        </span>
        <div className={ARCHIVE_ROW_ACTIONS}>
          {ROW_ACTIONS.map(({ kind, verb }) => {
            const isWaiting = isDisabled || starting !== null;
            return (
              <button
                key={kind}
                type="button"
                aria-label={playMatchLabel(match, verb)}
                // Not `disabled`: that would drop keyboard focus
                aria-disabled={isWaiting || undefined}
                onClick={
                  isWaiting
                    ? undefined
                    : () => onPlay(match, kind === 'practice')
                }
                className={ARCHIVE_PLAY_BUTTON}
              >
                {starting === kind ? 'Starting…' : verb}
              </button>
            );
          })}
        </div>
      </div>
    </li>
  );
}
