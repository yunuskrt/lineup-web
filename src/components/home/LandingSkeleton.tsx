'use client';

import { motion } from 'motion/react';
import React, { type ReactNode } from 'react';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { SKELETON_PULSE, SKELETON_PULSE_OPACITY } from '@/styles/motion';

type Props = { children: ReactNode };

// Flat blocks at the loaded size; opacity pulse only
const LandingSkeleton = ({ children }: Props) => {
  const runs = useMotionPolicy();
  const isPulsing = runs('skeletonPulse');

  return (
    <motion.div
      aria-hidden="true"
      initial={false}
      animate={{ opacity: isPulsing ? [...SKELETON_PULSE_OPACITY] : 1 }}
      transition={isPulsing ? SKELETON_PULSE : undefined}
    >
      {children}
    </motion.div>
  );
};

export default LandingSkeleton;
