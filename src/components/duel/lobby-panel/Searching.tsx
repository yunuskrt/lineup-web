'use client';

import React from 'react';
import { Users } from 'lucide-react';
import { motion, type Transition } from 'motion/react';
import ActorBar from '@/components/duel/lobby-panel/ActorBar';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { ACTOR_BAR, ICON_TILE, SECONDARY_BUTTON } from '@/styles/classes';
import {
  MOTION_EASING,
  MOTION_SECONDS,
  SKELETON_PULSE_OPACITY,
} from '@/styles/motion';
import type { LobbyAction } from '@/types/duel-lobby';

const AMBIENT_PULSE: Transition = {
  duration: MOTION_SECONDS.skeletonPulse,
  ease: MOTION_EASING.skeletonPulse,
  repeat: Infinity,
};

type Props = { onAction: (action: LobbyAction) => void };

const Searching = ({ onAction }: Props) => {
  const runs = useMotionPolicy();
  const isPulsing = runs('lobbyPulse');

  return (
    <div className="flex flex-col items-center gap-5">
      <span
        aria-hidden="true"
        className={`size-12 bg-surface-card ${ICON_TILE}`}
      >
        <Users className="size-6" strokeWidth={2.25} />
      </span>
      {/* The opponent's mark waits, dim, to be filled */}
      <span aria-hidden="true" className="flex gap-1.5">
        <ActorBar actor="you" />
        <motion.span
          className={`${ACTOR_BAR} bg-fg-dim`}
          initial={false}
          animate={{
            opacity: isPulsing ? [...SKELETON_PULSE_OPACITY] : 1,
          }}
          transition={isPulsing ? AMBIENT_PULSE : undefined}
        />
      </span>
      <button
        type="button"
        className={`w-full ${SECONDARY_BUTTON}`}
        onClick={() => onAction('cancel')}
      >
        Cancel
      </button>
    </div>
  );
};

export default Searching;
