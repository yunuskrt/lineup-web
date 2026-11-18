'use client';

import React from 'react';
import InsideBand from '@/components/home/home-inside/InsideBand';
import { useCatalogOverview } from '@/hooks/use-catalog-overview';

type Props = {};

const HomeInside = ({}: Props) => {
  const overview = useCatalogOverview();

  return (
    <InsideBand
      overview={overview.data ?? null}
      isLoading={overview.isPending}
    />
  );
};

export default HomeInside;
