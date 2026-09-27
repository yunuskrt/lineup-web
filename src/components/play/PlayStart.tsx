'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useEnsureSession } from '@/hooks/use-auth';
import { authErrorMessageOf } from '@/lib/auth';
import { PRIMARY_BUTTON_LARGE } from '@/styles/classes';
import type { PlayMode } from '@/types/play';

type PlayStartProps = {
  mode: PlayMode;
  href: string | null;
};

const START_LABELS: Record<PlayMode, string> = {
  solo: 'Start solo run',
  duel: 'Find an opponent',
};

export function PlayStart({ mode, href }: PlayStartProps) {
  const router = useRouter();
  const ensureSession = useEnsureSession();
  const [isNavigating, startNavigation] = useTransition();
  const isStarting = ensureSession.isPending || isNavigating;

  async function handleClick() {
    if (!href) return;
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
        disabled={!href || isStarting}
        onClick={handleClick}
        className={PRIMARY_BUTTON_LARGE}
      >
        {isStarting ? 'Starting…' : START_LABELS[mode]}
      </button>
      {ensureSession.error && !isStarting ? (
        <p role="alert" className="text-14 text-danger">
          {authErrorMessageOf(ensureSession.error)}
        </p>
      ) : null}
    </div>
  );
}
