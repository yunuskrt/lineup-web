'use client';

import { animate, useInView } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useMotionPolicy } from '@/hooks/use-motion-policy';
import { formatCount } from '@/lib/landing';
import { MOTION_EASING, MOTION_SECONDS } from '@/styles/motion';

// Presentation only; readers get the final value
export function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.6 });
  const runs = useMotionPolicy();
  const animates = runs('countUp');
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!isInView || !animates) return;
    const controls = animate(0, value, {
      duration: MOTION_SECONDS.countUp,
      ease: MOTION_EASING.countUp,
      onUpdate: (latest) => setShown(Math.round(latest)),
    });
    return () => controls.stop();
  }, [animates, isInView, value]);

  return (
    <>
      <span ref={ref} aria-hidden="true">
        {formatCount(animates ? shown : value)}
      </span>
      <span className="sr-only">{formatCount(value)}</span>
    </>
  );
}
