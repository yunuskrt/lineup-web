'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { SKELETON_PULSE, SKELETON_PULSE_OPACITY } from '@/styles/motion';

export const SKELETON_BLOCK = 'rounded-sm bg-skeleton-fill';

// Flat blocks at the loaded size; opacity pulse only
export function LandingSkeleton({ children }: { children: ReactNode }) {
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
}
