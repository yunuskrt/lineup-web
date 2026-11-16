'use client';

import { motion } from 'motion/react';
import {
  HISTORY_ROW,
  PANEL_HEADER,
  PROFILE_FIGURES,
  PROFILE_PANEL,
  RECORD_BAR,
  STAT_ROW,
} from '@/components/profile/styles';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { cn } from '@/lib/utils';
import { BOARD, BOARD_SECTION } from '@/styles/classes';
import { SKELETON_PULSE, SKELETON_PULSE_OPACITY } from '@/styles/motion';
import { SKELETON } from '@/components/ui/skeleton';

const STAT_ROWS = 5;
const HISTORY_ROWS = 3;

// Same classes as the loaded panels, so nothing shifts
export function ProfileSkeleton({ isGuest }: { isGuest: boolean }) {
  const runs = useMotionPolicy();
  const isPulsing = runs('skeletonPulse');

  return (
    <>
      <p role="status" className="sr-only">
        Loading your profile
      </p>
      <motion.div
        aria-hidden="true"
        className={BOARD}
        initial={false}
        animate={{
          opacity: isPulsing ? [...SKELETON_PULSE_OPACITY] : 1,
        }}
        transition={isPulsing ? SKELETON_PULSE : undefined}
      >
        <div className={BOARD_SECTION}>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:gap-4">
            <span className={cn(SKELETON, 'size-12 shrink-0 rounded-full')} />
            <div className="flex items-center gap-3">
              <span
                className={`h-7.5 w-40 sm:h-9.5 sm:w-48 md:h-12.5 ${SKELETON}`}
              />
              {isGuest ? <span className={`h-7.5 w-18 ${SKELETON}`} /> : null}
            </div>
          </div>
          {isGuest ? (
            // The prompt's height at 320, sm and md
            <span
              className={cn(
                SKELETON,
                'h-44.5 w-full rounded-md sm:h-22.75 md:h-17.5',
              )}
            />
          ) : null}
        </div>
        <div className={PROFILE_FIGURES}>
          <div
            className={`${PROFILE_PANEL} flex flex-col gap-6 p-4 sm:p-6 lg:col-span-7`}
          >
            <div className={PANEL_HEADER}>
              <span className={`h-5 w-24 ${SKELETON}`} />
              <span className={`h-5 w-16 ${SKELETON}`} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="flex flex-col items-center gap-1 sm:items-start"
                >
                  <span className={`h-12 w-14 ${SKELETON}`} />
                  <span className={`h-4 w-10 ${SKELETON}`} />
                </div>
              ))}
            </div>
            <div className={`mt-auto ${RECORD_BAR}`} />
          </div>
          <div
            className={`${PROFILE_PANEL} px-4 py-1 sm:px-6 sm:py-3 lg:col-span-5`}
          >
            <div className="sm:grid sm:grid-cols-2 sm:gap-x-6 lg:block">
              {Array.from({ length: STAT_ROWS }, (_, index) => (
                <div
                  key={index}
                  className={`${STAT_ROW} items-center ${
                    index === STAT_ROWS - 1 ? 'sm:col-span-2' : ''
                  }`}
                >
                  <span className={`h-5 w-24 ${SKELETON}`} />
                  <span className={`h-7 w-12 ${SKELETON}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className={BOARD_SECTION}>
          <span className={`h-7 w-20 ${SKELETON}`} />
          <div className={`${PROFILE_PANEL} divide-y divide-line`}>
            {Array.from({ length: HISTORY_ROWS }, (_, index) => (
              <div key={index} className={HISTORY_ROW}>
                <span
                  className={`h-5 w-full max-w-56 sm:col-span-3 ${SKELETON}`}
                />
                <span className={`h-4 w-14 sm:hidden ${SKELETON}`} />
                <span
                  className={`h-5 w-full max-w-72 sm:col-start-4 sm:row-start-1 ${SKELETON}`}
                />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
}
