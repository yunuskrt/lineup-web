'use client';

import { useRouter } from 'next/navigation';
import { AuthError } from '@/components/auth/AuthError';
import { useContinueAsGuest } from '@/hooks/use-auth';
import { authErrorMessageOf } from '@/lib/auth';
import { SECONDARY_BUTTON } from '@/styles/classes';

export function ContinueAsGuest() {
  const router = useRouter();
  const continueAsGuest = useContinueAsGuest();

  async function handleClick() {
    try {
      await continueAsGuest.mutateAsync();
      router.push('/play');
    } catch {
      // Shown through continueAsGuest.error
    }
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <p className="text-14 text-fg-muted">No account needed to play.</p>
      {continueAsGuest.error && !continueAsGuest.isPending ? (
        <AuthError role="alert">
          {authErrorMessageOf(continueAsGuest.error)}
        </AuthError>
      ) : null}
      <button
        type="button"
        disabled={continueAsGuest.isPending}
        onClick={handleClick}
        className={SECONDARY_BUTTON}
      >
        {continueAsGuest.isPending ? 'Continuing…' : 'Continue as guest'}
      </button>
    </div>
  );
}
