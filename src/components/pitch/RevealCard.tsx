'use client';

import { motion, type Transition } from 'motion/react';
import { useState } from 'react';
import { SquadSlot } from '@/components/pitch/SquadSlot';
import { useChangedSinceMount } from '@/hooks/use-changed-since-mount';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { MOTION_SECONDS, REVEAL_SPRING } from '@/styles/motion';
import type { DuelActor } from '@/types/duel';
import type { FoundPlayer, PositionGroup } from '@/types/player';

const START_SCALE = 0.85;

const FLASH_PEAK_OPACITY = 0.4;
const FLASH_FADE_SECONDS = 0.64;

const FLASH_TONES: Record<DuelActor, string> = {
  you: 'bg-reveal-flash-you',
  opponent: 'bg-reveal-flash-opponent',
};

const FLASH_FADE: Transition = {
  delay: MOTION_SECONDS.reveal,
  duration: FLASH_FADE_SECONDS,
  ease: 'easeOut',
};

const PULSE: Transition = {
  duration: MOTION_SECONDS.alreadyFoundPulse,
  ease: 'easeInOut',
};

type RevealCardProps = {
  player: FoundPlayer;
  position: PositionGroup;
  isNew: boolean;
  pulseKey?: number;
};

export function RevealCard({
  player,
  position,
  isNew,
  pulseKey,
}: RevealCardProps) {
  const runs = useMotionPolicy();
  // Only the mounting render decides if it animates
  const [isRevealing] = useState(isNew);
  const hasPulsed = useChangedSinceMount(pulseKey);
  const foundBy = player.foundBy ?? 'you';

  const pulse =
    pulseKey !== undefined && hasPulsed && runs('alreadyFoundPulse') ? (
      <motion.span
        key={pulseKey}
        aria-hidden="true"
        className="absolute inset-0 rounded-sm border-2 border-already-found-pulse bg-already-found-pulse/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={PULSE}
      />
    ) : null;

  const flash =
    isRevealing && runs('revealFlash') ? (
      <motion.span
        aria-hidden="true"
        className={`absolute inset-0 ${FLASH_TONES[foundBy]}`}
        initial={{ opacity: FLASH_PEAK_OPACITY }}
        animate={{ opacity: 0 }}
        transition={FLASH_FADE}
      />
    ) : null;

  return (
    <motion.div
      initial={
        isRevealing
          ? { opacity: 0, scale: runs('revealSpring') ? START_SCALE : 1 }
          : false
      }
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        scale: runs('revealSpring') ? REVEAL_SPRING : { duration: 0 },
        opacity: { duration: MOTION_SECONDS.reveal, ease: 'easeOut' },
      }}
    >
      <SquadSlot
        state="filled"
        position={position}
        name={player.name}
        foundBy={player.foundBy}
        backdrop={
          <>
            {flash}
            {pulse}
          </>
        }
      />
    </motion.div>
  );
}
