import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

// Null until hydrated: the server can't know the zone
export function useToday(): Date | null {
  const today = useSyncExternalStore(
    subscribe,
    () => new Date().toDateString(),
    () => null,
  );
  return today === null ? null : new Date(today);
}
