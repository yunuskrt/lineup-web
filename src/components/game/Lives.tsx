'use client';

import { motion, type Variants } from 'motion/react';
import { useState } from 'react';
import { SHIRT_PATH } from '@/components/game/shirt';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { MAX_LIVES } from '@/lib/api/schemas/game';
import { LIFE_LOST_FILL_SHIFT } from '@/styles/classes';
import { MOTION_SECONDS } from '@/styles/motion';
import type { DuelActor } from '@/types/duel';
import type { Lives as LivesCount } from '@/types/game';

const PIPS = Array.from({ length: MAX_LIVES }, (_, index) => index);

const OWNER_FILL: Record<DuelActor, string> = {
  you: 'fill-you',
  opponent: 'fill-opponent',
};

const SHAKE: Variants = {
  still: { x: 0 },
  shake: {
    x: [0, -4, 4, -3, 3, 0],
    transition: { duration: MOTION_SECONDS.lifeLost },
  },
};

type Drop = { from: number; to: number };

type LivesProps = {
  lives: LivesCount;
  owner?: DuelActor;
};

export function Lives({ lives, owner = 'you' }: LivesProps) {
  const runs = useMotionPolicy();
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
            animate={isEmptying && runs('lifeShake') ? 'shake' : 'still'}
          >
            <svg viewBox="0 0 24 24" focusable="false" className="size-5">
              <path
                d={SHIRT_PATH}
                className={`${isFilled ? OWNER_FILL[owner] : 'fill-fg-dim'} ${
                  isEmptying && runs('lifeFill') ? LIFE_LOST_FILL_SHIFT : ''
                }`}
              />
            </svg>
          </motion.span>
        );
      })}
    </div>
  );
}
