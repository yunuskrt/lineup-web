'use client';

import { motion } from 'motion/react';
import { CountUp } from '@/components/home/CountUp';
import {
  LandingSkeleton,
  SKELETON_BLOCK,
} from '@/components/home/LandingSkeleton';
import { useCatalogOverview } from '@/hooks/use-catalog-overview';
import { useEntrance } from '@/hooks/use-entrance';
import { archiveFigures } from '@/lib/landing';
import { SITE_CONTAINER } from '@/styles/classes';
import type { CatalogOverview } from '@/types/catalog';

const FIGURE_COUNT = 4;

const TILES = 'grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4';

const TILE =
  'flex flex-col gap-3 rounded-md border border-line bg-surface-raised p-4 sm:p-6';

const BAR = 'h-0.5 w-8 bg-brand';

// Two label lines kept, so tiles never jump
const LABEL_BOX = 'min-h-10 sm:min-h-12';

// Same tiles as the loaded row, so nothing shifts
function ArchiveSkeleton() {
  return (
    <LandingSkeleton>
      <div className={TILES}>
        {Array.from({ length: FIGURE_COUNT }, (_, index) => (
          <div key={index} className={TILE}>
            <span className={BAR} />
            <span className={`h-10 w-24 sm:h-15 sm:w-32 ${SKELETON_BLOCK}`} />
            <span className={LABEL_BOX}>
              <span className={`block h-5 w-20 sm:h-6 ${SKELETON_BLOCK}`} />
            </span>
          </div>
        ))}
      </div>
    </LandingSkeleton>
  );
}

function ArchiveTiles({ overview }: { overview: CatalogOverview }) {
  const { ref, item } = useEntrance<HTMLDListElement>();

  return (
    <dl ref={ref} className={TILES}>
      {archiveFigures(overview).map((figure, index) => (
        <motion.div key={figure.key} className={TILE} {...item(index)}>
          <dt
            className={`order-last text-14 leading-5 text-fg-muted sm:text-16 sm:leading-6 ${LABEL_BOX}`}
          >
            {figure.label}
          </dt>
          {/* A dl group holds only dt and dd */}
          <dd className="flex flex-col gap-3 font-display text-32 leading-10 font-bold tabular-nums sm:text-48 sm:leading-15">
            <span aria-hidden="true" className={BAR} />
            <span>
              <CountUp value={figure.value} />
            </span>
          </dd>
        </motion.div>
      ))}
    </dl>
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
        {overview ? <ArchiveTiles overview={overview} /> : <ArchiveSkeleton />}
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
