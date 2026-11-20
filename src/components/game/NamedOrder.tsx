import React, { useId } from 'react';
import Row from '@/components/game/named-order/Row';
import { namedOrder, namedTotalsLabel } from '@/lib/summary';
import type { DuelNamedPlayer } from '@/types/duel';
import type { NamedPlayer } from '@/types/player';

export type NamedOrderProps =
  | { mode: 'solo'; found: NamedPlayer[]; missedCount: number }
  | { mode: 'duel'; found: DuelNamedPlayer[]; opponentHandle: string };

type Props = NamedOrderProps;

const EMPTY_COPY: Record<NamedOrderProps['mode'], string> = {
  solo: "You didn't name anyone this time.",
  duel: 'Nobody named a player.',
};

const NamedOrder = (props: Props) => {
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
};

export default NamedOrder;
