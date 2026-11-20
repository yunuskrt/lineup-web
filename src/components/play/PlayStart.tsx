'use client';

import React, { type ReactNode, type RefObject, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import QuitDialog, { type QuitDialogCopy } from '@/components/game/QuitDialog';
import StartError from '@/components/play/StartError';
import { STEP_ACTIONS, STEP_NEXT } from '@/components/play/styles';
import { useStartNavigation } from '@/hooks/use-start-navigation';
import type { PlayMode } from '@/types/play';

type Props = {
  mode: PlayMode;
  href: string | null;
  // Solo at its daily cap; the server still refuses
  isCapped?: boolean;
  describedBy?: string;
  // Under the button, such as the runs-left line
  children?: ReactNode;
  // Replaces the mode's label, as Start practice
  label?: string;
  // Asked at the click: a reason to confirm first
  warningFor?: () => QuitDialogCopy | null;
  // The Start button, for focus from the screen
  ref?: RefObject<HTMLButtonElement | null>;
  // Before the button in its row, as Back
  leading?: ReactNode;
};

const START_LABELS: Record<PlayMode, string> = {
  solo: 'Start solo run',
  duel: 'Find an opponent',
};

const PlayStart = ({
  mode,
  href,
  isCapped = false,
  describedBy,
  children,
  label,
  warningFor,
  ref,
  leading,
}: Props) => {
  const { go, isBusy: isStarting, error } = useStartNavigation();
  const [warning, setWarning] = useState<QuitDialogCopy | null>(null);
  const ownRef = useRef<HTMLButtonElement>(null);
  const buttonRef = ref ?? ownRef;

  async function start() {
    if (!href || isCapped) return;
    if (!(await go(href))) setWarning(null);
  }

  // Removing the open dialog drops focus to body
  function dismissWarning() {
    flushSync(() => setWarning(null));
    buttonRef.current?.focus();
  }

  function handleClick() {
    const next = warningFor?.() ?? null;
    if (next) setWarning(next);
    else void start();
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <div className={STEP_ACTIONS}>
        {leading}
        <button
          ref={buttonRef}
          type="button"
          disabled={!href || isStarting || isCapped}
          aria-describedby={describedBy}
          onClick={handleClick}
          className={STEP_NEXT}
        >
          {isStarting ? 'Starting…' : (label ?? START_LABELS[mode])}
        </button>
      </div>
      {children}
      <StartError error={error} isBusy={isStarting} />
      {warning ? (
        <QuitDialog
          isOpen
          isQuitting={isStarting}
          copy={warning}
          onDismiss={dismissWarning}
          onConfirm={() => void start()}
        />
      ) : null}
    </div>
  );
};

export default PlayStart;
