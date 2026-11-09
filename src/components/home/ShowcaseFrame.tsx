'use client';

import { CountdownRing } from '@/components/game/CountdownRing';
import { GuessInput } from '@/components/game/GuessInput';
import { MatchHeader } from '@/components/game/MatchHeader';
import { SKELETON_BLOCK } from '@/components/home/LandingSkeleton';
import { SquadGrid } from '@/components/pitch/SquadGrid';
import { useCatalogOverview } from '@/hooks/use-catalog-overview';
import { UNSTARTED_ROUND } from '@/lib/canvas';
import { LOADING_FORMATION } from '@/lib/formation';
import {
  showcaseCaption,
  showcaseFound,
  showcaseSentence,
} from '@/lib/landing';
import type { Showcase } from '@/types/catalog';

const IGNORE = () => {};

type ShowcaseFrameProps = {
  showcase: Showcase | null;
  isLoading: boolean;
};

// A still frame of a turn; Landing B plays it
export function ShowcaseFrame({ showcase, isLoading }: ShowcaseFrameProps) {
  if (!showcase && !isLoading) return null;
  const found = showcase ? showcaseFound(showcase) : [];

  return (
    <figure className="flex w-full max-w-140 flex-col gap-3 lg:max-w-none">
      <div
        inert
        aria-hidden="true"
        className="flex flex-col gap-2 rounded-lg border border-line bg-surface-raised p-2"
      >
        <MatchHeader match={showcase?.match ?? null} found={found} />
        <div className="h-72 sm:h-80">
          <SquadGrid
            formation={showcase?.match.formation ?? LOADING_FORMATION}
            revealed={found}
            isLoading={!showcase}
          />
        </div>
        {/* Phones stack them, as the game's band does */}
        <div className="flex flex-col items-center gap-3 border-t border-line px-2 pt-3 pb-1 sm:flex-row sm:gap-4">
          <CountdownRing round={UNSTARTED_ROUND} mode="frozen" />
          <div className="w-full min-w-0 sm:flex-1">
            <GuessInput
              status="live"
              value=""
              onValueChange={IGNORE}
              onSubmit={IGNORE}
              shakeKey={0}
            />
          </div>
        </div>
      </div>
      {showcase ? (
        <>
          <figcaption className="text-14 text-fg-muted">
            {showcaseCaption(showcase)}
          </figcaption>
          <p className="sr-only">{showcaseSentence(showcase)}</p>
        </>
      ) : (
        <span aria-hidden="true" className={`h-5 w-48 ${SKELETON_BLOCK}`} />
      )}
    </figure>
  );
}

export function HomeShowcase() {
  const overview = useCatalogOverview();

  return (
    <ShowcaseFrame
      showcase={overview.data?.showcase ?? null}
      isLoading={overview.isPending}
    />
  );
}
