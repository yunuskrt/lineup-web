import type { TargetAndTransition } from 'motion/react';
import {
  LANDING_RISE_PX,
  LANDING_STAGGER_MS,
  MOTION_SECONDS,
} from '@/styles/motion';

export type EntranceItemProps = {
  initial: TargetAndTransition | false;
  animate: TargetAndTransition;
  transition: TargetAndTransition['transition'];
};

export type EntranceItemOptions = {
  staggerMs?: number;
  // Crests grow in; everything else rises
  fromScale?: number;
  delayMs?: number;
};

type EntranceState = { animates: boolean; isInView: boolean };

export const ENTRANCE_SHOWN: TargetAndTransition = {
  opacity: 1,
  y: 0,
  scale: 1,
};

// Without motion, always visible: never left hidden
export function entranceItemProps(
  { animates, isInView }: EntranceState,
  index: number,
  {
    staggerMs = LANDING_STAGGER_MS,
    fromScale,
    delayMs = 0,
  }: EntranceItemOptions = {},
): EntranceItemProps {
  if (!animates) {
    return {
      initial: false,
      animate: ENTRANCE_SHOWN,
      transition: { duration: 0 },
    };
  }
  const hidden =
    fromScale === undefined
      ? { opacity: 0, y: LANDING_RISE_PX }
      : { opacity: 0, scale: fromScale };
  return {
    initial: hidden,
    animate: isInView ? ENTRANCE_SHOWN : hidden,
    transition: {
      duration: MOTION_SECONDS.landingRise,
      delay: (delayMs + index * staggerMs) / 1000,
      ease: 'easeOut',
    },
  };
}
