'use client';

import React from 'react';
import ArchiveBand from '@/components/home/home-archive/ArchiveBand';
import { useCatalogOverview } from '@/hooks/use-catalog-overview';

type Props = {};

const HomeArchive = ({}: Props) => {
  const overview = useCatalogOverview();

  return (
    <ArchiveBand
      overview={overview.data ?? null}
      isLoading={overview.isPending}
    />
  );
};

export default HomeArchive;
