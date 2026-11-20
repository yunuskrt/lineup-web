import { useEffect, useState } from 'react';
import { reconnectSecondsLeft } from '@/lib/duel-status';
import { serverClock } from '@/lib/server-clock';
import type { CanvasGateCountdown } from '@/types/canvas';

const COUNTDOWN_TICK_MS = 250;

function readClock(clock: CanvasGateCountdown['clock']): number {
  return clock === 'local' ? Date.now() : serverClock.now();
}

// Seconds left to the deadline; decides nothing
export function useSecondsLeft(countdown: CanvasGateCountdown): number {
  const { clock } = countdown;
  const [now, setNow] = useState(() => readClock(clock));

  useEffect(() => {
    const timer = setInterval(
      () => setNow(readClock(clock)),
      COUNTDOWN_TICK_MS,
    );
    return () => clearInterval(timer);
  }, [clock]);

  return reconnectSecondsLeft(countdown.deadline, now);
}
