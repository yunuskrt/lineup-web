'use client';

import React, { useRef } from 'react';
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { PRIMARY_BUTTON, SECONDARY_BUTTON } from '@/styles/classes';

export type QuitDialogCopy = {
  title: string;
  detail: string;
  confirmLabel: string;
  pendingLabel: string;
  // The safe choice; Keep playing when unset
  dismissLabel?: string;
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

type Props = {
  isOpen: boolean;
  isQuitting: boolean;
  copy?: QuitDialogCopy;
  onDismiss: () => void;
  onConfirm: () => void;
};

const QuitDialog = ({
  isOpen,
  isQuitting,
  copy = SOLO_QUIT_COPY,
  onDismiss,
  onConfirm,
}: Props) => {
  const popupRef = useRef<HTMLDivElement>(null);

  // Never pull focus back from the summary or Start
  function returnFocus(): boolean {
    const active = document.activeElement;
    return (
      !active ||
      active === document.body ||
      (popupRef.current?.contains(active) ?? false)
    );
  }

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onDismiss();
      }}
    >
      <AlertDialogContent ref={popupRef} finalFocus={returnFocus}>
        <AlertDialogTitle>{copy.title}</AlertDialogTitle>
        <AlertDialogDescription>{copy.detail}</AlertDialogDescription>
        {/* First in order, so it takes focus on open */}
        <AlertDialogFooter>
          <AlertDialogClose disabled={isQuitting} className={PRIMARY_BUTTON}>
            {copy.dismissLabel ?? 'Keep playing'}
          </AlertDialogClose>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isQuitting}
            className={SECONDARY_BUTTON}
          >
            {isQuitting ? copy.pendingLabel : copy.confirmLabel}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default QuitDialog;
