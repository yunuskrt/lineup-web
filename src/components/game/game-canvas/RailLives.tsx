import React from 'react';
import DuelLivesCard from '@/components/game/DuelLivesCard';
import LivesCard from '@/components/game/LivesCard';
import type { CanvasView } from '@/types/canvas';

type Props = { view: CanvasView };

const RailLives = ({ view }: Props) => {
  if (view.mode === 'solo') return <LivesCard lives={view.lives} />;

  return (
    <DuelLivesCard
      you={view.you}
      opponent={view.opponent}
      turn={view.turn}
      opponentConnection={view.opponentConnection}
    />
  );
};

export default RailLives;
