'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useEnsureSession } from '@/hooks/use-auth';

// A guest is made first; go reports false if that failed
export function useStartNavigation() {
  const router = useRouter();
  const ensureSession = useEnsureSession();
  const [isNavigating, startNavigation] = useTransition();

  async function go(href: string): Promise<boolean> {
    try {
      await ensureSession.mutateAsync();
      startNavigation(() => router.push(href));
      return true;
    } catch {
      return false;
    }
  }

  return {
    go,
    isBusy: ensureSession.isPending || isNavigating,
    error: ensureSession.error,
  };
}
