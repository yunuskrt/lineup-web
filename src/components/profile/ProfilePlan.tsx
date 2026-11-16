'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useAppConfig } from '@/hooks/use-pro';
import { PRO_PATH, showsPro } from '@/lib/pro';
import { SECONDARY_BUTTON } from '@/styles/classes';
import type { Tier } from '@/types/user';

// Shown only while the Free/Pro split is on
export function ProfilePlan({ tier }: { tier: Tier }) {
  const config = useAppConfig();
  if (!showsPro(config.data ?? null)) return null;
  const isPro = tier === 'pro';

  return (
    <>
      <Badge variant="sticker" tone={isPro ? 'brand' : 'neutral'}>
        {isPro ? 'Pro' : 'Free'}
      </Badge>
      <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-2">
        <p className="text-14 leading-5 text-fg-muted">
          {isPro ? "You're on Pro." : "You're on the Free plan."}
        </p>
        {isPro ? null : (
          <Link href={PRO_PATH} className={SECONDARY_BUTTON}>
            See Pro
          </Link>
        )}
      </div>
    </>
  );
}
