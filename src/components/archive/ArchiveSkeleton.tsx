'use client';

import { motion } from 'motion/react';
import {
  ARCHIVE_LIST,
  ARCHIVE_ROW,
  ARCHIVE_ROW_ACTIONS,
  ARCHIVE_ROW_FOOT,
} from '@/components/archive/styles';
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
            className={`hidden h-5 w-20 xl:col-start-1 xl:block ${BLOCK}`}
          />
          <span
            className={`col-start-1 row-start-1 h-5 w-full max-w-40 justify-self-end sm:h-8 xl:col-start-2 ${BLOCK}`}
          />
          <span
            className={`col-start-2 row-start-1 h-6 w-9 justify-self-center xl:col-start-3 ${BLOCK}`}
          />
          <span
            className={`col-start-3 row-start-1 h-5 w-full max-w-40 sm:h-8 xl:col-start-4 ${BLOCK}`}
          />
          <div className={ARCHIVE_ROW_FOOT}>
            <span
              className={`h-4 w-full max-w-64 min-w-0 sm:flex-1 xl:col-start-5 xl:row-start-1 xl:h-5 xl:max-w-56 ${BLOCK}`}
            />
            <div className={ARCHIVE_ROW_ACTIONS}>
              <span className={`h-7.5 w-13 ${BLOCK}`} />
              <span className={`h-7.5 w-21 ${BLOCK}`} />
            </div>
          </div>
        </div>
      ))}
    </motion.div>
  );
}
