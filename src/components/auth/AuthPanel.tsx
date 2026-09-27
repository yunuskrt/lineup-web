'use client';

import { AuthSkeleton } from '@/components/auth/AuthSkeleton';
import { ContinueAsGuest } from '@/components/auth/ContinueAsGuest';
import { ModeSwitch } from '@/components/auth/ModeSwitch';
import { SignedInPanel } from '@/components/auth/SignedInPanel';
import { SignInForm } from '@/components/auth/SignInForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { useSession } from '@/hooks/use-auth';
import { authErrorMessageOf } from '@/lib/auth';
import { SECONDARY_BUTTON } from '@/styles/classes';
import type { AuthMode } from '@/types/auth';

type AuthPanelProps = {
  mode: AuthMode;
};

const HEADINGS = {
  'sign-in': 'Sign in',
  'sign-up': 'Create account',
  'signed-in': 'Signed in',
} as const;

function Heading({ children }: { children: string }) {
  return <h1 className="font-display text-32 font-bold">{children}</h1>;
}

export function AuthPanel({ mode }: AuthPanelProps) {
  const session = useSession();

  // Forms wait for the session: sign-up reads it
  if (session.isPending) {
    return (
      <>
        <Heading>{HEADINGS[mode]}</Heading>
        <AuthSkeleton mode={mode} />
      </>
    );
  }

  if (session.isError) {
    return (
      <>
        <Heading>{HEADINGS[mode]}</Heading>
        <div className="flex flex-col items-start gap-4">
          <p role="alert" className="text-14 text-danger">
            {authErrorMessageOf(session.error)}
          </p>
          <button
            type="button"
            onClick={() => session.refetch()}
            className={SECONDARY_BUTTON}
          >
            Try again
          </button>
        </div>
      </>
    );
  }

  const user = session.data?.user ?? null;
  if (user && !user.isGuest) {
    return (
      <>
        <Heading>{HEADINGS['signed-in']}</Heading>
        <SignedInPanel handle={user.handle} />
      </>
    );
  }

  return (
    <>
      <Heading>{HEADINGS[mode]}</Heading>
      <div className="flex flex-col gap-8">
        {user ? (
          <p className="text-16 text-fg-muted">
            You&apos;re playing as{' '}
            <span className="font-medium text-fg">{user.handle}</span>.
            {mode === 'sign-up'
              ? ' Create an account to keep your history.'
              : null}
          </p>
        ) : null}
        <ModeSwitch mode={mode} />
        {mode === 'sign-in' ? <SignInForm /> : <SignUpForm />}
        {user ? null : <ContinueAsGuest />}
      </div>
    </>
  );
}
