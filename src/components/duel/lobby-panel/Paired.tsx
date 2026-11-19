import React from 'react';
import PlayerCard from '@/components/duel/lobby-panel/PlayerCard';
import { Badge } from '@/components/ui/badge';
import type { DuelPlayer } from '@/types/duel';

type Props = { you: DuelPlayer; opponent: DuelPlayer };

// Reading order on phones too: you, vs, opponent
const Paired = ({ you, opponent }: Props) => {
  return (
    <div className="flex flex-col items-stretch gap-3 sm:grid sm:grid-cols-[1fr_auto_1fr] sm:items-center">
      <PlayerCard actor="you" player={you} />
      <span className="flex justify-center">
        <span className="sr-only">vs</span>
        <Badge
          aria-hidden="true"
          variant="sticker"
          tone="butter"
          className="px-3 py-1 text-20"
        >
          VS
        </Badge>
      </span>
      <PlayerCard actor="opponent" player={opponent} />
    </div>
  );
};

export default Paired;
