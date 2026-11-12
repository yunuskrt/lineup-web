'use client';

import { notFound } from 'next/navigation';
import { type ProPlan, ProView } from '@/components/pro/ProView';
import { PROFILE_HEADING } from '@/components/profile/styles';
import { useSession } from '@/hooks/use-auth';
import { useAppConfig } from '@/hooks/use-pro';
import { authErrorMessageOf } from '@/lib/auth';
import { SECONDARY_BUTTON } from '@/styles/classes';

export function ProScreen() {
  const config = useAppConfig();
  const session = useSession();

  if (config.isError && !config.data) {
    return (
      <div className="flex flex-col items-start gap-4">
        <h1 className={PROFILE_HEADING}>Couldn&apos;t load this page</h1>
        <p role="alert" className="text-16 leading-6 text-danger">
          {authErrorMessageOf(config.error)}
        </p>
        <button
          type="button"
          onClick={() => config.refetch()}
          className={SECONDARY_BUTTON}
        >
          Try again
        </button>
      </div>
    );
  }

  // Unknown yet: show nothing rather than guess
  if (!config.data) return null;
  // With the split off, there is no Pro to show
  if (!config.data.proEnabled) notFound();

  const plan: ProPlan = session.isPending
    ? 'pending'
    : session.data?.user.tier === 'pro'
      ? 'pro'
      : 'free';

  return <ProView plan={plan} />;
}
