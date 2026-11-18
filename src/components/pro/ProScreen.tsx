'use client';

import { notFound } from 'next/navigation';
import { type ProPlan, ProView } from '@/components/pro/ProView';
import { useSession } from '@/hooks/use-auth';
import { useAppConfig } from '@/hooks/use-pro';
import { authErrorMessageOf } from '@/lib/auth';
import RetryNotice from '@/components/shell/RetryNotice';

export function ProScreen() {
  const config = useAppConfig();
  const session = useSession();

  if (config.isError && !config.data) {
    return (
      <RetryNotice
        title="Couldn't load this page"
        titleLevel={1}
        message={authErrorMessageOf(config.error)}
        onRetry={() => config.refetch()}
      />
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
