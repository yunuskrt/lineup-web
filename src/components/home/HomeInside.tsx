'use client';

import { ClubCrest } from '@/components/game/ClubCrest';
import { CompetitionLogo } from '@/components/game/CompetitionLogo';
import { LandingSkeleton } from '@/components/home/LandingSkeleton';
import { useCatalogOverview } from '@/hooks/use-catalog-overview';
import { landingCompetitions } from '@/lib/landing';
import { HOME_BAND } from '@/styles/classes';
import type { CatalogOverview } from '@/types/catalog';
import { Marquee } from '@/components/ui/marquee';
import { SKELETON } from '@/components/ui/skeleton';

const SKELETON_TILES = 10;

// The closing band's rule sits right under it
const STRIP = 'bg-scoreboard py-4';
const PILL =
  'flex h-11 shrink-0 items-center gap-2 rounded-full border-2 border-line bg-surface-card px-3 text-14 font-medium whitespace-nowrap text-fg';
const CREST_TILE =
  'flex size-11 shrink-0 items-center justify-center rounded-md border-2 border-line bg-surface-card';

function StripSkeleton() {
  return (
    <LandingSkeleton>
      <div className={STRIP}>
        <div className="flex gap-3 overflow-hidden px-4">
          {Array.from({ length: SKELETON_TILES }, (_, index) => (
            <span key={index} className={`h-11 w-32 shrink-0 ${SKELETON}`} />
          ))}
        </div>
      </div>
    </LandingSkeleton>
  );
}

// Decorative: the hidden lists say it to readers
function LogoStrip({ overview }: { overview: CatalogOverview }) {
  return (
    <div aria-hidden="true" className={STRIP}>
      <Marquee className="px-4">
        {landingCompetitions(overview).map((competition) => (
          <span key={competition.id} className={PILL}>
            <CompetitionLogo competition={competition} className="size-6" />
            {competition.name}
          </span>
        ))}
        {overview.topClubs.map((club) => (
          <span key={club.id} className={CREST_TILE}>
            <ClubCrest club={club} size="row" />
          </span>
        ))}
      </Marquee>
    </div>
  );
}

function InsideLists({ overview }: { overview: CatalogOverview }) {
  return (
    <>
      <ul aria-label="Competitions" className="sr-only">
        {landingCompetitions(overview).map((competition) => (
          <li key={competition.id}>{competition.name}</li>
        ))}
      </ul>
      {overview.topClubs.length > 0 ? (
        <ul aria-label="Clubs with the most matches" className="sr-only">
          {overview.topClubs.map((club) => (
            <li key={club.id}>{club.name}</li>
          ))}
        </ul>
      ) : null}
    </>
  );
}

type InsideBandProps = {
  overview: CatalogOverview | null;
  isLoading: boolean;
};

export function InsideBand({ overview, isLoading }: InsideBandProps) {
  if (!overview && !isLoading) return null;

  return (
    <section aria-labelledby="home-inside" className={HOME_BAND}>
      <h2 id="home-inside" className="sr-only">
        What&apos;s inside
      </h2>
      {overview ? (
        <>
          <LogoStrip overview={overview} />
          <InsideLists overview={overview} />
        </>
      ) : (
        <StripSkeleton />
      )}
    </section>
  );
}

export function HomeInside() {
  const overview = useCatalogOverview();

  return (
    <InsideBand
      overview={overview.data ?? null}
      isLoading={overview.isPending}
    />
  );
}
