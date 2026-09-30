import { useReducedMotion } from 'motion/react';
import { useSyncExternalStore } from 'react';
import { type MotionEffect, motionFor } from '@/styles/motion';

const subscribe = () => () => {};

// True when the effect should run for this viewer
export function useMotionPolicy(): (effect: MotionEffect) => boolean {
  const isReduced = useReducedMotion();
  // The server can't know; match it until hydrated
  const isHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  return (effect) => motionFor(effect, isHydrated ? isReduced : null);
}
