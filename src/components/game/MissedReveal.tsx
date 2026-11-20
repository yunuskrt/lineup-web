'use client';

import React, { useEffect, useRef } from 'react';
import ProLock from '@/components/pro/ProLock';
import { SECONDARY_BUTTON } from '@/styles/classes';
import type { SoloSummary } from '@/types/solo';

const LABEL = 'Reveal the full XI';

type Props = {
  summary: SoloSummary;
  isRevealed: boolean;
  onReveal: () => void;
};

const MissedReveal = ({ summary, isRevealed, onReveal }: Props) => {
  const lineRef = useRef<HTMLParagraphElement>(null);

  // The button is gone; keep focus in the rail
  useEffect(() => {
    if (isRevealed) lineRef.current?.focus();
  }, [isRevealed]);

  if (summary.missedCount === 0) return null;

  // The server sends the list to Pro only
  if (summary.missed === null) {
    return (
      <ProLock
        label={LABEL}
        caption="Pro shows every player you missed."
        isFullWidth
      />
    );
  }

  if (isRevealed) {
    return (
      <p
        ref={lineRef}
        tabIndex={-1}
        role="status"
        className="flex h-10 items-center text-14 leading-5 text-fg-muted outline-none"
      >
        Showing the {summary.missedCount} you missed.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={onReveal}
      className={`w-full ${SECONDARY_BUTTON}`}
    >
      {LABEL}
    </button>
  );
};

export default MissedReveal;
