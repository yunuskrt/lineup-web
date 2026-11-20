import React from 'react';
import Lives from '@/components/game/Lives';
import { TYPE_NUMBER } from '@/styles/classes';
import type { DuelActor } from '@/types/duel';
import type { Lives as LivesCount } from '@/types/game';

type Props = {
  lives: LivesCount;
  owner?: DuelActor;
};

// The count beside the shirts; under 360px, shirts alone
const Tally = ({ lives, owner }: Props) => {
  return (
    <div className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className={`text-30 leading-none max-[359px]:hidden lg:text-40 ${TYPE_NUMBER}`}
      >
        {lives}
      </span>
      <Lives lives={lives} owner={owner} isLarge />
    </div>
  );
};

export default Tally;
