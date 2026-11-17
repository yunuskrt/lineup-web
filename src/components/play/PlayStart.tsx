'use client';

import { useRouter } from 'next/navigation';
import {
  type ReactNode,
  type RefObject,
  useRef,
  useState,
  useTransition,
} from 'react';
import { flushSync } from 'react-dom';
import { QuitDialog, type QuitDialogCopy } from '@/components/game/QuitDialog';
import { STEP_ACTIONS, STEP_NEXT } from '@/components/play/styles';
import { useEnsureSession } from '@/hooks/use-auth';
import { authErrorMessageOf } from '@/lib/auth';
import type { PlayMode } from '@/types/play';

type PlayStartProps = {
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

export function PlayStart({
  mode,
  href,
  isCapped = false,
  describedBy,
  children,
  label,
  warningFor,
  ref,
  leading,
}: PlayStartProps) {
  const router = useRouter();
  const ensureSession = useEnsureSession();
  const [isNavigating, startNavigation] = useTransition();
  const [warning, setWarning] = useState<QuitDialogCopy | null>(null);
  const isStarting = ensureSession.isPending || isNavigating;
  const ownRef = useRef<HTMLButtonElement>(null);
  const buttonRef = ref ?? ownRef;

  async function start() {
    if (!href || isCapped) return;
    try {
      await ensureSession.mutateAsync();
      startNavigation(() => router.push(href));
    } catch {
      setWarning(null);
      // Shown through ensureSession.error
    }
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
      {ensureSession.error && !isStarting ? (
        <p role="alert" className="text-14 text-danger-text">
          {authErrorMessageOf(ensureSession.error)}
        </p>
      ) : null}
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
}
