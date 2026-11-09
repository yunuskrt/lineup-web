'use client';

import { ArchiveBand } from '@/components/home/HomeArchive';
import { HomeFold } from '@/components/home/HomeFold';
import { InsideBand } from '@/components/home/HomeInside';
import { HomeModes } from '@/components/home/HomeModes';
import { HomeRules } from '@/components/home/HomeRules';
import { ShowcaseFrame } from '@/components/home/ShowcaseFrame';
import type { LandingState } from '@/lib/dev/landing-states';

// The landing body on fixed data; no fetch
export function LandingStatePreview({ state }: { state: LandingState }) {
  const { overview, isLoading } = state;

  return (
    <>
      <HomeFold
        showcase={
          <ShowcaseFrame
            showcase={overview?.showcase ?? null}
            isLoading={isLoading}
          />
        }
      />
      <ArchiveBand overview={overview} isLoading={isLoading} />
      <HomeRules />
      <HomeModes />
      <InsideBand overview={overview} isLoading={isLoading} />
    </>
  );
}
