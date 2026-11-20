import React from 'react';
import type { Metadata } from 'next';
import AuthPanel from '@/components/auth/AuthPanel';
import { authModeFrom } from '@/lib/auth';
import { BOARD, SITE_CONTAINER } from '@/styles/classes';

export const metadata: Metadata = {
  title: 'Sign in',
};

type Props = PageProps<'/sign-in'>;

const SignInPage = async ({ searchParams }: Props) => {
  const mode = authModeFrom((await searchParams).mode);

  return (
    <div className={`${SITE_CONTAINER} py-12`}>
      <div className={BOARD}>
        <AuthPanel mode={mode} />
      </div>
    </div>
  );
};

export default SignInPage;
