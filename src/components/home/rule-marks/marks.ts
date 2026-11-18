import type { Transition } from 'motion/react';
import { MOTION_SECONDS } from '@/styles/motion';

export const STILL: Transition = { duration: 0 };

export type MarkProps = {
  // The column has entered; play once
  isShown: boolean;
  delayMs: number;
};

export function staggered(
  delayMs: number,
  index: number,
  gapMs: number,
): Transition {
  return {
    duration: MOTION_SECONDS.landingRise,
    delay: (delayMs + index * gapMs) / 1000,
    ease: 'easeOut',
  };
}
