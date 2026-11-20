'use client';

import React from 'react';
import { motion } from 'motion/react';
import { STATS_BOX } from '@/components/game/run-summary/styles';
import { OUTCOME_BOX } from '@/components/game/styles';
import { SKELETON } from '@/components/ui/skeleton';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { RAIL_SECTION } from '@/styles/classes';
import { SKELETON_PULSE, SKELETON_PULSE_OPACITY } from '@/styles/motion';

type Props = {};

const SummarySkeleton = ({}: Props) => {
  const runs = useMotionPolicy();
  const isPulsing = runs('skeletonPulse');

  return (
    <div className="flex flex-1 flex-col">
      <p role="status" className="sr-only">
        Loading your summary
      </p>
      <motion.div
        aria-hidden="true"
        className="flex flex-1 flex-col gap-4"
        initial={false}
        animate={{
          opacity: isPulsing ? [...SKELETON_PULSE_OPACITY] : 1,
        }}
        transition={isPulsing ? SKELETON_PULSE : undefined}
      >
        <div className={OUTCOME_BOX}>
          <div className="flex flex-col gap-2">
            <span className={`h-7 w-40 ${SKELETON}`} />
            <span className={`h-4 w-28 ${SKELETON}`} />
          </div>
          <span className={`h-6 w-18 ${SKELETON}`} />
        </div>
        <div className={STATS_BOX}>
          <span className={`my-auto h-10 w-24 ${SKELETON}`} />
          <span className={`my-auto h-10 w-24 ${SKELETON}`} />
        </div>
        <div className="flex flex-col gap-1">
          <span className={`h-5 w-28 ${SKELETON}`} />
          {[0, 1, 2].map((index) => (
            <span key={index} className={`my-1 h-8 ${SKELETON}`} />
          ))}
        </div>
        <div
          className={`flex flex-col gap-3 border-t-2 border-line pt-3 sm:pt-4 lg:mt-auto ${RAIL_SECTION}`}
        >
          <span className={`h-12 w-full ${SKELETON}`} />
          <span className={`h-12 w-full ${SKELETON}`} />
        </div>
      </motion.div>
    </div>
  );
};

export default SummarySkeleton;
