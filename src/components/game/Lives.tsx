'use client';

import { motion, type Variants } from 'motion/react';
import { useState } from 'react';
import { SHIRT_PATH } from '@/components/game/shirt';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { MAX_LIVES } from '@/lib/api/schemas/game';
import {
  DUEL_ACTOR_BORDER,
  LIFE_LOST_BORDER_SHIFT,
  LIFE_LOST_FILL_SHIFT,
} from '@/styles/classes';
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

const TILE =
  'flex size-9 items-center justify-center rounded-sm border lg:size-11';

type LivesProps = {
  lives: LivesCount;
  owner?: DuelActor;
  // Each pip in its own bordered tile
  isTiled?: boolean;
};

export function Lives({ lives, owner = 'you', isTiled = false }: LivesProps) {
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
      className={`flex items-center ${isTiled ? 'gap-2' : 'gap-1'}`}
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
            className={isTiled ? 'size-5 lg:size-6' : 'size-5'}
          >
            <path
              d={SHIRT_PATH}
              className={`${isFilled ? OWNER_FILL[owner] : 'fill-fg-dim'} ${
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
            {isTiled ? (
              <span
                className={`${TILE} ${
                  isFilled ? DUEL_ACTOR_BORDER[owner] : 'border-line'
                } ${fades ? LIFE_LOST_BORDER_SHIFT : ''}`}
              >
                {shirt}
              </span>
            ) : (
              shirt
            )}
          </motion.span>
        );
      })}
    </div>
  );
}
