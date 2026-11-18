'use client';

import React from 'react';
import { motion } from 'motion/react';
import { type MarkProps, STILL } from '@/components/home/rule-marks/marks';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { MOTION_EASING, MOTION_SECONDS } from '@/styles/motion';

const ARC_RADIUS = 40;
// About ten seconds of fifteen left
const ARC_SWEEP = 2 / 3;

type Props = MarkProps;

// The clock's mark: linear, as the real ring is
const ArcMark = ({ isShown, delayMs }: Props) => {
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
        className="fill-none stroke-rule"
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
};

export default ArcMark;
