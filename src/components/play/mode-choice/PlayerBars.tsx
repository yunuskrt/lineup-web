import React from 'react';
import { ACTOR_BAR, DUEL_ACTOR_BG } from '@/styles/classes';
import type { DuelActor } from '@/types/duel';

type Props = { players: DuelActor[] };

const PlayerBars = ({ players }: Props) => {
  return (
    <span aria-hidden="true" className="mt-auto flex gap-1.5">
      {players.map((player) => (
        <span
          key={player}
          className={`${ACTOR_BAR} ${DUEL_ACTOR_BG[player]}`}
        />
      ))}
    </span>
  );
};

export default PlayerBars;
