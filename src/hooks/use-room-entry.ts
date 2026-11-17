'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useEnsureSession } from '@/hooks/use-auth';
import { withQuery } from '@/lib/filters';

// A guest is made first, as Start does
export function useRoomEntry() {
  const router = useRouter();
  const ensureSession = useEnsureSession();
  const [isNavigating, startNavigation] = useTransition();

  async function go(params: URLSearchParams) {
    try {
      await ensureSession.mutateAsync();
      startNavigation(() => router.push(withQuery('/play/duel', params)));
    } catch {
      // Shown through error
    }
  }

  return {
    go,
    isBusy: ensureSession.isPending || isNavigating,
    error: ensureSession.error,
  };
}
