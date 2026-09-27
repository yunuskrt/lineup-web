'use client';

import { useId, useLayoutEffect, useRef } from 'react';
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from '@/styles/classes';

type QuitDialogProps = {
  isOpen: boolean;
  isQuitting: boolean;
  onDismiss: () => void;
  onConfirm: () => void;
};

export function QuitDialog({
  isOpen,
  isQuitting,
  onDismiss,
  onConfirm,
}: QuitDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const detailId = useId();

  // Closes before the summary takes focus
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (isOpen && !dialog.open) dialog.showModal();
    if (!isOpen && dialog.open) dialog.close();
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={detailId}
      onClose={onDismiss}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-lg border border-line bg-surface-raised p-6 text-fg backdrop:bg-gate-scrim"
    >
      <h2 id={titleId} className="text-20 font-semibold">
        Quit this run?
      </h2>
      <p id={detailId} className="mt-2 text-14 text-fg-muted">
        Your run ends here and counts as played. The clock keeps running while
        you decide.
      </p>
      {/* First in order, so showModal focuses it */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onDismiss}
          disabled={isQuitting}
          className={PRIMARY_BUTTON}
        >
          Keep playing
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isQuitting}
          className={SECONDARY_BUTTON}
        >
          {isQuitting ? 'Quitting…' : 'Quit run'}
        </button>
      </div>
    </dialog>
  );
}
