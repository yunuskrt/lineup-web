'use client';

import React from 'react';
import { useSecondsLeft } from '@/hooks/use-seconds-left';
import { TYPE_NUMBER } from '@/styles/classes';
import type { CanvasGateCountdown } from '@/types/canvas';

type Props = { countdown: CanvasGateCountdown };

// The same deadline, big; the sentence says it too
const GateSeconds = ({ countdown }: Props) => {
  const secondsLeft = useSecondsLeft(countdown);

  return (
    <p
      aria-hidden="true"
      suppressHydrationWarning
      className={`text-center text-48 leading-none ${TYPE_NUMBER}`}
    >
      {secondsLeft}s
    </p>
  );
};

export default GateSeconds;
