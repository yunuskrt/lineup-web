'use client';

import {
  CalendarRange,
  type LucideIcon,
  Shield,
  Trophy,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { CountUp } from '@/components/home/CountUp';
import { LandingSkeleton } from '@/components/home/LandingSkeleton';
import { useCatalogOverview } from '@/hooks/use-catalog-overview';
import { useEntrance } from '@/hooks/use-entrance';
import { archiveFigures } from '@/lib/landing';
import {
  HOME_BAND,
  ICON_TILE,
  SITE_CONTAINER,
  TYPE_NUMBER,
} from '@/styles/classes';
import type { CatalogOverview } from '@/types/catalog';
import { SKELETON } from '@/components/ui/skeleton';

const FIGURE_COUNT = 4;

// Row gap leaves room for the corner icons
const TILES = 'grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-4 sm:gap-x-4';

const TILE =
  'relative flex flex-col gap-2 rounded-lg border-2 border-line bg-surface-card px-4 pt-8 pb-4 shadow-hard sm:px-6 sm:pt-9 sm:pb-6';

const CORNER = `absolute -top-4 left-3 size-9 bg-block-butter ${ICON_TILE}`;

const FIGURE_ICONS: Record<string, LucideIcon> = {
  matches: Trophy,
  players: Users,
  sides: Shield,
  seasons: CalendarRange,
};

// Two label lines kept, so tiles never jump
const LABEL_BOX = 'min-h-10 sm:min-h-12';

// Same tiles as the loaded row, so nothing shifts
function ArchiveSkeleton() {
  return (
    <LandingSkeleton>
      <div className={TILES}>
        {Array.from({ length: FIGURE_COUNT }, (_, index) => (
          <div key={index} className={TILE}>
            <span className={CORNER} />
            <span className={`h-10 w-24 sm:h-15 sm:w-32 ${SKELETON}`} />
            <span className={LABEL_BOX}>
              <span className={`block h-5 w-20 sm:h-6 ${SKELETON}`} />
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
      {archiveFigures(overview).map((figure, index) => {
        const Icon = FIGURE_ICONS[figure.key] ?? Trophy;
        return (
          <motion.div key={figure.key} className={TILE} {...item(index)}>
            <span aria-hidden="true" className={CORNER}>
              <Icon className="size-4.5" strokeWidth={2.25} />
            </span>
            <dt
              className={`order-last text-14 leading-5 text-fg-muted sm:text-16 sm:leading-6 ${LABEL_BOX}`}
            >
              {figure.label}
            </dt>
            {/* A dl group holds only dt and dd */}
            <dd
              className={`text-32 leading-10 sm:text-48 sm:leading-15 ${TYPE_NUMBER}`}
            >
              <CountUp value={figure.value} />
            </dd>
          </motion.div>
        );
      })}
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
    <section
      aria-labelledby="home-archive"
      className={`${HOME_BAND} bg-block-lavender`}
    >
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
