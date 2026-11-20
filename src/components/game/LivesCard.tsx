import React from 'react';
import CardFrame from '@/components/game/CardFrame';
import Tally from '@/components/game/Tally';
import type { Lives as LivesCount } from '@/types/game';

const SOLO_HINT = 'Clock at 0 costs a life. The run ends at 0 lives.';

type Props = { lives: LivesCount };

const LivesCard = ({ lives }: Props) => {
  return (
    <CardFrame hint={SOLO_HINT}>
      <Tally lives={lives} />
    </CardFrame>
  );
};

export default LivesCard;
