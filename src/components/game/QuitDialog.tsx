'use client';

import { useId, useLayoutEffect, useRef } from 'react';
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from '@/styles/classes';

export type QuitDialogCopy = {
  title: string;
  detail: string;
  confirmLabel: string;
  pendingLabel: string;
};

export const SOLO_QUIT_COPY: QuitDialogCopy = {
  title: 'Quit this run?',
  detail:
    'Your run ends here and counts as played. The clock keeps running while you decide.',
  confirmLabel: 'Quit run',
  pendingLabel: 'Quitting…',
};

export const DUEL_FORFEIT_COPY: QuitDialogCopy = {
  title: 'Forfeit this duel?',
  detail:
    'Leaving counts as a loss. Your clock keeps running while you decide.',
  confirmLabel: 'Forfeit',
  pendingLabel: 'Forfeiting…',
};

type QuitDialogProps = {
  isOpen: boolean;
  isQuitting: boolean;
  copy?: QuitDialogCopy;
  onDismiss: () => void;
  onConfirm: () => void;
};

export function QuitDialog({
  isOpen,
  isQuitting,
  copy = SOLO_QUIT_COPY,
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
        {copy.title}
      </h2>
      <p id={detailId} className="mt-2 text-14 text-fg-muted">
        {copy.detail}
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
          {isQuitting ? copy.pendingLabel : copy.confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
