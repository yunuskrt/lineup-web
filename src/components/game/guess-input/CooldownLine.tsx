'use client';

import React, { useEffect, useState } from 'react';
import { cooldownLabel } from '@/lib/system-states';

const COOLDOWN_TICK_MS = 250;

type Props = { until: number };

// Ticks to the server's retry time; decides nothing
const CooldownLine = ({ until }: Props) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), COOLDOWN_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <p aria-hidden="true" className="text-12 font-medium text-warning-text">
      {cooldownLabel(until - now)}
    </p>
  );
};

export default CooldownLine;
