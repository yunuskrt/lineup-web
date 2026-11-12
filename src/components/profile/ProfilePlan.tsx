'use client';

import Link from 'next/link';
import { useAppConfig } from '@/hooks/use-pro';
import { PRO_PATH, showsPro } from '@/lib/pro';
import { TEXT_LINK } from '@/styles/classes';
import type { Tier } from '@/types/user';

// Shown only while the Free/Pro split is on
export function ProfilePlan({ tier }: { tier: Tier }) {
  const config = useAppConfig();
  if (!showsPro(config.data ?? null)) return null;

  return (
    <p className="w-full text-14 leading-5 text-fg-muted">
      {tier === 'pro' ? (
        "You're on Pro."
      ) : (
        <>
          You&apos;re on the Free plan.{' '}
          <Link href={PRO_PATH} className={TEXT_LINK}>
            See Pro
          </Link>
        </>
      )}
    </p>
  );
}
