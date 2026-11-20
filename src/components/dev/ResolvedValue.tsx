'use client';

import React, { useSyncExternalStore } from 'react';

type Props = {
  variable: string;
};

const subscribe = () => () => {};

export const ResolvedValue = ({ variable }: Props) => {
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
};
