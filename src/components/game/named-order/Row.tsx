import React from 'react';
import { CircleCheck } from 'lucide-react';
import PlayerHeadshot from '@/components/pitch/PlayerHeadshot';
import { findTimeLabel } from '@/lib/summary';
import { DUEL_ACTOR_BG, DUEL_ACTOR_TEXT } from '@/styles/classes';
import type { DuelNamedPlayer } from '@/types/duel';
import type { NamedPlayer } from '@/types/player';

// Table rows on the rail pane, as game/15-results-a
const ROW =
  'relative flex h-10 shrink-0 items-center gap-2 border-b-2 border-rule pr-1 last:border-b-0';

type Props = {
  player: NamedPlayer | DuelNamedPlayer;
  finder: string | null;
  isFastest: boolean;
};

const Row = ({ player, finder, isFastest }: Props) => {
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
};

export default Row;
