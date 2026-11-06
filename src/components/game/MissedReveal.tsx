'use client';

import { useEffect, useId, useRef } from 'react';
import { FOCUS_RING, SECONDARY_BUTTON } from '@/styles/classes';
import type { SoloSummary } from '@/types/solo';

const LABEL = 'Reveal the full XI';

// Never hovers: it does nothing on a free run
const LOCKED_BUTTON = `w-full rounded-sm border border-line px-4 py-2 text-14 font-semibold text-fg-muted ${FOCUS_RING}`;

type MissedRevealProps = {
  summary: SoloSummary;
  isRevealed: boolean;
  onReveal: () => void;
};

export function MissedReveal({
  summary,
  isRevealed,
  onReveal,
}: MissedRevealProps) {
  const captionId = useId();
  const lineRef = useRef<HTMLParagraphElement>(null);

  // The button is gone; keep focus in the rail
  useEffect(() => {
    if (isRevealed) lineRef.current?.focus();
  }, [isRevealed]);

  if (summary.missedCount === 0) return null;

  // The server sends the list to Pro only
  if (summary.missed === null) {
    return (
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          aria-disabled="true"
          aria-describedby={captionId}
          className={LOCKED_BUTTON}
        >
          {LABEL}
        </button>
        <p id={captionId} className="text-12 leading-4 text-fg-muted">
          Pro shows every player you missed.
        </p>
      </div>
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
}
