'use client';

import { motion, type Transition } from 'motion/react';
import { SHIRT_PATH } from '@/components/game/shirt';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { MAX_LIVES } from '@/lib/api/schemas/game';
import { slotLayout } from '@/lib/formation';
import {
  LANDING_PIP_STAGGER_MS,
  LANDING_SLOT_STAGGER_MS,
  MOTION_EASING,
  MOTION_SECONDS,
} from '@/styles/motion';

const MARK_FORMATION = '4-3-3';
const SLOTS = slotLayout(MARK_FORMATION) ?? [];
const PIPS = Array.from({ length: MAX_LIVES }, (_, index) => index);

// The keeper sits 16 units below the back line
const SLOT_RADIUS = 5.5;

const ARC_RADIUS = 40;
// About ten seconds of fifteen left
const ARC_SWEEP = 2 / 3;

const STILL: Transition = { duration: 0 };

export type MarkProps = {
  // The column has entered; play once
  isShown: boolean;
  delayMs: number;
};

function staggered(delayMs: number, index: number, gapMs: number): Transition {
  return {
    duration: MOTION_SECONDS.landingRise,
    delay: (delayMs + index * gapMs) / 1000,
    ease: 'easeOut',
  };
}

// Eleven unrevealed slots, as the pitch draws them
export function SlotsMark({ isShown, delayMs }: MarkProps) {
  const animates = useMotionPolicy()('landingEntrance');

  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
      className="size-12"
    >
      {SLOTS.map((point, index) => (
        <motion.circle
          key={point.slot}
          cx={point.x}
          cy={point.y}
          r={SLOT_RADIUS}
          strokeWidth={2.5}
          className="fill-none stroke-marking"
          initial={animates ? { opacity: 0 } : false}
          animate={{ opacity: !animates || isShown ? 1 : 0 }}
          transition={
            animates
              ? staggered(delayMs, index, LANDING_SLOT_STAGGER_MS)
              : STILL
          }
        />
      ))}
    </svg>
  );
}

// The clock's mark: linear, as the real ring is
export function ArcMark({ isShown, delayMs }: MarkProps) {
  const animates = useMotionPolicy()('landingEntrance');
  const sweep = !animates || isShown ? ARC_SWEEP : 0;

  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
      className="size-12 -rotate-90"
    >
      <circle
        cx="50"
        cy="50"
        r={ARC_RADIUS}
        strokeWidth={8}
        className="fill-none stroke-line"
      />
      <motion.circle
        cx="50"
        cy="50"
        r={ARC_RADIUS}
        strokeWidth={8}
        className="fill-none stroke-fg"
        initial={animates ? { pathLength: 0 } : false}
        animate={{ pathLength: sweep }}
        transition={
          animates
            ? {
                duration: MOTION_SECONDS.landingArcDraw,
                delay: delayMs / 1000,
                ease: MOTION_EASING.ringSweep,
              }
            : STILL
        }
      />
    </svg>
  );
}

// The game's shirt pips, one by one
export function PipsMark({ isShown, delayMs }: MarkProps) {
  const animates = useMotionPolicy()('landingEntrance');

  return (
    <span aria-hidden="true" className="flex items-center gap-1">
      {PIPS.map((index) => (
        <motion.svg
          key={index}
          viewBox="0 0 24 24"
          focusable="false"
          className="size-8"
          initial={animates ? { opacity: 0 } : false}
          animate={{ opacity: !animates || isShown ? 1 : 0 }}
          transition={
            animates ? staggered(delayMs, index, LANDING_PIP_STAGGER_MS) : STILL
          }
        >
          <path d={SHIRT_PATH} className="fill-you" />
        </motion.svg>
      ))}
    </span>
  );
}
