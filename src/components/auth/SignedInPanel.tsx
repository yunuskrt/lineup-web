'use client';

import Link from 'next/link';
import { useSignOut } from '@/hooks/use-auth';
import { authErrorMessageOf } from '@/lib/auth';
import { PRIMARY_BUTTON_LARGE, SECONDARY_BUTTON } from '@/styles/classes';

type SignedInPanelProps = {
  handle: string;
};

export function SignedInPanel({ handle }: SignedInPanelProps) {
  const signOut = useSignOut();

  return (
    <div className="flex flex-col items-start gap-6">
      <p className="text-16 text-fg-muted sm:text-20">
        You&apos;re playing as{' '}
        <span className="font-medium text-fg">{handle}</span>.
      </p>
      {signOut.error && !signOut.isPending ? (
        <p role="alert" className="text-14 text-danger">
          {authErrorMessageOf(signOut.error)}
        </p>
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
