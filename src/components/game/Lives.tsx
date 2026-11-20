'use client';

import React, { useState } from 'react';
import { motion, type Variants } from 'motion/react';
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

// A lost life is the shirt's dashed outline
const LOST_DASH = '2.5 2';

type Props = {
  lives: LivesCount;
  owner?: DuelActor;
  // The rail's larger shirts
  isLarge?: boolean;
};

const Lives = ({ lives, owner = 'you', isLarge = false }: Props) => {
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
      className={`flex items-center ${isLarge ? 'gap-1.5 max-[359px]:gap-1' : 'gap-1'}`}
    >
      {PIPS.map((index) => {
        const isFilled = index < lives;
        const isEmptying =
          drop !== null && index >= drop.to && index < drop.from;
        const fades = isEmptying && runs('lifeFill');
        const shirt = (
          <svg
            viewBox="0 0 24 24"
            focusable="false"
            className={
              isLarge ? 'size-7 max-[359px]:size-5 lg:size-8' : 'size-5'
            }
          >
            {/* Ink outline: the pastels alone are under 3:1 */}
            <path
              d={SHIRT_PATH}
              strokeWidth={1.5}
              strokeLinejoin="round"
              strokeDasharray={isFilled ? undefined : LOST_DASH}
              className={`${isFilled ? `${OWNER_FILL[owner]} stroke-line` : 'fill-transparent stroke-fg-dim'} ${
                fades ? LIFE_LOST_FILL_SHIFT : ''
              }`}
            />
          </svg>
        );

        return (
          <motion.span
            key={index}
            aria-hidden="true"
            className="flex"
            variants={SHAKE}
            initial={false}
            animate={isEmptying && runs('lifeShake') ? 'shake' : 'still'}
          >
            {shirt}
          </motion.span>
        );
      })}
    </div>
  );
};

export default Lives;
