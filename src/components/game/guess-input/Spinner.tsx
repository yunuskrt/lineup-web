'use client';

import React from 'react';
import { motion } from 'motion/react';

const SPIN_SECONDS = 0.8;

type Props = { isSpinning: boolean };

// Static when spinning is off, so the busy cue stays
const Spinner = ({ isSpinning }: Props) => {
  return (
    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
      <motion.svg
        viewBox="0 0 16 16"
        aria-hidden="true"
        focusable="false"
        className="size-4"
        animate={isSpinning ? { rotate: 360 } : undefined}
        transition={{
          duration: SPIN_SECONDS,
          ease: 'linear',
          repeat: Infinity,
        }}
      >
        <circle
          cx="8"
          cy="8"
          r="6"
          fill="none"
          strokeWidth="2"
          className="stroke-rule"
        />
        <path
          d="M8 2a6 6 0 0 1 6 6"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          className="stroke-line"
        />
      </motion.svg>
      <span className="sr-only">Checking</span>
    </span>
  );
};

export default Spinner;
