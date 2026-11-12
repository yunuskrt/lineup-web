'use client';

import { motion } from 'motion/react';
import { ARCHIVE_LIST, ARCHIVE_ROW } from '@/components/archive/styles';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { SKELETON_PULSE, SKELETON_PULSE_OPACITY } from '@/styles/motion';

const BLOCK = 'rounded-sm bg-skeleton-fill';
const ROWS = 8;

// The rows' own grid: nothing shifts on arrival
export function ArchiveSkeletonRows() {
  const runs = useMotionPolicy();
  const isPulsing = runs('skeletonPulse');

  return (
    <motion.div
      aria-hidden="true"
      className={`${ARCHIVE_LIST} divide-y divide-line`}
      initial={false}
      animate={{ opacity: isPulsing ? [...SKELETON_PULSE_OPACITY] : 1 }}
      transition={isPulsing ? SKELETON_PULSE : undefined}
    >
      {Array.from({ length: ROWS }, (_, index) => (
        <div key={index} className={ARCHIVE_ROW}>
          <span
            className={`hidden h-5 w-20 sm:col-start-1 sm:block ${BLOCK}`}
          />
          <span
            className={`col-start-1 row-start-1 h-5 w-full max-w-40 justify-self-end sm:h-8 sm:col-start-2 ${BLOCK}`}
          />
          <span
            className={`col-start-2 row-start-1 h-6 w-9 justify-self-center sm:col-start-3 ${BLOCK}`}
          />
          <span
            className={`col-start-3 row-start-1 h-5 w-full max-w-40 sm:col-start-4 sm:h-8 ${BLOCK}`}
          />
          <span
            className={`col-span-3 row-start-2 h-4 w-full max-w-56 sm:col-span-1 sm:col-start-5 sm:row-start-1 sm:h-5 ${BLOCK}`}
          />
        </div>
      ))}
    </motion.div>
  );
}
