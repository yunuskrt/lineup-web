'use client';

import { useSyncExternalStore } from 'react';

type ResolvedValueProps = {
  variable: string;
};

const subscribe = () => () => {};

export function ResolvedValue({ variable }: ResolvedValueProps) {
  const value = useSyncExternalStore(
    subscribe,
    () =>
      getComputedStyle(document.documentElement)
        .getPropertyValue(variable)
        .trim(),
    () => null,
  );

  return (
    <code className="inline-block min-w-[7ch] font-mono text-12 text-fg-muted">
      {value ?? '…'}
    </code>
  );
}
