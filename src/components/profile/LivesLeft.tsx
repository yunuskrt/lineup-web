import React from 'react';
import { SHIRT_PATH } from '@/components/game/shirt';
import { MAX_LIVES } from '@/lib/api/schemas/game';
import type { Lives } from '@/types/game';

const PIPS = Array.from({ length: MAX_LIVES }, (_, index) => index);

export function livesLeftLabel(lives: Lives): string {
  return `${lives} of ${MAX_LIVES} lives left`;
}

type Props = { lives: Lives };

// Static: a past game's lives never change
const LivesLeft = ({ lives }: Props) => {
  return (
    <span
      role="img"
      aria-label={livesLeftLabel(lives)}
      className="flex items-center gap-0.5"
    >
      {PIPS.map((index) => (
        <svg
          key={index}
          aria-hidden="true"
          viewBox="0 0 24 24"
          focusable="false"
          className="size-3.5"
        >
          <path
            d={SHIRT_PATH}
            strokeWidth={2}
            strokeLinejoin="round"
            className={
              index < lives ? 'fill-you stroke-line' : 'fill-rule stroke-none'
            }
          />
        </svg>
      ))}
    </span>
  );
};

export default LivesLeft;
