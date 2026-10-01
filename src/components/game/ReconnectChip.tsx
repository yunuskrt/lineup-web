'use client';

import { useEffect, useState } from 'react';
import { reconnectSecondsLeft } from '@/lib/duel-status';

const RECONNECT_TICK_MS = 250;

// Ticks from the server deadline; decides nothing
export function ReconnectChip({ deadline }: { deadline: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), RECONNECT_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="rounded-sm bg-warning px-2 py-0.5 text-12 font-semibold whitespace-nowrap text-on-accent">
      {/* Server and client clocks may differ by a tick */}
      <span suppressHydrationWarning>
        Reconnecting, {reconnectSecondsLeft(deadline, now)}s
      </span>
    </span>
  );
}
