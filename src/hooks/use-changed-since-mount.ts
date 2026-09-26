import { useState } from 'react';

// Gates one-shot overlays off the mounting render
export function useChangedSinceMount<T>(value: T): boolean {
  const [initial] = useState(value);
  return value !== initial;
}
