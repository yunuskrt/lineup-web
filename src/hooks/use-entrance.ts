import { useInView } from 'motion/react';
import { type RefObject, useRef } from 'react';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import {
  type EntranceItemOptions,
  type EntranceItemProps,
  entranceItemProps,
} from '@/lib/entrance';

const IN_VIEW_AMOUNT = 0.3;

export type Entrance<T extends Element> = {
  ref: RefObject<T | null>;
  // True once seen; always true without motion
  isShown: boolean;
  item: (index: number, options?: EntranceItemOptions) => EntranceItemProps;
};

// One entrance per group, once; instant when reduced
export function useEntrance<T extends Element>(): Entrance<T> {
  const ref = useRef<T | null>(null);
  const isInView = useInView(ref, { once: true, amount: IN_VIEW_AMOUNT });
  const animates = useMotionPolicy()('landingEntrance');

  return {
    ref,
    isShown: !animates || isInView,
    item: (index, options) =>
      entranceItemProps({ animates, isInView }, index, options),
  };
}
