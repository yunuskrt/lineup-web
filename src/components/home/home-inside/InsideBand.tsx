import React from 'react';
import InsideLists from '@/components/home/home-inside/InsideLists';
import LogoStrip from '@/components/home/home-inside/LogoStrip';
import StripSkeleton from '@/components/home/home-inside/StripSkeleton';
import { HOME_BAND } from '@/styles/classes';
import type { CatalogOverview } from '@/types/catalog';

type Props = {
  overview: CatalogOverview | null;
  isLoading: boolean;
};

const InsideBand = ({ overview, isLoading }: Props) => {
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
};

export default InsideBand;
