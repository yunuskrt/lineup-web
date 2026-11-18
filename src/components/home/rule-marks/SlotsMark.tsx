'use client';

import React from 'react';
import { motion } from 'motion/react';
import {
  type MarkProps,
  STILL,
  staggered,
} from '@/components/home/rule-marks/marks';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { slotLayout } from '@/lib/formation';
import { LANDING_SLOT_STAGGER_MS } from '@/styles/motion';

const MARK_FORMATION = '4-3-3';
const SLOTS = slotLayout(MARK_FORMATION) ?? [];

// The keeper sits 16 units below the back line
const SLOT_RADIUS = 5.5;

type Props = MarkProps;

// Eleven unrevealed slots, as the pitch draws them
const SlotsMark = ({ isShown, delayMs }: Props) => {
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
          className="fill-none stroke-line"
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
};

export default SlotsMark;
