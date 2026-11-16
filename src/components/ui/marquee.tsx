'use client';

import { useInView } from 'motion/react';
import { type ReactNode, useRef } from 'react';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { cn } from '@/lib/utils';
import { MOTION_DURATION_MS } from '@/styles/motion';

type MarqueeProps = {
  children: ReactNode;
  className?: string;
};

const TRACK = 'flex w-max shrink-0 items-center gap-3 pr-3 animate-marquee';

// neobrutalism.dev Marquee: two tracks loop seamlessly
export function Marquee({ children, className }: MarqueeProps) {
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

  const style = {
    animationDuration: `${MOTION_DURATION_MS.marqueeLoop}ms`,
    animationPlayState: isInView ? 'running' : 'paused',
  };

  return (
    <div ref={ref} className={cn('flex overflow-hidden', className)}>
      <div className={TRACK} style={style}>
        {children}
      </div>
      <div className={TRACK} style={style}>
        {children}
      </div>
    </div>
  );
}
