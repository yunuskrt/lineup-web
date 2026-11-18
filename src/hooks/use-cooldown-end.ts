'use client';

import { useEffect, useEffectEvent } from 'react';

// The server set the time; this only unlocks
export function useCooldownEnd(
  cooldownUntil: number | null,
  onEnd: () => void,
) {
  const end = useEffectEvent(onEnd);

  useEffect(() => {
    if (cooldownUntil === null) return;
    const timer = setTimeout(
      () => end(),
      Math.max(0, cooldownUntil - Date.now()),
    );
    return () => clearTimeout(timer);
  }, [cooldownUntil]);
}
