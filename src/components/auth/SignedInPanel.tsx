'use client';

import Link from 'next/link';
import { AuthError } from '@/components/auth/AuthError';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useSignOut } from '@/hooks/use-auth';
import { handleInitial } from '@/lib/profile';
import { authErrorMessageOf } from '@/lib/auth';
import { PRIMARY_BUTTON_LARGE, SECONDARY_BUTTON } from '@/styles/classes';

type SignedInPanelProps = {
  handle: string;
};

export function SignedInPanel({ handle }: SignedInPanelProps) {
  const signOut = useSignOut();

  return (
    <div className="flex flex-col items-start gap-6">
      <div className="flex items-center gap-3">
        {/* The line beside it names the handle */}
        <Avatar size="lg" aria-hidden="true" className="bg-block-mint">
          <AvatarFallback className="font-display text-20 font-extrabold">
            {handleInitial(handle)}
          </AvatarFallback>
        </Avatar>
        <p className="text-16 text-fg-muted sm:text-20">
          You&apos;re playing as{' '}
          <span className="font-medium text-fg">{handle}</span>.
        </p>
      </div>
      {signOut.error && !signOut.isPending ? (
        <AuthError role="alert">{authErrorMessageOf(signOut.error)}</AuthError>
      ) : null}
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/play" className={PRIMARY_BUTTON_LARGE}>
          Play
        </Link>
        <button
          type="button"
          disabled={signOut.isPending}
          onClick={() => signOut.mutate()}
          className={SECONDARY_BUTTON}
        >
          {signOut.isPending ? 'Signing out…' : 'Sign out'}
        </button>
      </div>
    </div>
  );
}
