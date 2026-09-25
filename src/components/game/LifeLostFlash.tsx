'use client';

import { motion } from 'motion/react';
import { useState } from 'react';
import { MOTION_DURATION_MS } from '@/styles/motion';

const PEAK_OPACITY = 0.25;

type LifeLostFlashProps = {
  flashKey: number;
};

export function LifeLostFlash({ flashKey }: LifeLostFlashProps) {
  const [initialKey] = useState(flashKey);

  if (flashKey === initialKey) return null;

  return (
    <motion.div
      key={flashKey}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 bg-danger"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, PEAK_OPACITY, 0] }}
      transition={{
        duration: MOTION_DURATION_MS.lifeLost / 1000,
        times: [0, 0.25, 1],
        ease: 'easeOut',
      }}
    />
  );
}
