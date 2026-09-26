'use client';

import { motion, type Transition, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { SquadSlot } from '@/components/pitch/SquadSlot';
import { MOTION_DURATION_MS, REVEAL_TRANSITION_TYPE } from '@/styles/motion';
import type { DuelActor } from '@/types/duel';
import type { FoundPlayer, PositionGroup } from '@/types/player';

const REVEAL_SECONDS = MOTION_DURATION_MS.reveal / 1000;
const START_SCALE = 0.85;

const FLASH_PEAK_OPACITY = 0.4;
const FLASH_FADE_SECONDS = 0.64;

const FLASH_TONES: Record<DuelActor, string> = {
  you: 'bg-reveal-flash-you',
  opponent: 'bg-reveal-flash-opponent',
};

const SPRING: Transition = {
  type: REVEAL_TRANSITION_TYPE,
  visualDuration: REVEAL_SECONDS,
  bounce: 0.25,
};

const FLASH_FADE: Transition = {
  delay: REVEAL_SECONDS,
  duration: FLASH_FADE_SECONDS,
  ease: 'easeOut',
};

const PULSE: Transition = {
  duration: MOTION_DURATION_MS.alreadyFoundPulse / 1000,
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
  const isReducedMotion = useReducedMotion();
  // Only the mounting render decides if it animates
  const [isRevealing] = useState(isNew);
  const [initialPulseKey] = useState(pulseKey);
  const foundBy = player.foundBy ?? 'you';

  const pulse =
    pulseKey !== undefined && pulseKey !== initialPulseKey ? (
      <motion.span
        key={pulseKey}
        aria-hidden="true"
        className="absolute inset-0 rounded-sm border-2 border-already-found-pulse bg-already-found-pulse/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 1, 0] }}
        transition={PULSE}
      />
    ) : null;

  const flash = isRevealing ? (
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
      initial={isRevealing ? { opacity: 0, scale: START_SCALE } : false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        scale: isReducedMotion ? { duration: 0 } : SPRING,
        opacity: { duration: REVEAL_SECONDS, ease: 'easeOut' },
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
