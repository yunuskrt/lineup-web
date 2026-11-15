'use client';

import { notFound } from 'next/navigation';
import { TriangleAlert } from 'lucide-react';
import { type ProPlan, ProView } from '@/components/pro/ProView';
import { useSession } from '@/hooks/use-auth';
import { useAppConfig } from '@/hooks/use-pro';
import { authErrorMessageOf } from '@/lib/auth';
import { SECONDARY_BUTTON } from '@/styles/classes';
import { StateNotice } from '@/components/shell/StateNotice';

export function ProScreen() {
  const config = useAppConfig();
  const session = useSession();

  if (config.isError && !config.data) {
    return (
      <StateNotice
        tone="error"
        icon={TriangleAlert}
        title="Couldn't load this page"
        titleLevel={1}
        message={authErrorMessageOf(config.error)}
      >
        <button
          type="button"
          onClick={() => config.refetch()}
          className={SECONDARY_BUTTON}
        >
          Try again
        </button>
      </StateNotice>
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
