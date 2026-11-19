'use client';

import React, { useEffect, useState } from 'react';
import { roomClosesLabel } from '@/lib/room-code';
import { serverClock } from '@/lib/server-clock';

const ROOM_TICK_MS = 1_000;

type Props = { expiresAt: number };

// Counts to the server's deadline; decides nothing
const ClosesIn = ({ expiresAt }: Props) => {
  const [now, setNow] = useState(() => serverClock.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(serverClock.now()), ROOM_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <p suppressHydrationWarning className="text-14 text-fg-muted tabular-nums">
      {roomClosesLabel(expiresAt - now)}
    </p>
  );
};

export default ClosesIn;
