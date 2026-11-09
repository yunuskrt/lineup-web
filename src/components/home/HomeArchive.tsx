'use client';

import { CountUp } from '@/components/home/CountUp';
import {
  LandingSkeleton,
  SKELETON_BLOCK,
} from '@/components/home/LandingSkeleton';
import { useCatalogOverview } from '@/hooks/use-catalog-overview';
import { archiveFigures, eraLine } from '@/lib/landing';
import { SITE_CONTAINER } from '@/styles/classes';
import type { CatalogOverview } from '@/types/catalog';

const FIGURE_COUNT = 4;

const FIGURES = 'grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4';

// Same heights as the loaded row, so nothing shifts
function ArchiveSkeleton() {
  return (
    <LandingSkeleton>
      <div className={FIGURES}>
        {Array.from({ length: FIGURE_COUNT }, (_, index) => (
          <div key={index} className="flex flex-col gap-1">
            <span className={`h-10 w-28 sm:h-15 sm:w-40 ${SKELETON_BLOCK}`} />
            <span className={`h-6 w-24 sm:h-7.5 ${SKELETON_BLOCK}`} />
          </div>
        ))}
      </div>
      <span className={`mt-6 block h-6 w-56 sm:h-7.5 ${SKELETON_BLOCK}`} />
    </LandingSkeleton>
  );
}

type ArchiveBandProps = {
  overview: CatalogOverview | null;
  isLoading: boolean;
};

export function ArchiveBand({ overview, isLoading }: ArchiveBandProps) {
  if (!overview && !isLoading) return null;

  return (
    <section aria-labelledby="home-archive" className="border-t border-line">
      <div className={`${SITE_CONTAINER} py-16`}>
        <h2 id="home-archive" className="sr-only">
          The archive
        </h2>
        {overview ? (
          <>
            <dl className={FIGURES}>
              {archiveFigures(overview).map((figure) => (
                <div key={figure.key} className="flex flex-col gap-1">
                  <dt className="order-2 text-16 text-fg-muted sm:text-20">
                    {figure.label}
                  </dt>
                  <dd className="order-1 font-display text-32 leading-10 font-bold tabular-nums sm:text-48 sm:leading-15">
                    <CountUp value={figure.value} />
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 text-16 text-fg-muted sm:text-20">
              Seasons {eraLine(overview.era)}.
            </p>
          </>
        ) : (
          <ArchiveSkeleton />
        )}
      </div>
    </section>
  );
}

export function HomeArchive() {
  const overview = useCatalogOverview();

  return (
    <ArchiveBand
      overview={overview.data ?? null}
      isLoading={overview.isPending}
    />
  );
}
