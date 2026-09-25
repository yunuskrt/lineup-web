'use client';

import { motion, useReducedMotion, type Variants } from 'motion/react';
import { useState } from 'react';
import { MAX_LIVES } from '@/lib/api/schemas/game';
import { MOTION_DURATION_MS } from '@/styles/motion';
import type { DuelActor } from '@/types/duel';
import type { Lives as LivesCount } from '@/types/game';

const PIPS = Array.from({ length: MAX_LIVES }, (_, index) => index);

const OWNER_FILL: Record<DuelActor, string> = {
  you: 'fill-you',
  opponent: 'fill-opponent',
};

const SHIRT_PATH =
  'M8 3 4 5 1 9l3 2.5L6 10v11h12V10l2 1.5L23 9l-3-4-4-2c-.5 1.7-2.1 3-4 3S8.5 4.7 8 3Z';

const FILL_SHIFT = {
  transitionProperty: 'fill',
  transitionDuration: `${MOTION_DURATION_MS.lifeLost}ms`,
};

const SHAKE: Variants = {
  still: { x: 0 },
  shake: {
    x: [0, -4, 4, -3, 3, 0],
    transition: { duration: MOTION_DURATION_MS.lifeLost / 1000 },
  },
};

type Drop = { from: number; to: number };

type LivesProps = {
  lives: LivesCount;
  owner?: DuelActor;
};

export function Lives({ lives, owner = 'you' }: LivesProps) {
  const isReducedMotion = useReducedMotion();
  const [previousLives, setPreviousLives] = useState(lives);
  const [drop, setDrop] = useState<Drop | null>(null);

  if (lives !== previousLives) {
    setPreviousLives(lives);
    setDrop(lives < previousLives ? { from: previousLives, to: lives } : null);
  }

  return (
    <div
      role="img"
      aria-label={`${lives} of ${MAX_LIVES} lives left`}
      className="flex items-center gap-1"
    >
      {PIPS.map((index) => {
        const isFilled = index < lives;
        const isEmptying =
          drop !== null && index >= drop.to && index < drop.from;

        return (
          <motion.span
            key={index}
            aria-hidden="true"
            className="flex"
            variants={SHAKE}
            initial={false}
            animate={isEmptying && !isReducedMotion ? 'shake' : 'still'}
          >
            <svg viewBox="0 0 24 24" focusable="false" className="size-5">
              <path
                d={SHIRT_PATH}
                className={isFilled ? OWNER_FILL[owner] : 'fill-fg-dim'}
                style={isEmptying ? FILL_SHIFT : undefined}
              />
            </svg>
          </motion.span>
        );
      })}
    </div>
  );
}
