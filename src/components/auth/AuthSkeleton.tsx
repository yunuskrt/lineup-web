import type { AuthMode } from '@/types/auth';
import { SKELETON } from '@/components/ui/skeleton';

type AuthSkeletonProps = {
  mode: AuthMode;
};

// Heights mirror the real switch, fields and buttons
function FieldSkeleton({ hasHint }: { hasHint: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className={`h-5.25 w-20 ${SKELETON}`} />
      <div className={`h-11.5 w-full ${SKELETON}`} />
      {hasHint ? <div className={`h-4.5 w-32 ${SKELETON}`} /> : null}
    </div>
  );
}

export function AuthSkeleton({ mode }: AuthSkeletonProps) {
  const isSignUp = mode === 'sign-up';

  return (
    <div aria-hidden="true" className="flex flex-col gap-8">
      <div className="flex h-8.75 gap-6 border-b border-line">
        <div className={`h-5 w-14 ${SKELETON}`} />
        <div className={`h-5 w-28 ${SKELETON}`} />
      </div>
      <div className="flex flex-col gap-5">
        {isSignUp ? <FieldSkeleton hasHint /> : null}
        <FieldSkeleton hasHint={false} />
        <FieldSkeleton hasHint={false} />
        <div className={`h-12 w-36 ${SKELETON}`} />
      </div>
      <div className="flex flex-col gap-3 border-t border-line pt-6">
        <div className={`h-5.25 w-48 ${SKELETON}`} />
        <div className={`h-9.75 w-40 ${SKELETON}`} />
      </div>
    </div>
  );
}
