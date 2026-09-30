'use client';

import { motion } from 'motion/react';
import { useChangedSinceMount } from '@/hooks/use-changed-since-mount';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { MOTION_SECONDS } from '@/styles/motion';

const PEAK_OPACITY = 0.25;

type LifeLostFlashProps = {
  flashKey: number;
};

export function LifeLostFlash({ flashKey }: LifeLostFlashProps) {
  const runs = useMotionPolicy();
  const hasFlashed = useChangedSinceMount(flashKey);

  if (!hasFlashed || !runs('lifeLostFlash')) return null;

  return (
    <motion.div
      key={flashKey}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 bg-danger"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, PEAK_OPACITY, 0] }}
      transition={{
        duration: MOTION_SECONDS.lifeLost,
        times: [0, 0.25, 1],
        ease: 'easeOut',
      }}
    />
  );
}
