'use client';

import React from 'react';
import ShowcaseFrame from '@/components/home/ShowcaseFrame';
import { useCatalogOverview } from '@/hooks/use-catalog-overview';

type Props = {};

const HomeShowcase = ({}: Props) => {
  const overview = useCatalogOverview();

  return (
    <ShowcaseFrame
      showcase={overview.data?.showcase ?? null}
      isLoading={overview.isPending}
    />
  );
};

export default HomeShowcase;
