'use client';

import React, { type ReactNode, useRef } from 'react';
import { useInView } from 'motion/react';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { cn } from '@/lib/utils';
import { MARQUEE_LOOP_DURATION } from '@/styles/classes';

type Props = {
  children: ReactNode;
  className?: string;
};

const TRACK = `flex w-max shrink-0 items-center gap-3 pr-3 animate-marquee ${MARQUEE_LOOP_DURATION}`;

const PAUSED = '[animation-play-state:paused]';

// neobrutalism.dev Marquee: two tracks loop seamlessly
export const Marquee = ({ children, className }: Props) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref);
  const runs = useMotionPolicy();

  // Reduced motion: the same items, still and wrapped
  if (!runs('marquee')) {
    return (
      <div
        ref={ref}
        className={cn('flex flex-wrap justify-center gap-3', className)}
      >
        {children}
      </div>
    );
  }

  const track = cn(TRACK, !isInView && PAUSED);

  return (
    <div ref={ref} className={cn('flex overflow-hidden', className)}>
      <div className={track}>{children}</div>
      <div className={track}>{children}</div>
    </div>
  );
};
