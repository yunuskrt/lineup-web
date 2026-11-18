'use client';

import type { ReactNode } from 'react';
import { AuthSkeleton } from '@/components/auth/AuthSkeleton';
import { ContinueAsGuest } from '@/components/auth/ContinueAsGuest';
import { ModeSwitch } from '@/components/auth/ModeSwitch';
import { SignedInPanel } from '@/components/auth/SignedInPanel';
import { SignInForm } from '@/components/auth/SignInForm';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { AUTH_FORM } from '@/components/auth/styles';
import { useSession } from '@/hooks/use-auth';
import { authErrorMessageOf } from '@/lib/auth';
import { BOARD_SECTION, TYPE_TITLE } from '@/styles/classes';
import type { AuthMode } from '@/types/auth';
import RetryNotice from '@/components/shell/RetryNotice';

type AuthPanelProps = {
  mode: AuthMode;
};

const HEADINGS = {
  'sign-in': 'Sign in',
  'sign-up': 'Create account',
  'signed-in': 'Signed in',
} as const;

function Header({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className={BOARD_SECTION}>
      <h1 className={TYPE_TITLE}>{title}</h1>
      {children}
    </header>
  );
}

export function AuthPanel({ mode }: AuthPanelProps) {
  const session = useSession();

  // Forms wait for the session: sign-up reads it
  if (session.isPending) {
    return (
      <>
        <Header title={HEADINGS[mode]} />
        <AuthSkeleton mode={mode} />
      </>
    );
  }

  if (session.isError) {
    return (
      <>
        <Header title={HEADINGS[mode]} />
        <div className={BOARD_SECTION}>
          <RetryNotice
            message={authErrorMessageOf(session.error)}
            onRetry={() => session.refetch()}
          />
        </div>
      </>
    );
  }

  const user = session.data?.user ?? null;
  if (user && !user.isGuest) {
    return (
      <>
        <Header title={HEADINGS['signed-in']} />
        <div className={BOARD_SECTION}>
          <SignedInPanel handle={user.handle} />
        </div>
      </>
    );
  }

  return (
    <>
      <Header title={HEADINGS[mode]}>
        {user ? (
          <p className="text-16 text-fg-muted">
            You&apos;re playing as{' '}
            <span className="font-medium text-fg">{user.handle}</span>.
            {mode === 'sign-up'
              ? ' Create an account to keep your history.'
              : " Signing in to another account leaves this guest's games behind."}
          </p>
        ) : null}
      </Header>
      <div className={BOARD_SECTION}>
        <div className={AUTH_FORM}>
          <ModeSwitch mode={mode} />
          {mode === 'sign-in' ? <SignInForm /> : <SignUpForm />}
        </div>
      </div>
      {user ? null : (
        <div className={BOARD_SECTION}>
          <ContinueAsGuest />
        </div>
      )}
    </>
  );
}
