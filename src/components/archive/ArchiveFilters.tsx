'use client';

import React, { useId, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import FilterPanel from '@/components/play/FilterPanel';
import FilterSkeleton from '@/components/play/FilterSkeleton';
import { Badge } from '@/components/ui/badge';
import { activeFilterCount, activeFiltersLabel } from '@/lib/archive';
import { SECONDARY_BUTTON } from '@/styles/classes';
import type { FilterOptions } from '@/types/catalog';
import type { Filters } from '@/types/filters';

export type ArchiveFilterState = {
  options: FilterOptions;
  filters: Filters;
};

type Props = {
  // Null while the options load
  state: ArchiveFilterState | null;
  onChange: (filters: Filters) => void;
};

// Folded: on an index, the list is the page
const ArchiveFilters = ({ state, onChange }: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const active = state
    ? activeFiltersLabel(state.filters, state.options)
    : null;
  const count = state ? activeFilterCount(state.filters, state.options) : 0;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen((open) => !open)}
          className={`inline-flex items-center gap-2 ${SECONDARY_BUTTON}`}
        >
          <SlidersHorizontal aria-hidden="true" className="size-4" />
          {isOpen ? 'Hide filters' : 'Filters'}
          {/* The line beside it names them for readers */}
          {count > 0 ? (
            <Badge aria-hidden="true" tone="butter" className="px-1.5">
              {count}
            </Badge>
          ) : null}
        </button>
        {active ? (
          <p className="min-w-0 text-14 leading-5 text-fg-muted">{active}</p>
        ) : null}
      </div>
      <div
        id={panelId}
        hidden={!isOpen}
        // FilterPanel draws its own rule on top
        className="pt-2"
      >
        {state ? (
          <FilterPanel
            options={state.options}
            filters={state.filters}
            onChange={onChange}
          />
        ) : (
          <FilterSkeleton />
        )}
      </div>
    </div>
  );
};

export default ArchiveFilters;
