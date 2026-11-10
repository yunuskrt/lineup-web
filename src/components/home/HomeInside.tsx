'use client';

import { motion } from 'motion/react';
import { ClubCrest } from '@/components/game/ClubCrest';
import { CompetitionLogo } from '@/components/game/CompetitionLogo';
import { CountUp } from '@/components/home/CountUp';
import {
  LandingSkeleton,
  SKELETON_BLOCK,
} from '@/components/home/LandingSkeleton';
import { useCatalogOverview } from '@/hooks/use-catalog-overview';
import { useEntrance } from '@/hooks/use-entrance';
import { TOP_CLUBS_MAX } from '@/lib/api/schemas/catalog';
import { highlightFigures, landingCompetitions } from '@/lib/landing';
import { SITE_CONTAINER } from '@/styles/classes';
import { LANDING_TIGHT_STAGGER_MS } from '@/styles/motion';
import type { CatalogOverview } from '@/types/catalog';

// Two rows on wide screens, as the real pool fills
const SKELETON_COMPETITIONS = 8;
const CREST_FROM_SCALE = 0.92;
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
        <div className={CREST_ROW}>
          {Array.from({ length: TOP_CLUBS_MAX }, (_, index) => (
            <span
              key={index}
              className={`size-8 sm:size-10 ${SKELETON_BLOCK}`}
            />
          ))}
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
  const { ref, item } = useEntrance<HTMLDivElement>();
  const competitions = landingCompetitions(overview);
  // Crests follow the last logo in
  const crestsDelayMs = competitions.length * LANDING_TIGHT_STAGGER_MS;

  return (
    <div ref={ref} className="flex flex-col gap-10">
      <ul aria-label="Competitions" className={COMPETITION_ROW}>
        {competitions.map((competition, index) => (
          <motion.li
            key={competition.id}
            className="flex h-6 min-w-0 items-center gap-2 text-14 text-fg sm:text-16"
            {...item(index, { staggerMs: LANDING_TIGHT_STAGGER_MS })}
          >
            <CompetitionLogo competition={competition} className="size-6" />
            <span className="min-w-0 truncate">{competition.name}</span>
          </motion.li>
        ))}
      </ul>
      {overview.topClubs.length > 0 ? (
        <ul aria-label="Clubs with the most matches" className={CREST_ROW}>
          {overview.topClubs.map((club, index) => (
            <motion.li
              key={club.id}
              title={club.name}
              {...item(index, {
                staggerMs: LANDING_TIGHT_STAGGER_MS,
                fromScale: CREST_FROM_SCALE,
                delayMs: crestsDelayMs,
              })}
            >
              <ClubCrest club={club} />
              <span className="sr-only">{club.name}</span>
            </motion.li>
          ))}
        </ul>
      ) : null}
      <dl className={HIGHLIGHTS}>
        {highlightFigures(overview).map((figure) => (
          <div key={figure.key} className="flex flex-col gap-1">
            <dt className="order-2 text-14 leading-5 text-fg-muted sm:text-16 sm:leading-6">
              {figure.label}
            </dt>
            <dd className="order-1 font-display text-24 leading-8 font-bold tabular-nums sm:text-32 sm:leading-10">
              <CountUp value={figure.value} />
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
        <h2 id="home-inside" className="mb-8 font-display text-24 font-bold">
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
