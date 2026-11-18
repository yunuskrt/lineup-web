import React from 'react';
import ArchiveSkeleton from '@/components/home/home-archive/ArchiveSkeleton';
import ArchiveTiles from '@/components/home/home-archive/ArchiveTiles';
import { HOME_BAND, SITE_CONTAINER } from '@/styles/classes';
import type { CatalogOverview } from '@/types/catalog';

type Props = {
  overview: CatalogOverview | null;
  isLoading: boolean;
};

const ArchiveBand = ({ overview, isLoading }: Props) => {
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
};

export default ArchiveBand;
