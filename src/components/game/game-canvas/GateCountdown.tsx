'use client';

import React from 'react';
import { useSecondsLeft } from '@/hooks/use-seconds-left';
import type { CanvasGateCountdown } from '@/types/canvas';

type Props = { countdown: CanvasGateCountdown };

const GateCountdown = ({ countdown }: Props) => {
  const secondsLeft = useSecondsLeft(countdown);

  return (
    // Server and client clocks may differ by a tick
    <span suppressHydrationWarning>{countdown.label(secondsLeft)}</span>
  );
};

export default GateCountdown;
