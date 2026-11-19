'use client';

import React from 'react';
import { motion, type Transition } from 'motion/react';
import { INSTANT } from '@/components/pitch/squad-grid/shared';
import RevealCard from '@/components/pitch/RevealCard';
import SquadSlot from '@/components/pitch/SquadSlot';
import { MISSED_REVEAL_STAGGER_MS, MOTION_SECONDS } from '@/styles/motion';
import type {
  FoundPlayer,
  PositionGroup,
  RevealedPlayer,
} from '@/types/player';

// One by one, in squad order, as the player reveals
function missedEntrance(rank: number): Transition {
  return {
    duration: MOTION_SECONDS.missedReveal,
    ease: 'easeOut',
    delay: (rank * MISSED_REVEAL_STAGGER_MS) / 1000,
  };
}

type Props = {
  position: PositionGroup;
  player: FoundPlayer | undefined;
  missedPlayer: RevealedPlayer | undefined;
  // Null when the reveal doesn't animate
  missedRank: number | null;
  isLoading: boolean;
  isNew: boolean;
  pulseKey: number | undefined;
};

const GridSlot = ({
  position,
  player,
  missedPlayer,
  missedRank,
  isLoading,
  isNew,
  pulseKey,
}: Props) => {
  if (isLoading) return <SquadSlot state="loading" position={position} />;
  if (!player && missedPlayer) {
    return (
      <motion.div
        initial={missedRank === null ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={missedRank === null ? INSTANT : missedEntrance(missedRank)}
      >
        <SquadSlot
          state="missed"
          position={position}
          name={missedPlayer.name}
          imageUrl={missedPlayer.imageUrl}
        />
      </motion.div>
    );
  }
  if (!player) return <SquadSlot state="empty" position={position} />;

  return (
    <RevealCard
      player={player}
      position={position}
      isNew={isNew}
      pulseKey={pulseKey}
    />
  );
};

export default GridSlot;
