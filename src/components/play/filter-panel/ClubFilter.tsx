import React, { useId, useState } from 'react';
import { Search } from 'lucide-react';
import ClubChipImage from '@/components/play/filter-panel/ClubChipImage';
import type { FilterPanelProps } from '@/components/play/FilterPanel';
import Chip from '@/components/play/filter-panel/Chip';
import FilterRow from '@/components/play/filter-panel/FilterRow';
import { FILTER_NOTE } from '@/components/play/styles';
import { CLUB_HINT } from '@/components/play/shared';
import { Input } from '@/components/ui/input';
import { clubRowView, toggleId } from '@/lib/filters';
import { pluralOf } from '@/lib/plural';
import { FILTER_SEARCH } from '@/styles/classes';

function countLabel(count: number): string {
  return `${count} ${pluralOf(count, 'club', 'clubs')} found`;
}

type Props = FilterPanelProps;

// Keyed by competition: a new pick clears it
const ClubFilter = ({ options, filters, onChange }: Props) => {
  const [query, setQuery] = useState('');
  const hintId = useId();
  const view = clubRowView(filters, options, query);

  return (
    <FilterRow label="Club">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Chip
            isPressed={filters.clubIds.length === 0}
            onClick={() => onChange({ ...filters, clubIds: [] })}
          >
            Any club
          </Chip>
          {view.hasSearch ? (
            <span className="relative max-md:w-full md:w-64">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-muted"
              />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search clubs"
                aria-describedby={view.isSearchingAll ? hintId : undefined}
                placeholder="Search clubs"
                className={FILTER_SEARCH}
              />
            </span>
          ) : null}
        </div>
        {view.isSearchingAll ? (
          <p id={hintId} className={FILTER_NOTE}>
            {CLUB_HINT}
          </p>
        ) : null}
        {view.clubs.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {view.clubs.map((club) => (
              <Chip
                key={club.id}
                isPressed={filters.clubIds.includes(club.id)}
                image={<ClubChipImage club={club} />}
                onClick={() =>
                  onChange({
                    ...filters,
                    clubIds: toggleId(filters.clubIds, club.id, options.clubs),
                  })
                }
              >
                {club.name}
              </Chip>
            ))}
          </div>
        ) : null}
        {view.matchCount === 0 ? (
          <p className={FILTER_NOTE}>No club matches that name.</p>
        ) : null}
        {view.moreCount > 0 ? (
          <p className={FILTER_NOTE}>
            {view.moreCount} more. Keep typing to narrow it down.
          </p>
        ) : null}
        <p className="sr-only" aria-live="polite">
          {view.matchCount === null ? '' : countLabel(view.matchCount)}
        </p>
      </div>
    </FilterRow>
  );
};

export default ClubFilter;
