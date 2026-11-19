import React from 'react';
import FieldSkeleton from '@/components/auth/auth-skeleton/FieldSkeleton';
import { AUTH_FORM } from '@/components/auth/styles';
import { BOARD_SECTION } from '@/styles/classes';
import type { AuthMode } from '@/types/auth';
import { SKELETON } from '@/components/ui/skeleton';

type Props = {
  mode: AuthMode;
};

const AuthSkeleton = ({ mode }: Props) => {
  const isSignUp = mode === 'sign-up';

  return (
    <>
      <div aria-hidden="true" className={BOARD_SECTION}>
        <div className={AUTH_FORM}>
          <div className="flex h-12 gap-1 rounded-md border-2 border-line bg-surface-card p-1">
            <div className={`flex-auto ${SKELETON}`} />
            <div className={`flex-auto ${SKELETON}`} />
          </div>
          <div className="flex flex-col gap-5">
            {isSignUp ? <FieldSkeleton hasHint /> : null}
            <FieldSkeleton hasHint={false} />
            <FieldSkeleton hasHint={false} />
            <div className={`h-12 w-full sm:w-36 ${SKELETON}`} />
          </div>
        </div>
      </div>
      <div aria-hidden="true" className={BOARD_SECTION}>
        <div className="flex flex-col gap-3">
          <div className={`h-5.25 w-48 ${SKELETON}`} />
          <div className={`h-9.75 w-40 ${SKELETON}`} />
        </div>
      </div>
    </>
  );
};

export default AuthSkeleton;
