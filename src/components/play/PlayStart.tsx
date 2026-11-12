'use client';

import { useRouter } from 'next/navigation';
import { type ReactNode, useTransition } from 'react';
import { useEnsureSession } from '@/hooks/use-auth';
import { authErrorMessageOf } from '@/lib/auth';
import { PRIMARY_BUTTON_LARGE } from '@/styles/classes';
import type { PlayMode } from '@/types/play';

type PlayStartProps = {
  mode: PlayMode;
  href: string | null;
  // Solo at its daily cap; the server still refuses
  isCapped?: boolean;
  describedBy?: string;
  // Under the button, such as the runs-left line
  children?: ReactNode;
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
}: PlayStartProps) {
  const router = useRouter();
  const ensureSession = useEnsureSession();
  const [isNavigating, startNavigation] = useTransition();
  const isStarting = ensureSession.isPending || isNavigating;

  async function handleClick() {
    if (!href || isCapped) return;
    try {
      await ensureSession.mutateAsync();
      startNavigation(() => router.push(href));
    } catch {
      // Shown through ensureSession.error
    }
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <button
        type="button"
        disabled={!href || isStarting || isCapped}
        aria-describedby={describedBy}
        onClick={handleClick}
        className={PRIMARY_BUTTON_LARGE}
      >
        {isStarting ? 'Starting…' : START_LABELS[mode]}
      </button>
      {children}
      {ensureSession.error && !isStarting ? (
        <p role="alert" className="text-14 text-danger">
          {authErrorMessageOf(ensureSession.error)}
        </p>
      ) : null}
    </div>
  );
}
