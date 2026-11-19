import React from 'react';
import type { FilterPanelProps } from '@/components/play/FilterPanel';
import FilterRow from '@/components/play/filter-panel/FilterRow';
import SeasonSelect from '@/components/play/filter-panel/SeasonSelect';
import { effectiveSeasons } from '@/lib/filters';

type Props = FilterPanelProps;

const EraFilter = ({ options, filters, onChange }: Props) => {
  const { era } = filters;
  const seasons = effectiveSeasons(filters, options);

  return (
    <FilterRow label="Era">
      <div className="flex flex-wrap items-center gap-3 text-14 text-fg-muted">
        <SeasonSelect
          label="From"
          value={era.from}
          seasons={seasons}
          onChange={(from) =>
            onChange({ ...filters, era: { from, to: Math.max(from, era.to) } })
          }
        />
        <SeasonSelect
          label="to"
          value={era.to}
          seasons={seasons.filter((season) => season >= era.from)}
          onChange={(to) => onChange({ ...filters, era: { ...era, to } })}
        />
      </div>
    </FilterRow>
  );
};

export default EraFilter;
