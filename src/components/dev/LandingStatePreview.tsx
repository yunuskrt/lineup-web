'use client';

import { ArchiveBand } from '@/components/home/HomeArchive';
import { HomeFold } from '@/components/home/HomeFold';
import { InsideBand } from '@/components/home/HomeInside';
import { HomeModes } from '@/components/home/HomeModes';
import { HomeRules } from '@/components/home/HomeRules';
import { ShowcaseFrame } from '@/components/home/ShowcaseFrame';
import type { LandingState } from '@/lib/dev/landing-states';

// The landing body on fixed data; no fetch
type LandingStatePreviewProps = {
  state: LandingState;
  frozenAtMs?: number;
};

export function LandingStatePreview({
  state,
  frozenAtMs,
}: LandingStatePreviewProps) {
  const { overview, isLoading } = state;
  const playback =
    frozenAtMs === undefined
      ? state.playback
      : { ...state.playback, frozenAtMs };

  return (
    <>
      <HomeFold
        showcase={
          <ShowcaseFrame
            showcase={overview?.showcase ?? null}
            isLoading={isLoading}
            playback={playback}
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
