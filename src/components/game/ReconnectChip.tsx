'use client';

import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { reconnectSecondsLeft } from '@/lib/duel-status';
import { serverClock } from '@/lib/server-clock';

const RECONNECT_TICK_MS = 250;

type Props = { deadline: number };

// Ticks from the server deadline; decides nothing
const ReconnectChip = ({ deadline }: Props) => {
  const [now, setNow] = useState(() => serverClock.now());

  useEffect(() => {
    const timer = setInterval(
      () => setNow(serverClock.now()),
      RECONNECT_TICK_MS,
    );
    return () => clearInterval(timer);
  }, []);

  return (
    // Normal case: "18S" would misread the seconds
    <Badge variant="sticker" tone="warning" tilt="none" className="normal-case">
      <WifiOff aria-hidden="true" strokeWidth={2.5} />
      {/* Server and client clocks may differ by a tick */}
      <span suppressHydrationWarning>
        Reconnecting, {reconnectSecondsLeft(deadline, now)}s
      </span>
    </Badge>
  );
};

export default ReconnectChip;
