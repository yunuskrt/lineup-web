'use client';

import { useId, useState } from 'react';
import { FilterPanel } from '@/components/play/FilterPanel';
import { FilterSkeleton } from '@/components/play/FilterSkeleton';
import { activeFiltersLabel } from '@/lib/archive';
import { SECONDARY_BUTTON } from '@/styles/classes';
import type { FilterOptions } from '@/types/catalog';
import type { Filters } from '@/types/filters';

export type ArchiveFilterState = {
  options: FilterOptions;
  filters: Filters;
};

type ArchiveFiltersProps = {
  // Null while the options load
  state: ArchiveFilterState | null;
  onChange: (filters: Filters) => void;
};

// Folded: on an index, the list is the page
export function ArchiveFilters({ state, onChange }: ArchiveFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelId = useId();
  const active = state
    ? activeFiltersLabel(state.filters, state.options)
    : null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={() => setIsOpen((open) => !open)}
          className={SECONDARY_BUTTON}
        >
          {isOpen ? 'Hide filters' : 'Filters'}
        </button>
        {active ? (
          <p className="min-w-0 text-14 leading-5 text-fg-muted">{active}</p>
        ) : null}
      </div>
      <div id={panelId} hidden={!isOpen}>
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
}
