import { CircleCheck } from 'lucide-react';
import { useId } from 'react';
import { PlayerHeadshot } from '@/components/pitch/PlayerHeadshot';
import { findTimeLabel, namedOrder, namedTotalsLabel } from '@/lib/summary';
import { DUEL_ACTOR_BG, DUEL_ACTOR_TEXT } from '@/styles/classes';
import type { DuelNamedPlayer } from '@/types/duel';
import type { NamedPlayer } from '@/types/player';

// Table rows on the rail pane, as game/15-results-a
const ROW =
  'relative flex h-10 shrink-0 items-center gap-2 border-b-2 border-rule pr-1 last:border-b-0';

export type NamedOrderProps =
  | { mode: 'solo'; found: NamedPlayer[]; missedCount: number }
  | { mode: 'duel'; found: DuelNamedPlayer[]; opponentHandle: string };

const EMPTY_COPY: Record<NamedOrderProps['mode'], string> = {
  solo: "You didn't name anyone this time.",
  duel: 'Nobody named a player.',
};

type RowProps = {
  player: NamedPlayer | DuelNamedPlayer;
  finder: string | null;
  isFastest: boolean;
};

function Row({ player, finder, isFastest }: RowProps) {
  const actor = 'foundBy' in player ? player.foundBy : null;

  return (
    <li className={`${ROW} ${actor ? 'pl-3' : 'pl-1'}`}>
      {/* The finder's colour, beside the label */}
      {actor ? (
        <span
          aria-hidden="true"
          className={`absolute inset-y-1 left-0 w-1 rounded-full ${DUEL_ACTOR_BG[actor]}`}
        />
      ) : null}
      <span className="w-5 shrink-0 text-12 leading-4 text-fg-muted tabular-nums">
        {player.order}
      </span>
      <PlayerHeadshot
        name={player.name}
        imageUrl={player.imageUrl}
        sizeClass="size-6"
      />
      <span className="min-w-0 flex-1 truncate text-14 leading-5 font-medium text-fg">
        {player.name}
      </span>
      {actor && finder ? (
        <span
          className={`max-w-24 shrink-0 truncate text-12 leading-4 font-semibold ${DUEL_ACTOR_TEXT[actor]}`}
        >
          {finder}
        </span>
      ) : null}
      <span
        className={`shrink-0 text-14 leading-5 tabular-nums ${
          isFastest ? 'font-semibold text-fg' : 'text-fg-muted'
        }`}
      >
        {findTimeLabel(player.elapsedMs)}
        {isFastest ? <span className="sr-only">, fastest</span> : null}
      </span>
      <CircleCheck
        aria-hidden="true"
        strokeWidth={2.5}
        className="size-4 shrink-0 text-found-text"
      />
    </li>
  );
}

export function NamedOrder(props: NamedOrderProps) {
  const headingId = useId();
  const { rows, fastestIndex } = namedOrder<NamedPlayer | DuelNamedPlayer>(
    props.found,
  );
  // Times across two players aren't a contest
  const markedIndex = props.mode === 'solo' ? fastestIndex : null;

  function finderOf(player: NamedPlayer | DuelNamedPlayer): string | null {
    if (props.mode === 'solo' || !('foundBy' in player)) return null;
    return player.foundBy === 'you' ? 'You' : props.opponentHandle;
  }

  return (
    // From lg the list takes what the rail has left
    <div className="flex flex-col gap-1 lg:min-h-0 lg:flex-1">
      <h3 id={headingId} className="text-14 leading-5 font-medium text-fg">
        Named in order
      </h3>
      {rows.length > 0 ? (
        <ol
          aria-labelledby={headingId}
          className="flex flex-col lg:min-h-0 lg:overflow-y-auto"
        >
          {rows.map((player, index) => (
            <Row
              key={player.id}
              player={player}
              finder={finderOf(player)}
              isFastest={index === markedIndex}
            />
          ))}
        </ol>
      ) : (
        <p className="text-14 leading-5 text-fg-muted">
          {EMPTY_COPY[props.mode]}
        </p>
      )}
      {props.mode === 'solo' ? (
        <p className="flex h-10 shrink-0 items-center justify-between gap-2 border-t-2 border-line px-1 text-14 leading-5 font-semibold text-fg">
          <span>Total</span>
          <span>{namedTotalsLabel(rows.length, props.missedCount)}</span>
        </p>
      ) : null}
    </div>
  );
}
