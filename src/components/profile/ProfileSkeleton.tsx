'use client';

import { motion, useReducedMotion } from 'motion/react';
import {
  HISTORY_ROW,
  PANEL_HEADER,
  PROFILE_PANEL,
  RECORD_BAR,
  STAT_ROW,
} from '@/components/profile/styles';
import { SKELETON_PULSE, SKELETON_PULSE_OPACITY } from '@/styles/motion';

const BLOCK = 'rounded-sm bg-skeleton-fill';
const STAT_ROWS = 5;
const HISTORY_ROWS = 3;

// Same classes as the loaded panels, so nothing shifts
export function ProfileSkeleton({ isGuest }: { isGuest: boolean }) {
  const isReducedMotion = useReducedMotion();

  return (
    <>
      <p role="status" className="sr-only">
        Loading your profile
      </p>
      <motion.div
        aria-hidden="true"
        className="flex flex-col gap-6"
        initial={false}
        animate={{
          opacity: isReducedMotion ? 1 : [...SKELETON_PULSE_OPACITY],
        }}
        transition={isReducedMotion ? undefined : SKELETON_PULSE}
      >
        <div className="flex h-10 items-center">
          <span className={`h-8 w-48 ${BLOCK}`} />
        </div>
        {isGuest ? (
          <div
            className={`${PROFILE_PANEL} flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6`}
          >
            <span className={`h-15 w-full max-w-2xl sm:h-10 ${BLOCK}`} />
            <span className={`h-8 w-full shrink-0 sm:w-36 ${BLOCK}`} />
          </div>
        ) : null}
        <div className="grid gap-6 lg:grid-cols-12">
          <div
            className={`${PROFILE_PANEL} flex flex-col gap-6 p-4 sm:p-6 lg:col-span-7`}
          >
            <div className={PANEL_HEADER}>
              <span className={`h-5 w-24 ${BLOCK}`} />
              <span className={`h-5 w-16 ${BLOCK}`} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[0, 1, 2].map((index) => (
                <div
                  key={index}
                  className="flex flex-col items-center gap-1 sm:items-start"
                >
                  <span className={`h-12 w-14 ${BLOCK}`} />
                  <span className={`h-4 w-10 ${BLOCK}`} />
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
                  <span className={`h-5 w-24 ${BLOCK}`} />
                  <span className={`h-7 w-12 ${BLOCK}`} />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <span className={`h-7 w-20 ${BLOCK}`} />
          <div className={`${PROFILE_PANEL} divide-y divide-line`}>
            {Array.from({ length: HISTORY_ROWS }, (_, index) => (
              <div key={index} className={HISTORY_ROW}>
                <span
                  className={`h-5 w-full max-w-56 sm:col-span-3 ${BLOCK}`}
                />
                <span className={`h-4 w-14 sm:hidden ${BLOCK}`} />
                <span
                  className={`h-5 w-full max-w-72 sm:col-start-4 sm:row-start-1 ${BLOCK}`}
                />
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </>
  );
}
