'use client';

import { useState } from 'react';
import { ArchiveView } from '@/components/archive/ArchiveView';
import { resolveArchiveState } from '@/lib/dev/archive-states';
import { SAMPLE_FILTER_OPTIONS, SAMPLE_OPEN_FILTERS } from '@/lib/dev/samples';

type ArchiveStatePreviewProps = {
  state?: string | string[];
};

// No server: only the box and panel are live
export function ArchiveStatePreview({ state }: ArchiveStatePreviewProps) {
  const snapshot = resolveArchiveState(state);
  const [search, setSearch] = useState(snapshot.search);
  const [filters, setFilters] = useState(SAMPLE_OPEN_FILTERS);

  return (
    <ArchiveView
      view={snapshot.view}
      search={search}
      filterState={{ options: SAMPLE_FILTER_OPTIONS, filters }}
      clearLabel={search ? 'Clear search' : 'Clear filters'}
      onSearchChange={setSearch}
      onSearchSubmit={() => {}}
      onFiltersChange={setFilters}
      onClear={() => setSearch('')}
      onRetry={() => {}}
      onShowMore={() => {}}
      onPlay={() => {}}
      startingId={null}
    />
  );
}
