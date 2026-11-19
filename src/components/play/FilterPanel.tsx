import React from 'react';
import ClubFilter from '@/components/play/filter-panel/ClubFilter';
import CompetitionFilter from '@/components/play/filter-panel/CompetitionFilter';
import EraFilter from '@/components/play/filter-panel/EraFilter';
import { pickedCompetition } from '@/lib/filters';
import type { FilterOptions } from '@/types/catalog';
import type { Filters } from '@/types/filters';

export type FilterPanelProps = {
  options: FilterOptions;
  filters: Filters;
  onChange: (filters: Filters) => void;
};

type Props = FilterPanelProps;

const FilterPanel = (props: Props) => {
  const picked = pickedCompetition(props.filters, props.options);

  return (
    <div>
      <CompetitionFilter {...props} />
      <ClubFilter key={picked?.id ?? 'any'} {...props} />
      <EraFilter {...props} />
    </div>
  );
};

export default FilterPanel;
