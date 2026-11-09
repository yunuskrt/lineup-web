'use client';

import { ClubCrest } from '@/components/game/ClubCrest';
import { CompetitionLogo } from '@/components/game/CompetitionLogo';
import {
  LandingSkeleton,
  SKELETON_BLOCK,
} from '@/components/home/LandingSkeleton';
import { useCatalogOverview } from '@/hooks/use-catalog-overview';
import { TOP_CLUBS_MAX } from '@/lib/api/schemas/catalog';
import {
  formatCount,
  highlightFigures,
  landingCompetitions,
} from '@/lib/landing';
import { SITE_CONTAINER } from '@/styles/classes';
import type { CatalogOverview } from '@/types/catalog';

// Two rows on wide screens, as the real pool fills
const SKELETON_COMPETITIONS = 8;
const HIGHLIGHT_COUNT = 4;

const COMPETITION_ROW = 'flex flex-wrap gap-x-6 gap-y-3';
const CREST_ROW = 'flex flex-wrap gap-3';
const HIGHLIGHTS = 'grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4';

function InsideSkeleton() {
  return (
    <LandingSkeleton>
      <div className="flex flex-col gap-10">
        <div className={COMPETITION_ROW}>
          {Array.from({ length: SKELETON_COMPETITIONS }, (_, index) => (
            <span key={index} className="flex h-6 items-center gap-2">
              <span className={`size-6 ${SKELETON_BLOCK}`} />
              <span className={`h-4 w-28 ${SKELETON_BLOCK}`} />
            </span>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <span className={`h-5 w-36 sm:h-6 ${SKELETON_BLOCK}`} />
          <div className={CREST_ROW}>
            {Array.from({ length: TOP_CLUBS_MAX }, (_, index) => (
              <span
                key={index}
                className={`size-8 sm:size-10 ${SKELETON_BLOCK}`}
              />
            ))}
          </div>
        </div>
        <div className={HIGHLIGHTS}>
          {Array.from({ length: HIGHLIGHT_COUNT }, (_, index) => (
            <div key={index} className="flex flex-col gap-1">
              <span className={`h-8 w-20 sm:h-10 ${SKELETON_BLOCK}`} />
              <span className={`h-5 w-28 sm:h-6 ${SKELETON_BLOCK}`} />
            </div>
          ))}
        </div>
      </div>
    </LandingSkeleton>
  );
}

function InsideContent({ overview }: { overview: CatalogOverview }) {
  return (
    <div className="flex flex-col gap-10">
      <ul aria-label="Competitions" className={COMPETITION_ROW}>
        {landingCompetitions(overview).map((competition) => (
          <li
            key={competition.id}
            className="flex h-6 min-w-0 items-center gap-2 text-14 text-fg sm:text-16"
          >
            <CompetitionLogo competition={competition} className="size-6" />
            <span className="min-w-0 truncate">{competition.name}</span>
          </li>
        ))}
      </ul>
      {overview.topClubs.length > 0 ? (
        <div className="flex flex-col gap-3">
          <h3
            id="home-top-clubs"
            className="text-14 leading-5 text-fg-muted sm:text-16 sm:leading-6"
          >
            Most-played clubs
          </h3>
          <ul aria-labelledby="home-top-clubs" className={CREST_ROW}>
            {overview.topClubs.map((club) => (
              <li key={club.id} title={club.name}>
                <ClubCrest club={club} />
                <span className="sr-only">{club.name}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <dl className={HIGHLIGHTS}>
        {highlightFigures(overview).map((figure) => (
          <div key={figure.key} className="flex flex-col gap-1">
            <dt className="order-2 text-14 leading-5 text-fg-muted sm:text-16 sm:leading-6">
              {figure.label}
            </dt>
            <dd className="order-1 font-display text-24 leading-8 font-bold tabular-nums sm:text-32 sm:leading-10">
              {formatCount(figure.value)}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

type InsideBandProps = {
  overview: CatalogOverview | null;
  isLoading: boolean;
};

export function InsideBand({ overview, isLoading }: InsideBandProps) {
  if (!overview && !isLoading) return null;

  return (
    <section aria-labelledby="home-inside" className="border-t border-line">
      <div className={`${SITE_CONTAINER} py-16`}>
        <h2 id="home-inside" className="sr-only">
          What&apos;s inside
        </h2>
        {overview ? <InsideContent overview={overview} /> : <InsideSkeleton />}
      </div>
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
