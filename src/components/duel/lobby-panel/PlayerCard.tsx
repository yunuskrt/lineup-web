import React from 'react';
import { User } from 'lucide-react';
import { DUEL_ACTOR_BG, ICON_TILE } from '@/styles/classes';
import type { DuelActor, DuelPlayer } from '@/types/duel';

type Props = {
  actor: DuelActor;
  player: DuelPlayer;
};

const PlayerCard = ({ actor, player }: Props) => {
  return (
    <div
      className={`flex min-w-0 flex-col items-center gap-2 rounded-lg border-2 border-line p-4 text-center text-on-accent shadow-hard ${DUEL_ACTOR_BG[actor]}`}
    >
      <span
        aria-hidden="true"
        className={`size-10 bg-surface-card ${ICON_TILE}`}
      >
        <User className="size-5" strokeWidth={2.25} />
      </span>
      <span className="w-full truncate text-16 font-semibold">
        {player.handle}
      </span>
      <span className="text-12">{actor === 'you' ? 'You' : 'Opponent'}</span>
    </div>
  );
};

export default PlayerCard;
