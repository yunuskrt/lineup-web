'use client';

import React from 'react';
import { motion } from 'motion/react';
import { SHIRT_PATH } from '@/components/game/shirt';
import {
  type MarkProps,
  STILL,
  staggered,
} from '@/components/home/rule-marks/marks';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { MAX_LIVES } from '@/lib/api/schemas/game';
import { LANDING_PIP_STAGGER_MS } from '@/styles/motion';

const PIPS = Array.from({ length: MAX_LIVES }, (_, index) => index);

type Props = MarkProps;

// The game's shirt pips, one by one
const PipsMark = ({ isShown, delayMs }: Props) => {
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
};

export default PipsMark;
